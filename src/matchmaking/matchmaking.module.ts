import {Module} from "@nestjs/common";
import {MatchmakingService} from "./matchmaking.service";
import {MatchmakingGateway} from "./matchmaking.gateway";
import {GamesModule} from "src/game/game.module";
import {PrismaService} from "src/prisma/prisma.service";
import {CardModule} from "src/card/card.module";
import {UsersModule} from "src/user/user.module";

@Module({
  imports: [GamesModule, CardModule, UsersModule],
  providers: [
    MatchmakingService,
    MatchmakingGateway,
    PrismaService
  ],
  exports: [MatchmakingService]
})
export class MatchmakingModule {}
