import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuditoriumModule } from './auditorium/auditorium.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [    
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuditoriumModule,
    MongooseModule.forRoot('mongodb://192.168.111.202:32017/auditorium')
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
