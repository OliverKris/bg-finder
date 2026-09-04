import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

interface JwtPayload {
    sub: string;
    email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET ?? "dev-secret-change-me",
        });
    }

    // Whatever this returns becomes `request.user` in protected routes.
    async validate(payload: JwtPayload) {
        return { userId: payload.sub, email: payload.email };
    }
}
