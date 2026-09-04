import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

interface AuthenticatedRequest extends Request {
    user: { userId: string; email: string };
}

@Controller("users")
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(JwtAuthGuard)
    @Get("me")
    getCurrentUser(@Req() req: AuthenticatedRequest) {
        return this.usersService.findById(req.user.userId);
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.usersService.findById(id);
    }
}
