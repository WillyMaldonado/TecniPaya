import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { LaptopsService } from './laptops.service';
import { CreateLaptopDto } from './dto/create-laptop.dto';
import { UpdateLaptopDto } from './dto/update-laptop.dto';
import { BajaDefinitivaDto } from './dto/baja-definitiva.dto';
import { EnviarReparacionDto } from './dto/enviar-reparacion.dto';
import { ApiTags } from '@nestjs/swagger';
import { EstadoLaptop } from '@prisma/client';

@ApiTags('Laptops')
@Controller('laptops')
export class LaptopsController {
  constructor(private readonly laptopsService: LaptopsService) {}

  @Post()
  create(@Body() dto: CreateLaptopDto) {
    return this.laptopsService.create(dto);
  }

  @Get()
  findAll(@Query('estado') estado?: EstadoLaptop) {
    return this.laptopsService.findAll(estado);
  }

  @Get(':codigoInventario')
  findOne(@Param('codigoInventario') codigoInventario: string) {
    return this.laptopsService.findOne(codigoInventario);
  }

  @Patch(':codigoInventario')
  update(
    @Param('codigoInventario') codigoInventario: string,
    @Body() dto: UpdateLaptopDto,
  ) {
    return this.laptopsService.update(codigoInventario, dto);
  }

  @Delete(':codigoInventario/baja-definitiva')
  darBajaDefinitiva(
    @Param('codigoInventario') codigoInventario: string,
    @Body() dto: BajaDefinitivaDto,
  ) {
    return this.laptopsService.darBajaDefinitiva(codigoInventario, dto);
  }

  @Post(':codigoInventario/reparacion')
  enviarAReparacion(
    @Param('codigoInventario') codigoInventario: string,
    @Body() dto: EnviarReparacionDto,
  ) {
    return this.laptopsService.enviarAReparacion(codigoInventario, dto);
  }

  @Patch(':codigoInventario/reparacion/retorno')
  registrarRetorno(@Param('codigoInventario') codigoInventario: string) {
    return this.laptopsService.registrarRetornoReparacion(codigoInventario);
  }
}
