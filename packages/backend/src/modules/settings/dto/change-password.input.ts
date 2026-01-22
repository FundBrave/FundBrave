import { IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InputType, Field } from '@nestjs/graphql';

@InputType('ChangePasswordInput')
export class ChangePasswordInput {
  @ApiProperty({ description: 'Current password' })
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    description: 'New password (min 8 characters, must contain uppercase, lowercase, number, and special character)',
    minLength: 8,
    maxLength: 128,
  })
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;

  @ApiProperty({ description: 'Confirm new password' })
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmPassword: string;

  @ApiPropertyOptional({ description: 'Log out all other sessions after password change' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  logoutAllSessions?: boolean;
}

@InputType('SetPasswordInput')
export class SetPasswordInput {
  @ApiProperty({
    description: 'New password for users who registered with wallet/OAuth',
    minLength: 8,
    maxLength: 128,
  })
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({ description: 'Confirm password' })
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmPassword: string;
}
