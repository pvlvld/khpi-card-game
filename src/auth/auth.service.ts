import {
  Injectable,
  UnauthorizedException,
  ConflictException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "@node-rs/argon2";
import { Account } from "generated/prisma";
import { AccountService } from "src/account/account.service";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private accountService: AccountService,
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  async signUp(username: string, password: string): Promise<any> {
    if (!username || !password) {
      throw new UnauthorizedException("Username and password are required");
    }

    if (password.length < 6 || password.length > 100) {
      throw new ConflictException(
        "Password must be at least 6 characters long and at most 100 characters long"
      );
    }

    if (username.length < 3 || username.length > 20) {
      throw new ConflictException(
        "Username must be at least 3 characters long and at most 20 characters long"
      );
    }

    const existingUser = await this.accountService.findUnique({ username });
    if (existingUser) {
      throw new ConflictException("Username already exists");
    }

    const passwordHash = await argon2.hash(password);

    // TODO: combine on prisma lvl?
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username
        }
      });

      const account = await tx.account.create({
        data: {
          username,
          passwordHash,
          provider: "local",
          providerId: username,
          userId: user.id
        }
      });

      return { user, account };
    });

    return this.jwtService.signAsync({ sub: result.account.id, username });
  }

  // TODO: OAuth
  async signIn(username: string, password: string): Promise<string> {
    if (!username || !password) {
      throw new UnauthorizedException("Username and password are required");
    }

    const account = await this.accountService.findUnique({ username });

    return await this.login(account!);
  }

  async validateUser(
    username: string,
    password: string
  ): Promise<Account | null> {
    const account = await this.accountService.findUnique({ username });

    if (
      !account?.passwordHash ||
      !(await argon2.verify(account.passwordHash, password))
    ) {
      return null;
    }

    return account;
  }

  async login(account: Account): Promise<string> {
    return this.jwtService.signAsync({
      sub: account.id,
      username: account.username
    });
  }
}
