import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { IAppConfig } from "./config.module";

export interface CorsConfig {
  allowedOrigins: string[];
  allowCredentials: boolean;
  allowedMethods: string[];
  allowedHeaders: string[];
}

@Injectable()
export class CorsConfigService {
  private readonly config: CorsConfig;

  constructor(private readonly configService: ConfigService<IAppConfig>) {
    this.config = this.createConfig();
  }

  public getConfig(): CorsConfig {
    return this.config;
  }

  public getOrigins(): string[] {
    return this.config.allowedOrigins;
  }

  public isOriginAllowed(origin: string): boolean {
    return this.config.allowedOrigins.some((allowedOrigin) =>
      origin.startsWith(allowedOrigin)
    );
  }

  public getCorsOptions(): CorsOptions {
    return {
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (this.isOriginAllowed(origin)) {
          return callback(null, true);
        }

        console.warn(`[CORS] Origin ${origin} not allowed`);
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      },
      methods: this.config.allowedMethods,
      credentials: this.config.allowCredentials,
      allowedHeaders: this.config.allowedHeaders
    };
  }

  public logConfiguration(): void {
    const nodeEnv = this.configService.get("NODE_ENV");
    console.log(`[CORS] Environment: ${nodeEnv}`);
    console.log(`[CORS] Allowed origins:`, this.config.allowedOrigins);
    console.log(`[CORS] Credentials enabled: ${this.config.allowCredentials}`);
  }

  private createConfig(): CorsConfig {
    const nodeEnv = this.configService.get("NODE_ENV", { infer: true });
    const frontendUrl = this.configService.get("FRONTEND_URL", { infer: true });

    const devOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173"
    ];

    let allowedOrigins: string[];

    if (nodeEnv === "production") {
      allowedOrigins = frontendUrl ? [frontendUrl] : [];
    } else {
      allowedOrigins = [...devOrigins];
      if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
        allowedOrigins.push(frontendUrl);
      }
    }

    return {
      allowedOrigins,
      allowCredentials: true,
      allowedMethods: [
        "GET",
        "HEAD",
        "PUT",
        "PATCH",
        "POST",
        "DELETE",
        "OPTIONS"
      ],
      allowedHeaders: ["Content-Type", "Accept", "Authorization", "Cookie"]
    };
  }
}

// For WS
export function createCorsOrigins(): string[] {
  const nodeEnv = process.env.NODE_ENV || "development";
  const frontendUrl = process.env.FRONTEND_URL;

  const devOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
  ];

  if (nodeEnv === "production") {
    return frontendUrl ? [frontendUrl] : [];
  }

  const origins = [...devOrigins];
  if (frontendUrl && !origins.includes(frontendUrl)) {
    origins.push(frontendUrl);
  }

  return origins;
}
