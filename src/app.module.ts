import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { AppController } from './app.controller';
import { CalService } from './cal.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [CalService],
})
export class AppModule {}
