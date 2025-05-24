import {Injectable} from "@nestjs/common";
import {Game, Prisma} from "generated/prisma";
import {PrismaService} from "src/prisma/prisma.service";

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new game
   * Game can be created with a Null winner and loser
   * @param data - The data to create the game with
   * @returns The created game
   */
  async createGame(data: Prisma.GameCreateInput): Promise<Game> {
    return await this.prisma.game.create({data});
  }

  /**
   * Update a game by its unique identifier
   * Supposed to be used to set the winner and loser of a game
   * @param where - The unique identifier of the game to update
   * @param data - The data to update the game with
   * @returns The updated game
   */
  async updateGame(
    where: Prisma.GameWhereUniqueInput,
    data: Prisma.GameUpdateInput
  ): Promise<Game> {
    return await this.prisma.game.update({where, data});
  }
}
