# GridSphere Weather Station API — Node.js Migration

This is a complete migration of the original **FastAPI + SQLAlchemy** backend
(`GridSphere Weather Station API v2.0.0`) to **Node.js + Express + TypeScript
+ Prisma**, preserving every route, request/response shape, and piece of
business logic. It also adds **Swagger UI** (`/docs`) for interactive API
exploration and testing, since the original FastAPI app got this for free
via `/docs` but Express doesn't include it out of the box.

---

## 1. Original project analysis

### Files/modules identified
| Python file | Purpose | Node.js equivalent |
|---|---|---|
| `app/main.py` | App init, CORS, router mounting | `src/app.ts`, `src/server.ts` |
| `app/dependencies.py` | `get_db`, `get_current_user` (JWT auth dependency) | `src/config/prisma.ts`, `src/middleware/auth.ts` |
| `app/db/database.py` | SQLAlchemy engine/session/Base | `prisma/schema.prisma` + `src/config/prisma.ts` |
| `app/models/*.py` (10 files) | SQLAlchemy ORM models | `prisma/schema.prisma` (10 models) |
| `app/schemas/*.py` | Pydantic request/response schemas | `src/schemas/*.ts` (Zod) |
| `app/routers/*.py` (7 files) | FastAPI routers | `src/routes/*.ts` + `src/controllers/*.ts` |
| `app/repositories/*.py` | DB access helpers | `src/services/*Repository.ts` |
| `app/services/auth_service.py` | Registration/login business logic | `src/services/authService.ts` |
| `app/utils/security.py` | bcrypt hash/verify | `src/utils/security.ts` |
| `app/utils/jwt_handler.py` | JWT creation | `src/utils/jwtHandler.ts` |
| `data_link.py` | Dev seed script | `prisma/seed.ts` |
| `tests/*.py` | Empty stub files (no actual tests) | Not migrated (nothing to migrate) |

Several source files were **empty stubs** in the original project and were
not migrated because they contained no logic: `app/core/config.py`,
`app/core/constants.py`, `app/core/exceptions.py`, `app/core/middleware.py`,
`app/repositories/sensor_repo.py`, `app/repositories/subscription_repo.py`,
`app/schemas/reading_schema.py`, `app/schemas/subscription_schema.py`,
`app/services/device_service.py`, `app/services/reading_service.py`,
`app/services/sensor_service.py`, `app/services/subscription_service.py`,
`app/utils/hashing.py`, `app/utils/helpers.py`, and all three test files.

### API routes identified (all preserved exactly)
| Method | Path | Auth required | Handler |
|---|---|---|---|
| GET | `/` | No | Health check |
| POST | `/register` | No | Register user |
| POST | `/login` | No | Login (form-encoded `username`/`password`) |
| POST | `/logout` | No | Logout (client-side token discard) |
| GET | `/checkSession` | Yes | Verify JWT is valid |
| POST | `/devices/` | Yes | Create device (+ owner link) |
| GET | `/devices/` | Yes | List my devices |
| GET | `/devices/:device_id/live-data` | Yes | Latest reading for device |
| GET | `/devices/:device_id/history` | Yes | Historical readings (daily/weekly/monthly/custom) |
| GET | `/devices/:device_id/industry` | Yes | Mock industry label |
| POST | `/devices/:device_id/industry` | Yes | Mock industry update |
| GET | `/users/` | Yes | Current user profile |
| GET | `/readings/add` | No | IoT device data ingestion (query params) |
| GET | `/readings/:d_id/history` | Yes | Latest N readings for a device |
| GET | `/sensors/types` | No | List sensor types |
| POST | `/sensors/types` | No | Create sensor type |
| GET | `/sensors/device/:device_id` | Yes | List sensors installed on a device |
| POST | `/sensors/device` | Yes | Install a sensor on a device |
| PATCH | `/sensors/device/sensor/:device_sensor_id` | Yes | Update an installed sensor |
| GET | `/subscriptions/plans` | No | List subscription plans |
| GET | `/subscriptions/device/:device_id` | Yes | Active subscription for a device |

> **`plan_router.py`** existed in the original source but was **never
> registered** in `app/main.py`'s `include_router(...)` calls, so it was
> unreachable dead code in the original API. That exact behavior is
> preserved: `src/routes/planRoutes.ts` / `src/controllers/planController.ts`
> exist for reference but are **not mounted** in `src/app.ts`.

