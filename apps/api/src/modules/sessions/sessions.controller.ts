import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { SessionsService } from "./sessions.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string };
}

@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Query("location") location?: string) {
    return this.sessionsService.findAll(location);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.sessionsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/join")
  join(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.sessionsService.join(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/leave")
  leave(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.sessionsService.leave(id, req.user.userId);
  }
}
