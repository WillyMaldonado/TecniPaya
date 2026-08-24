import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    const existente = await this.prisma.cliente.findUnique({
      where: { nit: dto.nit },
    });
    if (existente) {
      throw new ConflictException(`Ya existe un cliente con NIT ${dto.nit}`);
    }
    return this.prisma.cliente.create({ data: dto });
  }

  findAll(soloActivos = true) {
    return this.prisma.cliente.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(nit: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { nit } });
    if (!cliente) {
      throw new NotFoundException(`Cliente con NIT ${nit} no encontrado`);
    }
    return cliente;
  }

  async update(nit: string, dto: UpdateClientDto) {
    await this.findOne(nit);
    return this.prisma.cliente.update({ where: { nit }, data: dto });
  }

  async inactivar(nit: string) {
    await this.findOne(nit);
    return this.prisma.cliente.update({
      where: { nit },
      data: { activo: false },
    });
  }
}
