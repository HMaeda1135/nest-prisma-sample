import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email?: string;
}
