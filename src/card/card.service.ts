import {Injectable} from "@nestjs/common";
import {Card, Prisma} from "generated/prisma";
import {PrismaService} from "src/prisma/prisma.service";

@Injectable()
export class CardService {
  constructor(private prisma: PrismaService) {}

  private _cardCount = 0;

  async getCardCount() {
    if (!this._cardCount) return this._cardCount;
    return (this._cardCount = await this.prisma.card.count());
  }

  async createCard(data: Prisma.CardCreateInput): Promise<Card> {
    return await this.prisma.card.create({data}).then((card) => {
      this._cardCount++;
      return card;
    });
  }

  async getCard(where: Prisma.CardWhereUniqueInput): Promise<Card | null> {
    return await this.prisma.card.findUnique({where});
  }

  async getAllCards(): Promise<Card[]> {
    return await this.prisma.card.findMany();
  }

  // https://github.com/prisma/prisma/issues/5894
  // =(
  async getRandomCards(count: number): Promise<Card[]> {
    const allCards = await this.getAllCards();
    if (allCards.length === 0) return [];
    if (count >= allCards.length) return allCards;
    const shuffled = allCards.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async updateCard(
    where: Prisma.CardWhereUniqueInput,
    data: Prisma.CardUpdateInput
  ): Promise<Card> {
    return await this.prisma.card.update({where, data});
  }

  async deleteCard(where: Prisma.CardWhereUniqueInput): Promise<Card> {
    throw new Error("Why would you want to delete a card?!");
  }
}
