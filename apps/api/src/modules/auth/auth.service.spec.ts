import { Test } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";

describe("AuthService", () => {
    let authService: AuthService;
    let usersService: jest.Mocked<UsersService>;
    let jwtService: jest.Mocked<JwtService>;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    // Only mock the methods AuthService actually calls.
                    useValue: {
                        create: jest.fn(),
                        findByEmailWithPassword: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue("fake-jwt-token"),
                    },
                },
            ],
        }).compile();

        authService = moduleRef.get(AuthService);
        usersService = moduleRef.get(UsersService);
        jwtService = moduleRef.get(JwtService);
    });

    describe("login", () => {
        it("throws UnauthorizedException when the user does not exist", async () => {
            usersService.findByEmailWithPassword.mockResolvedValue(null);

            await expect(
                authService.login({
                    email: "nobody@example.com",
                    password: "password123",
                }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it("throws UnauthorizedException when the password is wrong", async () => {
            const correctHash = await bcrypt.hash("correct-password", 10);
            usersService.findByEmailWithPassword.mockResolvedValue({
                id: "user-1",
                email: "user@example.com",
                passwordHash: correctHash,
                name: "Test User",
                favoriteGames: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            await expect(
                authService.login({
                    email: "user@example.com",
                    password: "wrong-password",
                }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it("returns an access token when credentials are correct", async () => {
            const correctHash = await bcrypt.hash("correct-password", 10);
            usersService.findByEmailWithPassword.mockResolvedValue({
                id: "user-1",
                email: "user@example.com",
                passwordHash: correctHash,
                name: "Test User",
                favoriteGames: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await authService.login({
                email: "user@example.com",
                password: "correct-password",
            });

            expect(result).toEqual({ accessToken: "fake-jwt-token" });
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: "user-1",
                email: "user@example.com",
            });
        });
    });

    describe("register", () => {
        it("creates the user and returns an access token", async () => {
            usersService.create.mockResolvedValue({
                id: "user-2",
                email: "new@example.com",
                name: "New User",
                favoriteGames: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await authService.register({
                email: "new@example.com",
                password: "password123",
                name: "New User",
            });

            expect(result).toEqual({ accessToken: "fake-jwt-token" });
            expect(usersService.create).toHaveBeenCalled();
        });
    });
});
