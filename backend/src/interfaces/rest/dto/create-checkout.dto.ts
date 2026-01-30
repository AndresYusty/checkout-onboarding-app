import { IsString, IsEmail, IsNotEmpty, IsObject, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class CustomerDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

class DeliveryDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsOptional()
  region?: string;
}

class CardDto {
  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsNotEmpty()
  expMonth: string;

  @IsString()
  @IsNotEmpty()
  expYear: string;

  @IsString()
  @IsNotEmpty()
  cvc: string;
}

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsObject()
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryDto)
  delivery: DeliveryDto;

  @IsObject()
  @ValidateNested()
  @Type(() => CardDto)
  card: CardDto;
}

