import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { SessionRepeat } from "../entities/session.entity";

export class CreateSessionDto {
  @IsString()
  game!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  location!: string;

  @IsDateString()
  startTime!: string;

  @IsInt()
  @Min(2)
  maxPlayers!: number;

  @IsOptional()
  @IsEnum(SessionRepeat)
  repeats?: SessionRepeat;
}
