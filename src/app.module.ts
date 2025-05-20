import {Module} from "@nestjs/common";
import {AppController} from "./app.controller";
import {AppService} from "./app.service";
import {AuthModule} from "./auth/auth.module";
import {UsersModule} from "./users/users.module";
import {GamesModule} from "./games/games.module";
import {MatchmakingModule} from "./matchmaking/matchmaking.module";
import {StatsModule} from "./stats/stats.module";

@Module({
  imports: [
    AuthModule,
    UsersModule,
    GamesModule,
    MatchmakingModule,
    StatsModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
