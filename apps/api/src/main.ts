import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // The web app is always a different origin from the API, in dev and prod.
  // Comma-separated so a phone-on-LAN origin can be added alongside
  // localhost during local dev without losing desktop access.
  const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3001").split(",").map((o) => o.trim());
  app.enableCors({ origin: corsOrigins });

  app.enableShutdownHooks();

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`MOMENT api listening on :${port}`);
}

bootstrap();
