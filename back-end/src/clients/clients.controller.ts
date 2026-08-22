import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ClientesService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.clientesService.create(dto);
  }

  @Get()
  findAll(@Query('todos') todos?: string) {
    const incluirInactivos = todos?.toLowerCase() === 'true';
    return this.clientesService.findAll(!incluirInactivos);
  }

  @Get(':nit')
  findOne(@Param('nit') nit: string) {
    return this.clientesService.findOne(nit);
  }

  @Patch(':nit')
  update(@Param('nit') nit: string, @Body() dto: UpdateClientDto) {
    return this.clientesService.update(nit, dto);
  }

  @Delete(':nit')
  inactivar(@Param('nit') nit: string) {
    return this.clientesService.inactivar(nit);
  }
}
