import {
    IsArray,
    IsEmail,
    IsOptional,
    IsString,
    MinLength,
} from "class-validator";

export class CreateUserDto {
    @IsEmail()
    email!: string;

    @MinLength(8)
    password!: string;

    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsArray()
    favoriteGames?: string[];

    @IsOptional()
    @IsString()
    location?: string;
}
