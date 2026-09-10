import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThanOrEqual, Repository } from "typeorm";
import { Session } from "./entities/session.entity";
import { CreateSessionDto } from "./dto/create-session.dto";
import { User } from "../users/entities/user.entity";
import { UsersService, PublicUser } from "../users/users.service";

export type PublicSession = Omit<Session, "owner" | "participants"> & {
  owner: PublicUser;
  participants: PublicUser[];
};

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepo: Repository<Session>,
    private readonly usersService: UsersService,
  ) {}

  async create(ownerId: string, dto: CreateSessionDto): Promise<PublicSession> {
    const owner = await this.usersService.findEntityById(ownerId);

    const session = this.sessionsRepo.create({
      games: dto.games,
      description: dto.description,
      location: dto.location,
      startTime: new Date(dto.startTime),
      maxPlayers: dto.maxPlayers,
      repeats: dto.repeats,
      owner,
      participants: [owner],
    });

    const saved = await this.sessionsRepo.save(session);
    return this.toPublicSession(saved);
  }

  async findAll(location?: string): Promise<PublicSession[]> {
    const sessions = await this.sessionsRepo.find({
      where: {
        startTime: MoreThanOrEqual(new Date()),
      },
      order: { startTime: "ASC" },
    });

    const filtered = location
      ? sessions.filter((s) =>
          s.location.toLowerCase().includes(location.toLowerCase()),
        )
      : sessions;

    return filtered.map((s) => this.toPublicSession(s));
  }

  async findOne(id: string): Promise<PublicSession> {
    const session = await this.sessionsRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException("Session not found");
    return this.toPublicSession(session);
  }

  async findMine(userId: string): Promise<PublicSession[]> {
    const sessions = await this.sessionsRepo.find({
      order: { startTime: "ASC" },
    });

    const mine = sessions.filter(
      (s) =>
        s.owner.id === userId || s.participants.some((p) => p.id === userId),
    );

    return mine.map((s) => this.toPublicSession(s));
  }

  async join(sessionId: string, userId: string): Promise<PublicSession> {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException("Session not found");

    const alreadyJoined = session.participants.some((p) => p.id === userId);
    if (alreadyJoined) {
      throw new ConflictException("Already joined this session");
    }

    if (session.participants.length >= session.maxPlayers) {
      throw new BadRequestException("Session is full");
    }

    const user = await this.usersService.findEntityById(userId);
    session.participants.push(user);

    const saved = await this.sessionsRepo.save(session);
    return this.toPublicSession(saved);
  }

  async leave(sessionId: string, userId: string): Promise<PublicSession> {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException("Session not found");

    if (session.owner.id === userId) {
      throw new ForbiddenException("The owner cannot leave their own session");
    }

    session.participants = session.participants.filter((p) => p.id !== userId);

    const saved = await this.sessionsRepo.save(session);
    return this.toPublicSession(saved);
  }

  private toPublicSession(session: Session): PublicSession {
    const { owner, participants, ...rest } = session;
    return {
      ...rest,
      owner: this.stripPassword(owner),
      participants: participants.map((p) => this.stripPassword(p)),
    };
  }

  private stripPassword(user: User): PublicUser {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }
}
