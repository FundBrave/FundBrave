import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InputType, Field } from '@nestjs/graphql';

@InputType('UpdatePrivacySettingsInput')
export class UpdatePrivacySettingsInput {
  @ApiPropertyOptional({ description: 'Make profile private' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: 'Show wallet balance publicly' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  showWalletBalance?: boolean;

  @ApiPropertyOptional({ description: 'Show donation history publicly' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  showDonationHistory?: boolean;

  @ApiPropertyOptional({ description: 'Show staking activity publicly' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  showStakingActivity?: boolean;

  @ApiPropertyOptional({ description: 'Allow direct messages from anyone' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  allowMessagesFromAnyone?: boolean;

  @ApiPropertyOptional({ description: 'Show online status' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @ApiPropertyOptional({ description: 'Show profile to search engines' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  showInSearchEngines?: boolean;
}
