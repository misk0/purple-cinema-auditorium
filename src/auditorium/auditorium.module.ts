import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditoriumController } from './auditorium.controller';
import { AuditoriumService } from './auditorium.service';
import { Auditorium, AuditoriumSchema } from './schemas/auditorium.schema';

@Module({
  imports: [ MongooseModule.forFeature( [ {name: Auditorium.name, schema: AuditoriumSchema} ] ) ],
  controllers: [AuditoriumController],
  providers: [AuditoriumService]
})
export class AuditoriumModule {}
