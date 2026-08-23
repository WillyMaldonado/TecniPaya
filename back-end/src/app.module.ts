import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClientsModule } from './clients/clients.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { LaptopsModule } from './laptops/laptops.module';

@Module({
  imports: [PrismaModule, ClientsModule, SuppliersModule, LaptopsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
