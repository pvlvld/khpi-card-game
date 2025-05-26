import {Module} from "@nestjs/common";
import {GamesController} from "./game.controller";
import {GamesService} from "./game.service";
import {GamesGateway} from "./game.gateway";
import {PrismaModule} from "src/prisma/prisma.module";
import {CardModule} from "src/card/card.module";

@Module({
  imports: [PrismaModule, CardModule],
  controllers: [GamesController],
  providers: [GamesService, GamesGateway]
})
export class GamesModule {}
