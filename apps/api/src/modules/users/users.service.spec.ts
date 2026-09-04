import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";

describe("UsersService", () => {
    let usersService: UsersService;
    let repo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };

    beforeEach(async () => {
        repo = {
            findOne: jest.fn(),
            create: jest.fn((data) => data),
            save: jest.fn((data) => ({ id: "generated-id", ...data })),
        };

        const moduleRef = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: repo },
            ],
        }).compile();

        usersService = moduleRef.get(UsersService);
    });

    describe("create", () => {
        it("throws ConflictException if the email is already taken", async () => {
            repo.findOne.mockResolvedValue({ id: "existing-user" });

            await expect(
                usersService.create({
                    email: "taken@example.com",
                    password: "password123",
                    name: "Someone",
                }),
            ).rejects.toThrow(ConflictException);
        });

        it("never returns passwordHash on the created user", async () => {
            repo.findOne.mockResolvedValue(null);

            const result = await usersService.create({
                email: "new@example.com",
                password: "password123",
                name: "New Person",
            });

            expect(result).not.toHaveProperty("passwordHash");
            expect(result.email).toBe("new@example.com");
        });
    });

    describe("findById", () => {
        it("throws NotFoundException when no user matches", async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(usersService.findById("missing-id")).rejects.toThrow(
                NotFoundException,
            );
        });

        it("strips passwordHash from the returned user", async () => {
            repo.findOne.mockResolvedValue({
                id: "user-1",
                email: "user@example.com",
                passwordHash: "some-hash",
                name: "Test User",
                favoriteGames: [],
            });

            const result = await usersService.findById("user-1");
            expect(result).not.toHaveProperty("passwordHash");
        });
    });
});
