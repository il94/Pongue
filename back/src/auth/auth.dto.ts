import { IsEmail, IsString, IsNotEmpty, IsMobilePhone, IsOptional } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
	
	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	username: string;

	@IsEmail()
	@IsNotEmpty()
	@ApiProperty()
	email: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	hash: string;

}