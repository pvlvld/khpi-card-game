import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import * as cookieParser from "cookie-parser";
import {NestExpressApplication} from "@nestjs/platform-express";
import {join} from "path";

const ALLOWED_CORS_ORIGINS = [
  "http://localhost",
  "http://127.0.0.1",
  "https://localhost",
  "https://127.0.0.1",
  `${process.env.FRONTEND_URL}`
];

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        ALLOWED_CORS_ORIGINS.some((allowedOrigin) =>
          origin.startsWith(allowedOrigin)
        )
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"), false);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    allowedHeaders: "Content-Type, Accept, Authorization"
  });

  app.use(cookieParser());

  app.useStaticAssets(join(__dirname, "..", "uploads", "avatars"), {
    prefix: "/avatars/"
  });

  await app.listen(process.env.NEST_PORT ?? 3069);
}
bootstrap();
