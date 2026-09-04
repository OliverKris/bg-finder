import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsersModule } from "../users/users.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret:
                    config.get<string>("JWT_SECRET") ?? "dev-secret-change-me",
                signOptions: { expiresIn: "7d" },
            }),
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
})
export class AuthModule {}
