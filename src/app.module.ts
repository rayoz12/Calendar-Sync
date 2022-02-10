import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { AppController } from './app.controller';
import { CalService } from './cal.service';
import { DbService } from './db.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [CalService, DbService],
})
export class AppModule {}
