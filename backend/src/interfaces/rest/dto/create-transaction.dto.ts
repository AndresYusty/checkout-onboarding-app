import { IsString, IsNumber, IsEmail, IsObject, ValidateNested, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class CardDataDto {
  @IsString()
  number: string;

  @IsString()
  cvv: string;

  @IsString()
  expMonth: string;

  @IsString()
  expYear: string;

  @IsString()
  cardHolder: string;
}

class ShippingAddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;

  @IsString()
  phone: string;
}

export class CreateTransactionDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsEmail()
  customerEmail: string;

  @IsString()
  paymentToken: string;

  @IsObject()
  @ValidateNested()
  @Type(() => CardDataDto)
  cardData: CardDataDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;
}

