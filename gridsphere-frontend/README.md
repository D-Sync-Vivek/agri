# GridSphere Frontend — Station Console

A React + TypeScript web app for the GridSphere Node.js API, styled to
match the GridSphere mobile app: green instrument header, white field-data
cards, bottom tab navigation.

## RBAC — two roles
- **`user`** (field operators): sees live data, insights, forecast,
  AI advisory/chat, wind/rain analytics, and can pick a crop - only for
  devices an **admin** has assigned to them. No Devices tab, no ability
  to register devices or install sensors.
- **`admin`**: everything a user sees, plus a **Devices** tab (bottom
  nav) for registering devices, installing/deactivating sensors, and
  granting/revoking other users' access to a device (the "Access" tab on
  a device's detail page).

This is enforced both here (route guards + hidden nav items, so a "user"
never sees the option) and on the backend via `requireRole` middleware
(the actual security boundary - see the Node API's README). Promoting
someone to admin is a manual DB update for now, by design - no self-service
path exists.

## Pages
- **/login**, **/register** — auth
- **/** (Home) — device switcher in the header, then 6 in-page tabs:
  **Conditions** (live readout tiles, click any for per-sensor history),
  **Advisory** (crop picker + AI advisory with pest/disease risk gauges),
  **Insights** (rule-based advisories + dew point/heat index/VPD/ET0),
  **Forecast** (7-day, via Open-Meteo), **Analytics** (wind rose +
  rain totals/chart), **Chat** (free-form AI Q&A about the device)
- **/devices/:id/sensors/:sensorId/history** — per-sensor Day/Week/Month
  history with Max/Min/Average and CSV export
- **/devices** *(admin only)* — device list/grid, register new device
- **/devices/:id** *(admin only)* — History / Sensors / **Access** tabs
  (Access = grant/revoke other users' access to this device)
- **/profile** — account info, role badge, logout, link to plans
- **/plans** — subscription plans

## Setup

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
```

`VITE_API_BASE_URL=/api` by default, proxied to `http://localhost:8000`
via `vite.config.ts` during dev - make sure the Node backend is running.

```bash
npm run build     # static output to dist/
npm run preview   # serve the production build locally
```

## Architecture notes
- `src/context/AuthContext.tsx` — JWT/user/role session state
- `src/context/DeviceContext.tsx` — tracks the "currently selected
  device" (header dropdown), shared across Home's tabs
- `src/components/AppHeader.tsx` — green top bar, device switcher, avatar
- `src/components/BottomNav.tsx` — bottom tabs, Devices hidden for non-admins
- `src/components/ProtectedRoute.tsx` — route guard, takes an explicit
  `allowedRoles` prop at every call site (see `src/App.tsx`)
- `src/api/*.ts` — one file per backend router group
- `src/utils/metrics.tsx` — display metadata (name/icon/unit/formatter)
  for every sensor label the backend knows about; purely presentational,
  ingestion itself is fully dynamic on the backend
- `src/index.css` — all design tokens (colors, radius, shadows, chat
  bubble styles) as CSS variables at the top
