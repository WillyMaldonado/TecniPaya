import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLoanDto: CreateLoanDto) {
    return this.loansService.create(createLoanDto);
  }

  @Get()
  findAll(
    @Query('clienteNit') clienteNit?: string,
    @Query('laptopCodigo') laptopCodigo?: string,
  ) {
    return this.loansService.findAll({ clienteNit, laptopCodigo });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Patch(':id/cerrar')
  @HttpCode(HttpStatus.OK)
  cerrarPrestamo(@Param('id') id: string) {
    return this.loansService.cerrarPrestamo(id);
  }
}
