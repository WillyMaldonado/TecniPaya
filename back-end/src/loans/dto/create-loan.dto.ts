import {
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsDateString,
  IsString,
} from 'class-validator';

export class CreateLoanDto {
  @IsNotEmpty()
  @IsString()
  clienteId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  laptopIds: string[];

  @IsNotEmpty()
  @IsDateString()
  fechaEntrega: string;

  @IsNotEmpty()
  @IsDateString()
  fechaDevolucionEstimada: string;
}
