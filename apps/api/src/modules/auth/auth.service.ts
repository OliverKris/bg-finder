import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) {}

    async register(dto: CreateUserDto) {
        const user = await this.usersService.create(dto);
        return this.issueToken(user.id, user.email);
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmailWithPassword(dto.email);
        if (!user) {
            // Same error for "no such user" and "wrong password" — don't leak
            // which one it was, that's an account-enumeration vector.
            throw new UnauthorizedException("Invalid email or password");
        }

        const passwordMatches = await bcrypt.compare(
            dto.password,
            user.passwordHash,
        );
        if (!passwordMatches) {
            throw new UnauthorizedException("Invalid email or password");
        }

        return this.issueToken(user.id, user.email);
    }

    private issueToken(userId: string, email: string) {
        const payload = { sub: userId, email };
        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}
