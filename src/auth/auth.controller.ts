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
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { Response } from "express";
import { LocalAuthGuard, RequestWithUser } from "./guards/local-auth.guard";
import { RegisterDto, LoginDto, AuthResponseDto } from "./dto/auth.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: "User successfully registered",
    type: AuthResponseDto
  })
  @ApiResponse({
    status: 409,
    description: "Username already exists or invalid input"
  })
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
  @ApiOperation({ summary: "Login user" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "User successfully logged in",
    type: AuthResponseDto
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials"
  })
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
