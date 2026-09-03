import {
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";

const SALT_ROUNDS = 10;

export type PublicUser = Omit<User, "passwordHash">;

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
    ) {}

    async create(dto: CreateUserDto): Promise<PublicUser> {
        const existing = await this.usersRepo.findOne({
            where: { email: dto.email },
        });
        if (existing) {
            throw new ConflictException("Email already in use");
        }

        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        const user = this.usersRepo.create({
            email: dto.email,
            passwordHash,
            name: dto.name,
            bio: dto.bio,
            favoriteGames: dto.favoriteGames ?? [],
            location: dto.location,
        });

        const saved = await this.usersRepo.save(user);
        return this.toPublicUser(saved);
    }

    async findById(id: string): Promise<PublicUser> {
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException("User not found");
        return this.toPublicUser(user);
    }

    // Used by AuthService only — this is the one place the full entity
    // (including passwordHash) is allowed to leave the repository.
    async findByEmailWithPassword(email: string): Promise<User | null> {
        return this.usersRepo.findOne({ where: { email } });
    }

    private toPublicUser(user: User): PublicUser {
        const { passwordHash, ...publicUser } = user;
        return publicUser;
    }
}
