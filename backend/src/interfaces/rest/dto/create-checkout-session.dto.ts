import { IsString, IsNumber, IsEmail, IsObject, ValidateNested, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class ShippingAddressDto {
  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  country: string;

  @IsString()
  city: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  region: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;
}

class CustomerDataDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  phoneNumberPrefix?: string;

  @IsOptional()
  @IsString()
  legalId?: string;

  @IsOptional()
  @IsString()
  legalIdType?: string;
}

export class CreateCheckoutSessionDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsEmail()
  customerEmail: string;

  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CustomerDataDto)
  customerData?: CustomerDataDto;

  @IsOptional()
  @IsString()
  redirectUrl?: string;
}

