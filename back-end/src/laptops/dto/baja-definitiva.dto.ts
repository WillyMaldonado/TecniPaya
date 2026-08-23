import { IsNotEmpty, IsString } from 'class-validator';

export class BajaDefinitivaDto {
  @IsNotEmpty()
  @IsString()
  motivoBaja: string;
}
