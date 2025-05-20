import {Injectable} from "@nestjs/common";
import {Account, Prisma} from "generated/prisma";
import {PrismaService} from "src/prisma/prisma.service";

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async findUnique(
    where: Prisma.AccountWhereUniqueInput
  ): Promise<Account | null> {
    return this.prisma.account.findUnique({where});
  }

  async create(data: Prisma.AccountCreateInput): Promise<Account> {
    return this.prisma.account.create({data});
  }
}
