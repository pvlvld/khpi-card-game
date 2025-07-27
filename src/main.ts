import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { join } from "path";
import { CorsConfigService } from "./config/cors.config";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const corsService = app.get(CorsConfigService);

  corsService.logConfiguration();

  app.enableCors(corsService.getCorsOptions());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      },
      stopAtFirstError: true
    })
  );

  app.useStaticAssets(join(__dirname, "..", "uploads", "avatars"), {
    prefix: "/avatars/"
  });

  initializeSwagger(app);

  await app.listen(process.env.NEST_PORT ?? 3069);
}

function initializeSwagger(app: any) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Simple Pastebin API")
    .setDescription("The Simple Pastebin API description")
    .setVersion("1.0")
    .addTag("paste")
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api", app, documentFactory);
}

bootstrap();
