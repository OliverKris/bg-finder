import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HealthController } from "./health.controller";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { SessionsModule } from "./modules/sessions/sessions.module";

@Module({
  imports: [
    // Loads .env into process.env; isGlobal means every module can use it.
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? "postgres",
      password: process.env.DB_PASSWORD ?? "postgres",
      database: process.env.DB_NAME ?? "boardgame",
      autoLoadEntities: true,
      // synchronize is convenient for local dev only — never in production.
      synchronize: process.env.NODE_ENV !== "production",
    }),
    UsersModule,
    AuthModule,
    SessionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
