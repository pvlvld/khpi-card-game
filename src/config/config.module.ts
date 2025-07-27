import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";

export type IAppConfig = Readonly<{
  NODE_ENV: "development" | "production";
  PORT: number;
  DATABASE_URL: string;
  FRONTEND_URL?: string;
  JWT_SECRET: string;
  NEST_PORT: number;
}>;

export const AppConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object<IAppConfig>({
    NODE_ENV: Joi.string()
      .valid("development", "production")
      .default("development"),
    PORT: Joi.number().port().default(3000),
    DATABASE_URL: Joi.string().uri().required(),
    FRONTEND_URL: Joi.string().uri().when("NODE_ENV", {
      is: "production",
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    JWT_SECRET: Joi.string().required(),
    NEST_PORT: Joi.number().port().default(3069)
  }),
  validationOptions: {
    // allowUnknown: false,
    abortEarly: true,
    convert: true
  }
});
