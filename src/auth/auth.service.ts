import {Injectable, UnauthorizedException} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import * as argon2 from "@node-rs/argon2";
import {AccountService} from "src/account/account.service";

@Injectable()
export class AuthService {
  constructor(
    private accountService: AccountService,
    private jwtService: JwtService
  ) {}
  // TODO: OAuth
  async signIn(username: string, password: string): Promise<any> {
    const account = await this.accountService.findUnique({username});

    if (
      !account?.passwordHash ||
      !(await argon2.verify(account.passwordHash, password))
    ) {
      throw new UnauthorizedException();
    }

    return await this.jwtService.signAsync({sub: account.id, username});
  }
}
