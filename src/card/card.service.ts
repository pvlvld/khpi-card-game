import {Injectable} from "@nestjs/common";
import {Card, Prisma} from "generated/prisma";
import {PrismaService} from "src/prisma/prisma.service";

// TODO: move to DB
const _allCards: Card[] = [
  {
    id: 1,
    name: "Ant-Man",
    description: "",
    damage: 5,
    defence: 3,
    cost: 4,
    imageUrl: "cards/Ant-Man.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    name: "Black Panther",
    description: "",
    damage: 7,
    defence: 6,
    cost: 6,
    imageUrl: "cards/Black Panther.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    name: "Black Widow",
    description: "",
    damage: 6,
    defence: 4,
    cost: 5,
    imageUrl: "cards/Black Widow.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    name: "Captain America",
    description: "",
    damage: 8,
    defence: 8,
    cost: 8,
    imageUrl: "cards/Captain America.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 5,
    name: "Captain Marvel",
    description: "",
    damage: 9,
    defence: 7,
    cost: 8,
    imageUrl: "cards/Captain Marvel.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 6,
    name: "Deadpool",
    description: "",
    damage: 7,
    defence: 5,
    cost: 6,
    imageUrl: "cards/Deadpool.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 7,
    name: "Doctor Strange",
    description: "",
    damage: 8,
    defence: 5,
    cost: 8,
    imageUrl: "cards/Doctor Strange.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 8,
    name: "Falcon",
    description: "",
    damage: 5,
    defence: 4,
    cost: 4,
    imageUrl: "cards/Falcon.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 9,
    name: "Groot",
    description: "",
    damage: 4,
    defence: 9,
    cost: 6,
    imageUrl: "cards/Groot.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 10,
    name: "Hulk",
    description: "",
    damage: 10,
    defence: 6,
    cost: 9,
    imageUrl: "cards/Hulk.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 11,
    name: "Iron Man",
    description: "",
    damage: 8,
    defence: 7,
    cost: 8,
    imageUrl: "cards/Iron Man.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 12,
    name: "Ironheart",
    description: "",
    damage: 7,
    defence: 6,
    cost: 7,
    imageUrl: "cards/Ironheart.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 13,
    name: "Loki",
    description: "",
    damage: 6,
    defence: 5,
    cost: 7,
    imageUrl: "cards/Loki.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 14,
    name: "Rocket Raccoon",
    description: "",
    damage: 6,
    defence: 4,
    cost: 5,
    imageUrl: "cards/Rocket Raccoon.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 15,
    name: "Scarlet Witch",
    description: "",
    damage: 9,
    defence: 6,
    cost: 9,
    imageUrl: "cards/Scarlet Witch.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 16,
    name: "Shang-Chi",
    description: "",
    damage: 8,
    defence: 5,
    cost: 7,
    imageUrl: "cards/Shang-Chi.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 17,
    name: "Spider-Man",
    description: "",
    damage: 7,
    defence: 5,
    cost: 6,
    imageUrl: "cards/Spider Man.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 18,
    name: "Star-Lord",
    description: "",
    damage: 6,
    defence: 4,
    cost: 5,
    imageUrl: "cards/Star-Lord.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 19,
    name: "Thor",
    description: "",
    damage: 10,
    defence: 6,
    cost: 9,
    imageUrl: "cards/Thor.png",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 20,
    name: "Vision",
    description: "",
    damage: 8,
    defence: 7,
    cost: 8,
    imageUrl: "cards/Vision.png",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

@Injectable()
export class CardService {
  constructor(private prisma: PrismaService) {}

  private _cardCount = 0;

  async getCardCount() {
    if (!this._cardCount) return this._cardCount;
    // return (this._cardCount = await this.prisma.card.count());
    return _allCards.length + 1;
  }

  async createCard(data: Prisma.CardCreateInput): Promise<Card> {
    return await this.prisma.card.create({data}).then((card) => {
      this._cardCount++;
      return card;
    });
  }

  async getCard(where: Prisma.CardWhereUniqueInput): Promise<Card | null> {
    // return await this.prisma.card.findUnique({where});
    return _allCards.find((card) => card.name === where.name) || null;
  }

  async getAllCards(): Promise<Card[]> {
    // return await this.prisma.card.findMany();
    return _allCards;
  }

  // https://github.com/prisma/prisma/issues/5894
  // =(
  async getRandomCards(count: number): Promise<Card[]> {
    // const allCards = await this.getAllCards();
    // if (allCards.length === 0) return [];
    // if (count >= allCards.length) return allCards;
    // const shuffled = allCards.sort(() => 0.5 - Math.random());
    // return shuffled.slice(0, count);

    if (count > _allCards.length) {
      count = _allCards.length;
    }
    const shuffled = _allCards.sort(() => 0.5 - Math.random());
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
