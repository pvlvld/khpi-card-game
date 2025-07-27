import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, Length } from "class-validator";

export class RegisterDto {
  @ApiProperty({
    description: "The username of the user",
    example: "john_doe",
    minLength: 3,
    maxLength: 20
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20, {
    message: "Username must be between 3 and 20 characters long"
  })
  username: string;

  @ApiProperty({
    description: "The password of the user",
    example: "StrongPassword123",
    minLength: 6,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 100, {
    message: "Password must be between 6 and 100 characters long"
  })
  password: string;
}

export class LoginDto {
  @ApiProperty({
    description: "The username of the user",
    example: "john_doe"
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: "The password of the user",
    example: "StrongPassword123"
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: "Success message",
    example: "Login successful"
  })
  message: string;
}

export class JwtPayloadDto {
  @ApiProperty({
    description: "The account ID",
    example: 1
  })
  sub: number;

  @ApiProperty({
    description: "The username",
    example: "john_doe"
  })
  username: string;
}
