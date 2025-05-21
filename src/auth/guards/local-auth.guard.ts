import {AuthGuard} from "@nestjs/passport";
import {Request} from "express";
import {Account} from "generated/prisma";

export interface RequestWithUser extends Request {
  user: Account;
}

export class LocalAuthGuard extends AuthGuard("local") {}
