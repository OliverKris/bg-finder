import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Session } from "./entities/session.entity";
import { SessionsService } from "./sessions.service";
import { SessionsController } from "./sessions.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([Session]), UsersModule],
  providers: [SessionsService],
  controllers: [SessionsController],
})
export class SessionsModule {}
