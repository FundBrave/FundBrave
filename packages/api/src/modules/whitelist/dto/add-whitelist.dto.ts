import { IsEmail } from 'class-validator';

export class AddWhitelistDto {
  @IsEmail()
  email!: string;
}
