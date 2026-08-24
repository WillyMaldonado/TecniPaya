import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class EnviarReparacionDto {
  @IsNotEmpty()
  @IsUUID()
  proveedorId: string;

  @IsOptional()
  @IsDateString()
  fechaEstimadaRetorno?: string;

  @IsNotEmpty()
  @IsString()
  motivoFalla: string;
}