### Database models (10 tables, preserved 1:1 in `prisma/schema.prisma`)
`users`, `devices`, `device_users`, `sensor_types`, `device_sensors`,
`sensor_readings`, `raw_payloads`, `device_sensor_history`,
`subscription_plans`, `device_subscriptions` — same table names, column
names (via Prisma `@map`), types, defaults, and foreign keys as the
SQLAlchemy models.

### Authentication logic
- Passwords hashed with bcrypt (`passlib` → `bcryptjs`, same algorithm).
- JWT signed with `HS256`, `sub` claim = user id, default 7-day expiry —
  identical to the original `SECRET_KEY`/`ALGORITHM` values (now sourced
  from `.env` instead of being hardcoded).
- `Depends(get_current_user)` → `requireAuth` Express middleware that
  populates `req.currentUser = { id }`.

### Two bugs found and fixed during migration
1. **`auth_router.check_session`** read `current_user["u_id"]`, but
   `get_current_user` only ever returned `{"id": ...}` — this would have
   thrown `KeyError: 'u_id'` (500 error) every time in the original Python.
   Fixed to use `req.currentUser.id` (see `src/middleware/auth.ts` and
   `src/controllers/authController.ts`).
2. **`user_router.get_user`**'s docstring claimed the full user was already
   fetched from the DB, but `get_current_user` never queried the database —
   it only decoded the JWT. Fixed by actually querying the user in
   `src/controllers/userController.ts` so `GET /users/` returns real profile
   data instead of just `{"id": ...}`.

### RBAC (role-based access control)
Every authenticated route now runs `requireAuth` (validates JWT) followed
by `requireRole("user")` (`src/middleware/rbac.ts`). The app is currently
user-facing only, so `"user"` is the only role in play — self-registration
always creates `role: "user"` (the client can no longer pass an arbitrary
`role`, which the original schema allowed — a privilege-escalation bug we
closed here). Adding an admin surface later is a one-line change per route
(e.g. `requireRole("admin")` on a new router), not a schema change.

Everything else — status codes, JSON field names, query parameter names,
filtering logic, and validation rules — was carried over unchanged.

## Features added on top of the original migration

These extend the original API (not a straight FastAPI port) to cover
requests from the product roadmap. Every one of these only uses real data
- no invented sensor values, no fake ML.

- **Extended ingestion metrics**: `/readings/add` now also accepts
  `rainfall`, `soil_moisture`, `soil_temp`, `solar_radiation`, `uv_index` -
  same pattern as the original 5 metrics (only stored if a matching
  `device_sensor` is installed).
- **Device-health telemetry**: `/readings/add` also accepts `battery`,
  `is_solar_charging`, `signal_strength_dbm`, `firmware_version`, which
  update the `Device` row directly (new nullable columns) rather than
  being stored as sensor readings.
- **Fixed a real gap**: the original ingestion endpoint never updated
  `device.status`/`lastSeenAt`, so "online/offline" and "last sync" could
  never reflect reality. Every successful ingestion now marks the device
  `active` and stamps `lastSeenAt`.
- **Fixed a second, related gap**: even after that fix, `status` only
  ever got *set* to `"active"` - nothing ever flipped it back once a
  device went quiet, so every device would show "Online" forever after
  its first reading. `src/utils/deviceStatus.ts` now computes the
  *effective* status on every read instead of trusting the stored flag:
  a device is `"offline"` if it hasn't reported within
  `frequency_minutes × 2` (e.g. a 5-minute device goes offline after 10
  minutes of silence - one missed cycle tolerated, two means something's
  wrong), `"inactive"` if it's never reported at all, or `"active"`
  otherwise. Applied everywhere a `Device` is serialized
  (`GET /devices/`, `POST /devices/`, `POST /devices/:id/crop`).
