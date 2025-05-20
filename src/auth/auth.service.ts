import {Injectable, UnauthorizedException} from "@nestjs/common";
import argon2 from "@node-rs/argon2";
import {AccountService} from "src/account/account.service";
@Injectable()
export class AuthService {
  constructor(private accountService: AccountService) {}
  // TODO: OAuth
  async signIn(username: string, password: string): Promise<any> {
    const account = await this.accountService.findUnique({username});
    if (
      !account?.passwordHash ||
      !(await argon2.verify(account.passwordHash, password))
    ) {
      throw new UnauthorizedException();
    }
    // TODO: JWT
    return "test";
  }
}
