import {Injectable} from "@nestjs/common";
import {Prisma, User} from "generated/prisma";
import {PrismaService} from "src/prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({where});
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({data});
  }
}
