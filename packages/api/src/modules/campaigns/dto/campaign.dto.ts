import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const CAMPAIGN_CATEGORIES = [
  'education',
  'health',
  'disaster-relief',
  'community',
  'environment',
  'animals',
  'arts',
  'technology',
  'sports',
  'other',
] as const;

export const CAMPAIGN_SORTS = ['newest', 'most_raised', 'ending_soon'] as const;

export class CampaignMediaDto {
  @IsIn(['IMAGE', 'VIDEO'])
  type!: 'IMAGE' | 'VIDEO';

  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  url!: string;

  @IsInt()
  @Min(0)
  @Max(20)
  order!: number;
}

export class CreateCampaignDto {
  @IsString()
  @Length(5, 80)
  title!: string;

  @IsString()
  @Length(20, 10_000)
  description!: string;

  @IsIn(CAMPAIGN_CATEGORIES)
  category!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(10_000_000)
  goalUsd!: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CampaignMediaDto)
  media?: CampaignMediaDto[];
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @Length(5, 80)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(20, 10_000)
  description?: string;

  @IsOptional()
  @IsIn(CAMPAIGN_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(10_000_000)
  goalUsd?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CampaignMediaDto)
  media?: CampaignMediaDto[];
}

export class QueryCampaignsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(CAMPAIGN_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsIn(CAMPAIGN_SORTS)
  sort?: (typeof CAMPAIGN_SORTS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  limit?: number;
}
