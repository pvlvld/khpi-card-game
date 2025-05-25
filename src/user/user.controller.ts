import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './user.service';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  @Post('avatar')
  @UseInterceptors(
  FileInterceptor('avatar', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  })
)
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('No file uploaded');

    const token = req.cookies?.jwt;
    if (!token) throw new BadRequestException('No JWT cookie found');

    let payload: any;
    try {
      payload = this.jwtService.verify(token); // Throws if invalid
    } catch (e) {
      throw new BadRequestException('Invalid JWT token');
    }

    const username = payload?.username;
    if (!username) throw new BadRequestException('Invalid JWT payload');

    return this.usersService.uploadAvatarByUsername(username, file);
  }
}
