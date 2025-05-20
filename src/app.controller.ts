import {Controller, Get, Param} from "@nestjs/common";
import {AppService} from "./app.service";
import {UsersService} from "./users/users.service";

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
    const user = await this.userService.findOne({username});
    return JSON.stringify(user);
  }
}
