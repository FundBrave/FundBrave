import { IsString, IsNotEmpty, IsOptional, Length, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InputType, Field } from '@nestjs/graphql';

@InputType('Enable2FAInput')
export class Enable2FAInput {
  @ApiProperty({ description: 'Current password to verify identity' })
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Password is required to enable 2FA' })
  password: string;

  @ApiPropertyOptional({ description: '2FA method: "app" for authenticator app, "email" for email-based' })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  method?: 'app' | 'email';
}

@InputType('Verify2FAInput')
export class Verify2FAInput {
  @ApiProperty({ description: '6-digit verification code from authenticator app' })
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  code: string;
}

@InputType('Disable2FAInput')
export class Disable2FAInput {
  @ApiProperty({ description: 'Current password to verify identity' })
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Password is required to disable 2FA' })
  password: string;

  @ApiProperty({ description: '6-digit verification code or backup code' })
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  code: string;
}

@InputType('RegenerateBackupCodesInput')
export class RegenerateBackupCodesInput {
  @ApiProperty({ description: 'Current password to verify identity' })
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({ description: '6-digit verification code' })
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  code: string;
}
