import {Module} from "@nestjs/common";
import {AppController} from "./app.controller";
import {AppService} from "./app.service";
import {AuthModule} from "./auth/auth.module";
import {UsersModule} from "./user/user.module";
import {GamesModule} from "./game/game.module";
import {MatchmakingModule} from "./matchmaking/matchmaking.module";
import {StatsModule} from "./stats/stats.module";
import {PrismaService} from "./prisma/prisma.service";
import {UsersService} from "./user/user.service";

@Module({
  imports: [
    AuthModule,
    UsersModule,
    GamesModule,
    MatchmakingModule,
    StatsModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, UsersService]
})
export class AppModule {}
