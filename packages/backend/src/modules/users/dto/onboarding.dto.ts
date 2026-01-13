import { Field, ObjectType, InputType } from '@nestjs/graphql';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUrl,
  IsArray,
  IsDateString,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  MinLength,
  Matches,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== Valid Goal and Interest IDs ====================

/**
 * Valid goal IDs for onboarding
 * These match the frontend goal options
 */
export const VALID_GOAL_IDS = [
  'raise-funds',
  'support-causes',
  'build-community',
  'discover-projects',
  'invest-impact',
  'learn-defi',
] as const;

export type GoalId = (typeof VALID_GOAL_IDS)[number];

/**
 * Valid interest category IDs for onboarding
 * These match the frontend interest categories
 */
export const VALID_INTEREST_IDS = [
  'education',
  'healthcare',
  'environment',
  'poverty',
  'animal-welfare',
  'arts-culture',
  'disaster-relief',
  'human-rights',
  'community-development',
  'technology',
  'sports-recreation',
  'veterans',
] as const;

export type InterestId = (typeof VALID_INTEREST_IDS)[number];

// ==================== Input DTOs ====================

/**
 * Profile data for onboarding step
 */
@InputType('OnboardingProfileInput')
export class OnboardingProfileDto {
  @Field()
  @ApiProperty({
    description: 'Unique username for the user',
    example: 'john_doe',
    minLength: 3,
    maxLength: 30,
  })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'User birthdate in ISO 8601 format',
    example: '1990-05-15',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Birthdate must be a valid ISO 8601 date string' },
  )
  birthdate?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'User bio/description',
    example: 'Passionate about making a positive impact through blockchain.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Avatar URL (if user provides custom avatar)',
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  avatarUrl?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Display name',
    example: 'John Doe',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Display name cannot exceed 50 characters' })
  displayName?: string;
}

/**
 * Complete onboarding request DTO
 * Contains all data collected during onboarding flow
 */
@InputType('CompleteOnboardingInput')
export class CompleteOnboardingDto {
  @Field(() => OnboardingProfileDto)
  @ApiProperty({
    description: 'User profile information',
    type: OnboardingProfileDto,
  })
  @ValidateNested()
  @Type(() => OnboardingProfileDto)
  profile: OnboardingProfileDto;

  @Field(() => [String])
  @ApiProperty({
    description: 'Array of goal IDs (at least 1 required)',
    example: ['raise-funds', 'support-causes'],
    isArray: true,
  })
  @IsArray({ message: 'Goals must be an array' })
  @ArrayMinSize(1, { message: 'At least one goal is required' })
  @ArrayMaxSize(6, { message: 'Cannot select more than 6 goals' })
  @IsString({ each: true, message: 'Each goal must be a string' })
  @IsIn(VALID_GOAL_IDS, { each: true, message: 'Invalid goal ID provided' })
  goals: string[];

  @Field(() => [String], { nullable: true })
  @ApiPropertyOptional({
    description: 'Array of interest category IDs',
    example: ['education', 'healthcare', 'environment'],
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: 'Interests must be an array' })
  @ArrayMaxSize(12, { message: 'Cannot select more than 12 interests' })
  @IsString({ each: true, message: 'Each interest must be a string' })
  @IsIn(VALID_INTEREST_IDS, {
    each: true,
    message: 'Invalid interest ID provided',
  })
  interests?: string[];
}

// ==================== Output DTOs ====================

/**
 * Onboarding status response
 */
@ObjectType('OnboardingStatus')
export class OnboardingStatusDto {
  @Field()
  @ApiProperty({
    description: 'Whether onboarding has been completed',
    example: false,
  })
  completed: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Username if already set',
    example: 'john_doe',
  })
  username?: string;

  @Field()
  @ApiProperty({
    description: 'Whether user has set a username',
    example: true,
  })
  hasUsername: boolean;

  @Field()
  @ApiProperty({
    description: 'Whether user has set goals',
    example: false,
  })
  hasGoals: boolean;

  @Field()
  @ApiProperty({
    description: 'Whether user has set interests',
    example: false,
  })
  hasInterests: boolean;

  @Field()
  @ApiProperty({
    description: 'Whether user has an avatar',
    example: true,
  })
  hasAvatar: boolean;
}

/**
 * Onboarding completion response
 */
@ObjectType('OnboardingCompletionResponse')
export class OnboardingCompletionResponseDto {
  @Field()
  @ApiProperty({
    description: 'Whether onboarding was completed successfully',
    example: true,
  })
  success: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Success or error message',
    example: 'Onboarding completed successfully',
  })
  message?: string;
}
