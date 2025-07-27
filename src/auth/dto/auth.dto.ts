import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    description: "The username of the user",
    example: "john_doe",
    minLength: 3,
    maxLength: 20
  })
  username: string;
  @ApiProperty({
    description: "The password of the user",
    example: "StrongPassword123",
    minLength: 6,
    maxLength: 100
  })
  password: string;
}

export class LoginDto {
  @ApiProperty({
    description: "The username of the user",
    example: "john_doe"
  })
  username: string;
  @ApiProperty({
    description: "The password of the user",
    example: "StrongPassword123"
  })
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
