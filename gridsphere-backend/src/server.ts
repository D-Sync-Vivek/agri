import { createApp } from "./app";
import { config } from "./config/env";

async function main() {
  const app = await createApp();
  app.listen(config.port, () => {
    console.log(`GridSphere API v2 (Node.js) running on http://localhost:${config.port}`);
  });
}

main();


