import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InputType, Field } from '@nestjs/graphql';

@InputType('UpdateNotificationSettingsInput')
export class UpdateNotificationSettingsInput {
  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable push notifications' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Notify on likes' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnLike?: boolean;

  @ApiPropertyOptional({ description: 'Notify on comments' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnComment?: boolean;

  @ApiPropertyOptional({ description: 'Notify on follows' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnFollow?: boolean;

  @ApiPropertyOptional({ description: 'Notify on mentions' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnMention?: boolean;

  @ApiPropertyOptional({ description: 'Notify on donations received' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnDonation?: boolean;

  @ApiPropertyOptional({ description: 'Notify on stake events' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnStake?: boolean;

  @ApiPropertyOptional({ description: 'Notify on yield harvest' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnYieldHarvest?: boolean;

  @ApiPropertyOptional({ description: 'Notify on stock purchases' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnStockPurchase?: boolean;

  @ApiPropertyOptional({ description: 'Notify on FBT vesting events' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnFBTVesting?: boolean;

  @ApiPropertyOptional({ description: 'Notify on DAO proposals' })
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnDAOProposal?: boolean;
}
