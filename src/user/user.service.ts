import {Injectable, BadRequestException} from "@nestjs/common";
import {Prisma, User} from "generated/prisma";
import {PrismaService} from "src/prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";
import {promisify} from "util";
import * as sharp from "sharp";

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class UsersService {
  private readonly uploadDir = path.join(process.cwd(), "uploads", "avatars");

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, {recursive: true});
    }
  }

  async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({ where });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async uploadAvatar(userId: number, file: Express.Multer.File): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check file sizes
    const image = sharp(file.buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('Invalid image file');
    }

    if (
      metadata.width < 100 || metadata.height < 100 ||
      metadata.width > 1800 || metadata.height > 1800
    ) {
      throw new BadRequestException(
        'Image dimensions must be between 100x100 and 1800x1800 pixels'
      );
    }

    // Deleting old ava is exist
    if (user.avatarUrl) {
      const oldAvatarPath = path.join(this.uploadDir, user.avatarUrl);
      if (fs.existsSync(oldAvatarPath)) {
        await unlinkAsync(oldAvatarPath);
      }
    }

    // Always save in .jpg, name is fixed
    const fileName = `${user.username}_ava.jpg`;
    const filePath = path.join(this.uploadDir, fileName);

    // Converting in JPEG and saving
    await sharp(file.buffer)
      .jpeg({ quality: 85 }) // quality can be changed
      .toFile(filePath);

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: fileName },
    });
  }

  async uploadAvatar(userId: number, file: Express.Multer.File): Promise<User> {
    const user = await this.prisma.user.findUnique({where: {id: userId}});

    if (!user) {
      throw new BadRequestException("User not found");
    }

    // Check file sizes
    const image = sharp(file.buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException("Invalid image file");
    }

    if (
      metadata.width < 100 ||
      metadata.height < 100 ||
      metadata.width > 1800 ||
      metadata.height > 1800
    ) {
      throw new BadRequestException(
        "Image dimensions must be between 100x100 and 1800x1800 pixels"
      );
    }

    // Deleting old ava is exist
    if (user.avatarUrl) {
      const oldAvatarPath = path.join(this.uploadDir, user.avatarUrl);
      if (fs.existsSync(oldAvatarPath)) {
        await unlinkAsync(oldAvatarPath);
      }
    }

    // Always save in .jpg, name is fixed
    const fileName = `${user.username}_ava.jpg`;
    const filePath = path.join(this.uploadDir, fileName);

    // Converting in JPEG and saving
    await sharp(file.buffer)
      .jpeg({quality: 85}) // quality can be changed
      .toFile(filePath);

    return this.prisma.user.update({
      where: {id: userId},
      data: {avatarUrl: fileName}
    });
  }

  async uploadAvatarByUsername(
    username: string,
    file: Express.Multer.File
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({where: {username}});
    if (!user) throw new BadRequestException("User not found");

    return this.uploadAvatar(user.id, file);
  }
}

