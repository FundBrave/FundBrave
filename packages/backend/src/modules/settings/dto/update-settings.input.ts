import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InputType, Field } from '@nestjs/graphql';

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru', 'ar'];
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'BTC', 'ETH'];

@InputType('UpdateSettingsInput')
export class UpdateSettingsInput {
  @ApiPropertyOptional({ description: 'Preferred language', enum: SUPPORTED_LANGUAGES })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_LANGUAGES, { message: 'Invalid language code' })
  language?: string;

  @ApiPropertyOptional({ description: 'Preferred timezone' })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Preferred currency', enum: SUPPORTED_CURRENCIES })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_CURRENCIES, { message: 'Invalid currency code' })
  currency?: string;

  @ApiPropertyOptional({ description: 'Enable dark mode' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  darkMode?: boolean;
}