- **`GET /devices/:id/forecast`** — 7-day hourly + daily weather forecast
  from [Open-Meteo](https://open-meteo.com) (free, no API key), using the
  device's own lat/long. Requires outbound network access to
  `api.open-meteo.com` at runtime.
- **`GET /devices/:id/insights`** — derived metrics (dew point, heat
  index, VPD - see `src/utils/agroMetrics.ts`) computed from real
  temp/humidity readings, plus simple rule-based advisories (see
  `src/services/insightsService.ts`). These are explicit, explainable
  threshold rules, **not machine learning** - labeled as "Rule-Based
  Insights" everywhere, not "AI", to avoid overstating capability.
- **`GET /devices/:id/history/export`** — same filtering as
  `/devices/:id/history`, returned as CSV instead of JSON.

## Crop selection + AI advisory (DeepSeek)

> **Schema changed again** - this adds the `Crop` and `DeviceAdvisory`
> models plus a `crop_id` column on `devices`. Run
> `npx prisma migrate dev --name add_crops_and_advisories` (and
> `npx prisma db seed` to populate mango/apple) before using any of this.

- **`GET /crops`** — lists every crop that exists. Fully dynamic - not
  hardcoded to mango/apple, those are just what `prisma/seed.ts`
  pre-populates on a fresh database. Grows via the endpoint below.
- **`POST /crops`** — adds a new crop (`{ "name": "Grape" }`; a `code`
  like `"grape"` is auto-generated from the name). Crops are shared/global
  reference data, same pattern as `sensor_types` - anyone adding one makes
  it selectable by every user, which is intentional (a shared, growing
  catalog), not a bug. Idempotent: adding a name that already exists
  returns the existing crop with `200` instead of erroring.
- **`POST /devices/:id/crop`** — sets (`{ "crop_code": "mango" }`) or
  clears (`{ "crop_code": null }`) the crop for a device. Drives
  crop-specific dashboard data going forward.
- **`GET /devices/:id/advisory?refresh=true`** — calls the DeepSeek API
  (`src/services/deepseekService.ts`) with the device's real current
  readings (temp, humidity, wind, rainfall, soil moisture - whichever the
  device actually has sensors for), derived metrics (dew point, heat
  index, VPD), and forecast rain probability, and asks it for:
  1. a short plain-language summary,
  2. concrete precautions,
  3. specific pest/fungal disease risks for that crop, each with a
     low/medium/high level and a reason grounded in the data given.

  The prompt explicitly tells the model not to invent risks unsupported
  by the data, and to skip any factor it wasn't given rather than guess.
  Requires the device to have a crop set first (400 if not). Results are
  cached in the new `device_advisories` table for up to an hour (each
  generation is a real, billed DeepSeek API call) - pass `?refresh=true`
  to force a new one.

  **Setup**: set `DEEPSEEK_API_KEY` in `.env` (get one at
  https://platform.deepseek.com). Without it, the endpoint returns `503`
  with a clear message rather than failing silently. Requires outbound
  network access to `api.deepseek.com` at runtime, same caveat as the
  Open-Meteo forecast integration.

## Evapotranspiration (ET0) + new sensor metrics

> No schema migration needed this round - just re-run the seed to pick up
> the new sensor types: `npx prisma db seed`.

- **Reference evapotranspiration (ET0)**, mm/day - `src/utils/agroMetrics.ts`
  → `calculateReferenceET0`. Uses the Hargreaves-Samani (1985) equation
  (FAO-56), chosen specifically because it only needs a day's min/max
  temperature plus the device's latitude/date - no solar radiation,
  humidity, or wind sensor required, so it works for every device
  regardless of which sensors are installed. Computed from today's actual
  temp readings (`src/services/etService.ts`) and surfaced in both
  `GET /devices/:id/insights` (`derivedMetrics.et0MmPerDay`) and fed into
  the DeepSeek advisory prompt.
- **New ingestible/displayable metrics**: `wind_direction` (degrees),
  `leaf_wetness` (%), `soil_temp` (°C), `pm1`/`pm2_5`/`pm10` (µg/m³),
  `co2` (ppm), `tvoc` (ppb). None of these needed backend code changes to
  ingest - `/readings/add` has been fully dynamic since the sensor-loop
  rewrite (any query key matching an installed `device_sensor` label is
  stored). What's new here is: (1) `prisma/seed.ts` now seeds
  `sensor_types` rows for all of them, so `POST /sensors/device` works
  without first manually calling `POST /sensors/types`, and (2) they're
  fed into the DeepSeek advisory prompt when present.

---

## 2. Node.js architecture

```
src/
 ├── app.ts              # Express app setup, CORS, route mounting, error handling
 ├── server.ts           # Entry point (app.listen)
 ├── routes/             # Express routers (1 per FastAPI router)
 ├── controllers/        # Route handler logic (1 per FastAPI router file)
 ├── services/           # Business logic + "repository" DB-access modules
 ├── schemas/             # Zod schemas (Pydantic equivalents)
 ├── middleware/         # requireAuth (JWT), errorHandler, asyncHandler
 ├── utils/              # ApiError, security.ts (bcrypt), jwtHandler.ts
 └── config/             # env.ts (dotenv config), prisma.ts (PrismaClient singleton)
prisma/
 ├── schema.prisma       # All 10 models, 1:1 with the SQLAlchemy models
 └── seed.ts             # Equivalent of data_link.py
```

- **FastAPI dependencies → Express middleware**: `get_db` is replaced by a
  Prisma singleton client (no per-request session needed); `get_current_user`
  is replaced by `requireAuth`.
- **Pydantic → Zod**: schemas validate `req.body`/`req.query` and throw a
  `ZodError` on failure, caught centrally and turned into a 422 response —
  matching FastAPI's automatic validation-error behavior.
- **HTTPException → ApiError**: a custom error class carrying `statusCode`
  and `detail`, thrown from controllers/services and caught by
  `src/middleware/errorHandler.ts`, which produces the same
  `{"detail": "..."}` JSON shape FastAPI returns.
- **Async/await + try/catch**: every controller is `async`; the
  `asyncHandler` wrapper forwards rejected promises to Express's error
  middleware automatically (equivalent to FastAPI's built-in async
  exception propagation).

---

## 3. Installation

```bash
cd gridsphere-node
npm install
cp .env.example .env
```

## 4. Database setup (Neon PostgreSQL)

This project is configured for **[Neon](https://neon.tech)**, serverless PostgreSQL.

1. Create a free project at https://console.neon.tech
2. From the Neon dashboard, copy:
   - the **pooled connection string** → `DATABASE_URL` (used by the running app)
   - the **direct connection string** → `DIRECT_URL` (used only by `prisma migrate`, which needs a non-pooled connection)
3. Paste both into `.env` (see `.env.example` for the exact format — keep `?sslmode=require`, Neon requires TLS)
4. Run the migration to create all 10 tables:
   ```bash
   npx prisma migrate dev --name init
   ```
5. (Optional) seed dummy data, equivalent of `data_link.py`:
   ```bash
   npx prisma db seed
   ```

`npm install` automatically runs `prisma generate` via a `postinstall` hook,
so the Prisma Client is always in sync with `schema.prisma`. If you ever
edit the schema by hand, run `npx prisma generate` again.

### Money fields
`SubscriptionPlan.priceMonthly/priceYearly` and `DeviceSubscription.pricePaid`
use Prisma's `Decimal @db.Decimal(10, 2)` type for exact monetary precision
(this requires Postgres/MySQL — SQLite doesn't support `Decimal`, which is
why this schema is Postgres/Neon-only going forward).

### JSON fields
`DeviceUser.permissions`, `RawPayload.payloadJson`, and
`SubscriptionPlan.featuresJson` use Prisma's native `Json` type (Postgres
has first-class JSON/JSONB support), so you can pass plain JS
objects/arrays directly - no manual `JSON.stringify`/`JSON.parse` needed.

### Using a different Postgres provider instead of Neon
Nothing else changes - just swap `DATABASE_URL`/`DIRECT_URL` for your own
Postgres instance's connection strings. The schema has no Neon-specific
syntax; it's standard `provider = "postgresql"`.

## 5. Running locally

```bash
npm run dev      # ts-node-dev, hot reload, http://localhost:8000
# or
npm run build && npm start   # compiled production build
```

## 6. API testing instructions

### Interactive Swagger UI (recommended)
Once the server is running:
```
http://localhost:8000/docs
```
This shows every route (grouped by tag: Authentication, Devices, Users,
Readings, Sensors, Subscriptions), with full request/response schemas and
a **"Try it out"** button to actually call each endpoint from the browser.

To test authenticated routes:
1. Call `POST /register` then `POST /login` from the docs page.
2. Copy the `access_token` from the response.
3. Click the **Authorize** button (top right) and paste just the token
   (no need to type "Bearer ").
4. All subsequent "Try it out" calls will include it automatically.

The raw OpenAPI 3.0 spec is also available at `http://localhost:8000/docs.json`
if you'd rather import it into Postman/Insomnia. The spec source lives at
`src/config/openapi.yaml` — update it whenever you add/change a route.

### curl examples

```bash
# Health check
curl http://localhost:8000/

# Register
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"secret123"}'

# Login (form-encoded, exactly like the original OAuth2PasswordRequestForm)
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=jane@example.com&password=secret123"
# -> { "access_token": "...", "token_type": "bearer", "user": {...} }

# Authenticated request
curl http://localhost:8000/checkSession \
  -H "Authorization: Bearer <access_token>"

# Create a device
curl -X POST http://localhost:8000/devices/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"device_uid":"esp32-001","device_name":"Hub 1","frequency":5}'

# IoT ingestion endpoint (no auth, matches hardware payload)
curl "http://localhost:8000/readings/add?d_id=1&temp=23.5&humidity=60"
```

You can also import the routes above into Postman/Insomnia; the JSON
request/response shapes are byte-for-byte the same as the FastAPI version,
so any existing frontend or API test suite continues to work unmodified.


