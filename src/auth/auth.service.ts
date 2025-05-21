import {
  Injectable,
  UnauthorizedException,
  ConflictException
} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import * as argon2 from "@node-rs/argon2";
import {AccountService} from "src/account/account.service";
import {PrismaService} from "src/prisma/prisma.service";

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

    const existingUser = await this.accountService.findUnique({username});
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

      return {user, account};
    });

    return this.jwtService.signAsync({sub: result.account.id, username});
  }

  // TODO: OAuth
  async signIn(username: string, password: string): Promise<string> {
    if (!username || !password) {
      throw new UnauthorizedException("Username and password are required");
    }

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
