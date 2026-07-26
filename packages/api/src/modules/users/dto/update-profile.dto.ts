import { IsOptional, IsString, IsUrl, Length, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(3, 20)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'username may only contain lowercase letters, numbers and underscores',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;
}
