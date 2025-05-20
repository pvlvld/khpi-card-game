import {Module} from "@nestjs/common";
import {AuthController} from "./auth.controller";
import {AuthService} from "./auth.service";
import {AccountModule} from "src/account/account.module";
import {AccountService} from "src/account/account.service";
import {PrismaService} from "src/prisma/prisma.service";

@Module({
  imports: [AccountModule],
  controllers: [AuthController],
  providers: [AuthService, AccountService, PrismaService]
})
export class AuthModule {}
