import {Module} from "@nestjs/common";
import {MatchmakingService} from "./matchmaking.service";
import {MatchmakingGateway} from "./matchmaking.gateway";
import {GamesModule} from "src/game/game.module";
import {GamesService} from "src/game/game.service";
import {PrismaService} from "src/prisma/prisma.service";
import {CardModule} from "src/card/card.module";

@Module({
  imports: [GamesModule, CardModule],
  providers: [
    MatchmakingService,
    MatchmakingGateway,
    GamesService,
    PrismaService
  ],
  exports: [MatchmakingService]
})
export class MatchmakingModule {}
