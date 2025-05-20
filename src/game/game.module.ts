import {Module} from "@nestjs/common";
import {GamesController} from "./game.controller";
import {GamesService} from "./game.service";
import {GamesGateway} from "./game.gateway";

@Module({
  controllers: [GamesController],
  providers: [GamesService, GamesGateway]
})
export class GamesModule {}
