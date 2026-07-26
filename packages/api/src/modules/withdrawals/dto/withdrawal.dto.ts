import { IsEthereumAddress, IsInt, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWithdrawalDto {
  @IsString()
  campaignId!: string;

  @Type(() => Number)
  @IsInt()
  chainId!: number;

  @IsOptional()
  @IsEthereumAddress()
  tokenAddress?: string;

  /** Integer string in token base units */
  @IsString()
  @Matches(/^[1-9]\d*$/, { message: 'amountRaw must be a positive integer string' })
  @MaxLength(78)
  amountRaw!: string;
}

export class SignatureDto {
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{130}$/, { message: 'signature must be a 65-byte hex string' })
  signature!: string;
}

export class RejectDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}
