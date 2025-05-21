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
import {AuthService} from "./auth.service";
import {Response} from "express";
import {LocalAuthGuard, RequestWithUser} from "./guards/local-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post("register")
  signUp(@Body() signUpDto: Record<string, any>) {
    return this.authService.signUp(signUpDto.username, signUpDto.password);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post("login")
  async signIn(@Req() request: RequestWithUser, @Res() response: Response) {
    const jwt = await this.authService.login(request.user);

    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    response.cookie("jwt", jwt, {expires, httpOnly: true});
    response.status(HttpStatus.OK).json({
      message: "Login successful"
    });
  }
}
