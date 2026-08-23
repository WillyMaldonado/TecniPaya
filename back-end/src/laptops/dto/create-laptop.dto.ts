import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsUUID,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateLaptopDto {
  @IsNotEmpty()
  @IsString()
  codigoInventario: string;

  @IsNotEmpty()
  @IsString()
  marca: string;

  @IsNotEmpty()
  @IsString()
  modelo: string;

  @IsNotEmpty()
  @IsUUID()
  proveedorId: string;

  @IsNotEmpty()
  @IsBoolean()
  maletin: boolean;

  @IsNotEmpty()
  @IsBoolean()
  cargador: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  licencias?: string[];
}
