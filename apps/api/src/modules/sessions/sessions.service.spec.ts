import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { Session, SessionRepeat } from "./entities/session.entity";
import { UsersService } from "../users/users.service";

function makeUser(id: string) {
  return {
    id,
    email: `${id}@example.com`,
    passwordHash: "hashed",
    name: `User ${id}`,
    favoriteGames: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "session-1",
    games: ["Catan"],
    location: "Library",
    startTime: new Date(Date.now() + 86400000),
    maxPlayers: 4,
    repeats: SessionRepeat.NONE,
    owner: makeUser("owner-1"),
    participants: [makeUser("owner-1")],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Session;
}

describe("SessionsService", () => {
  let service: SessionsService;
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };
  let usersService: { findEntityById: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => data),
    };
    usersService = { findEntityById: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: getRepositoryToken(Session), useValue: repo },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = moduleRef.get(SessionsService);
  });

  describe("create", () => {
    it("auto-joins the owner as a participant", async () => {
      const owner = makeUser("owner-1");
      usersService.findEntityById.mockResolvedValue(owner);

      const result = await service.create("owner-1", {
        games: ["Catan"],
        location: "Library",
        startTime: new Date().toISOString(),
        maxPlayers: 4,
      });

      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].id).toBe("owner-1");
      expect(result.owner).not.toHaveProperty("passwordHash");
      expect(result.participants[0]).not.toHaveProperty("passwordHash");
    });
  });

  describe("join", () => {
    it("throws NotFoundException if the session does not exist", async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.join("missing-id", "user-2")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws ConflictException if the user already joined", async () => {
      const session = makeSession({
        participants: [makeUser("owner-1"), makeUser("user-2")],
      });
      repo.findOne.mockResolvedValue(session);

      await expect(service.join("session-1", "user-2")).rejects.toThrow(
        ConflictException,
      );
    });

    it("throws BadRequestException if the session is full", async () => {
      const session = makeSession({
        maxPlayers: 2,
        participants: [makeUser("owner-1"), makeUser("user-2")],
      });
      repo.findOne.mockResolvedValue(session);

      await expect(service.join("session-1", "user-3")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("adds the user to participants when there is room", async () => {
      const session = makeSession({
        maxPlayers: 4,
        participants: [makeUser("owner-1")],
      });
      repo.findOne.mockResolvedValue(session);
      usersService.findEntityById.mockResolvedValue(makeUser("user-2"));

      const result = await service.join("session-1", "user-2");
      expect(result.participants).toHaveLength(2);
    });
  });

  describe("leave", () => {
    it("throws ForbiddenException if the owner tries to leave", async () => {
      const session = makeSession();
      repo.findOne.mockResolvedValue(session);

      await expect(service.leave("session-1", "owner-1")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("removes a non-owner participant", async () => {
      const session = makeSession({
        participants: [makeUser("owner-1"), makeUser("user-2")],
      });
      repo.findOne.mockResolvedValue(session);

      const result = await service.leave("session-1", "user-2");
      expect(result.participants).toHaveLength(1);
      expect(
        result.participants.find((p) => p.id === "user-2"),
      ).toBeUndefined();
    });
  });

  describe("findAll", () => {
    it("filters by location when provided", async () => {
      repo.find.mockResolvedValue([
        makeSession({ id: "s1", location: "Downtown Library" }),
        makeSession({ id: "s2", location: "Uptown Cafe" }),
      ]);

      const result = await service.findAll("library");
      expect(result).toHaveLength(1);
      expect(result[0].location).toBe("Downtown Library");
    });
  });

  describe("findMine", () => {
    it("includes sessions where the user is the owner", async () => {
      repo.find.mockResolvedValue([
        makeSession({
          id: "s1",
          owner: makeUser("user-1"),
          participants: [makeUser("user-1")],
        }),
        makeSession({
          id: "s2",
          owner: makeUser("owner-2"),
          participants: [makeUser("owner-2")],
        }),
      ]);

      const result = await service.findMine("user-1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("s1");
    });

    it("includes sessions where the user is a participant but not the owner", async () => {
      repo.find.mockResolvedValue([
        makeSession({
          id: "s1",
          owner: makeUser("owner-1"),
          participants: [makeUser("owner-1"), makeUser("user-2")],
        }),
      ]);

      const result = await service.findMine("user-2");
      expect(result).toHaveLength(1);
    });

    it("excludes sessions the user has no connection to", async () => {
      repo.find.mockResolvedValue([
        makeSession({
          id: "s1",
          owner: makeUser("owner-1"),
          participants: [makeUser("owner-1")],
        }),
      ]);

      const result = await service.findMine("unrelated-user");
      expect(result).toHaveLength(0);
    });
  });
});
