import {Module} from "@nestjs/common";
import {AuthController} from "./auth.controller";
import {AuthService} from "./auth.service";
import {AccountModule} from "src/account/account.module";
import {AccountService} from "src/account/account.service";
import {PrismaService} from "src/prisma/prisma.service";
import {JwtModule} from "@nestjs/jwt";

@Module({
  imports: [
    AccountModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {expiresIn: "30d"}
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, AccountService, PrismaService]
})
export class AuthModule {}
