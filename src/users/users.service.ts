import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.user.findMany({
            orderBy: {
                id: "asc",
            },
        });
    }

    async create(data: { email: string; name?: string }) {
        return this.prisma.user.create({
            data,
        });
    }
}