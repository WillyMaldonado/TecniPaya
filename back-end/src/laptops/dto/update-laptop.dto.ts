import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateLaptopDto } from './create-laptop.dto';

export class UpdateLaptopDto extends PartialType(
  OmitType(CreateLaptopDto, ['codigoInventario', 'licencias'] as const),
) {}