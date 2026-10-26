import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import { connectDatabase, prisma } from "./config/prisma.js";
import { connectRedis } from "./config/redis.js";

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  await connectDatabase();
  await connectRedis();

  const server = app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
  });

}

bootstrap().catch((error) => {
  console.error(" Failed to bootstrap application:", error);
  process.exit(1);
});

export { app, prisma };
