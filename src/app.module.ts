import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StaticController } from './static.controller';

@Module({
  imports: [],
  controllers: [AppController, StaticController],
  providers: [AppService],
})
export class AppModule {}
