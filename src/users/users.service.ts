import {
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        try {
            return await this.prisma.user.create({
                data: {
                    name: createUserDto.name,
                    email: createUserDto.email,
                },
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findAll() {
        return this.prisma.user.findMany({
            orderBy: {
                id: "asc",
            },
        });
    }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({
            where: {
                id,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        await this.findOne(id);

        try {
            return await this.prisma.user.update({
                where: {
                    id,
                },
                data: {
                    name: updateUserDto.name,
                    email: updateUserDto.email,
                },
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async remove(id: number) {
        await this.findOne(id);

        return this.prisma.user.delete({
            where: {
                id,
            },
        });
    }

    private handlePrismaError(error: unknown): never {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        ) {
            throw new ConflictException('Email already exists');
        }

        throw error;
    }
}
