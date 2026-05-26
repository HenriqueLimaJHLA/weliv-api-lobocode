import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, Min } from 'class-validator';

export class UpdateProfessionalDto {
  @IsOptional()
  @IsString()
  professionalTitle?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string; // CRM / conselho

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationPrice?: number;

  @IsOptional()
  @IsBoolean()
  acceptsInsurance?: boolean;

  @IsOptional()
  @IsArray()
  insurances?: string[];

  @IsOptional()
  @IsString()
  professionalCnpj?: string;

  @IsOptional()
  @IsString()
  professionalAddress?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
