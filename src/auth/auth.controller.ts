import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Req
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Response } from "express";
import { LocalAuthGuard, RequestWithUser } from "./guards/local-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post("register")
  async register(@Body() registerDto: RegisterDto, @Res() response: Response) {
    const jwt = await this.authService.register(
      registerDto.username,
      registerDto.password
    );

    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    response.cookie("jwt", jwt, { expires, httpOnly: false });
    response.status(HttpStatus.CREATED).json({
      message: "Registration successful"
    });
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Req() request: RequestWithUser, @Res() response: Response) {
    const jwt = await this.authService.generateJwt(request.user);

    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    response.cookie("jwt", jwt, { expires, httpOnly: false });
    response.status(HttpStatus.OK).json({
      message: "Login successful"
    });
  }
}
