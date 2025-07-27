import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UsersService } from "./user.service";
import { memoryStorage } from "multer";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse
} from "@nestjs/swagger";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post("avatar")
  @ApiOperation({ summary: "Upload user avatar" })
  @ApiResponse({
    status: 200,
    description: "Avatar successfully uploaded"
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data or no file uploaded"
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials"
  })
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException("Only image files are allowed!"),
            false
          );
        }
        cb(null, true);
      }
    })
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        avatar: {
          type: "string",
          format: "binary",
          description: "Avatar image file (jpg, jpeg, png, webp)"
        }
      },
      required: ["avatar"]
    }
  })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request
  ) {
    if (!file) throw new BadRequestException("No file uploaded");

    const token = req.cookies?.jwt;
    if (!token) throw new UnauthorizedException("No JWT cookie found");

    let payload: any;
    try {
      payload = this.jwtService.verify(token); // Throws if invalid
    } catch (e) {
      throw new UnauthorizedException("Invalid JWT token");
    }

    const username = payload?.username;
    if (!username) throw new UnauthorizedException("Invalid JWT payload");

    return this.usersService.uploadAvatarByUsername(username, file);
  }
}
