import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// Usage on a future controller: @UseGuards(JwtAuthGuard)
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
