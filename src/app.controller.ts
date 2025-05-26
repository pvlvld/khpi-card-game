import {Controller, Get, Param} from "@nestjs/common";
import {AppService} from "./app.service";
import {UsersService} from "./user/user.service";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UsersService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("user/:username")
  async getUser(@Param("username") username: string) {
    const userInfo = await this.userService.getUserInfo(username);
    return JSON.stringify(userInfo);
  }
}
