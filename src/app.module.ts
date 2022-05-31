import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditoriumModule } from './auditorium/auditorium.module';
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  imports: [    
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuditoriumModule,
    ConfigModule,
//    MongooseModule.forRoot('mongodb://192.168.111.202:32017/auditorium')
    MongooseModule.forRootAsync({
      imports:[ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URL")
      }),
      inject: [ConfigService]
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private configService: ConfigService) {
    MongooseModule.forRoot(configService.get<string>("MONGODB_URL"))
  };
}
