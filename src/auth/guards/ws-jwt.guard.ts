import {CanActivate, ExecutionContext, Injectable} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import {WsException} from "@nestjs/websockets";

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const cookies = client.handshake.headers.cookie;

    if (!cookies) {
      throw new WsException("Missing cookies");
    }

    const token = this.extractTokenFromCookies(cookies);
    if (!token) {
      throw new WsException("Missing JWT token");
    }

    try {
      const payload = this.jwtService.verify(token);
      if (!payload?.username) {
        throw new WsException("Invalid JWT payload");
      }

      client.data.user = payload;
      return true;
    } catch (e) {
      throw new WsException("Invalid JWT token");
    }
  }

  private extractTokenFromCookies(cookies: string): string | null {
    const cookieArray = cookies.split(";");
    for (const cookie of cookieArray) {
      const [name, value] = cookie.trim().split("=");
      if (name === "jwt") {
        return value;
      }
    }
    return null;
  }
}
