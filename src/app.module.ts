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
import {AccountService} from "./account/account.service";
import {AccountModule} from "./account/account.module";
import {CardService} from "./card/card.service";

@Module({
  imports: [
    AuthModule,
    UsersModule,
    GamesModule,
    MatchmakingModule,
    StatsModule,
    AccountModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    UsersService,
    AccountService,
    CardService
  ]
})
export class AppModule {}
