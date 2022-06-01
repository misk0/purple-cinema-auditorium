import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { AuditoriumService as AuditoriumService } from './auditorium.service';
import { CreateAuditoriumDto, EditAuditoriumDto, SeatDto } from './dto';
import { SeatType } from './enums/seat-type.enum';

@Controller('auditoriums')
export class AuditoriumController {
  constructor(private auditoriumService: AuditoriumService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  createAuditorium(@Body() auditoriumDto: CreateAuditoriumDto) {
    return this.auditoriumService.create(auditoriumDto);
  }

  @Get()
  getAuditoriums() {
    return this.auditoriumService.findAll();
  }

  @Get(':id')
  getAuditoriumById(@Param('id') auditoriumId: string) {
    return this.auditoriumService.getAuditoriumById(auditoriumId);
  }

  @Get('getSeats/:id')
  getAuditoriumSeats(@Param('id') auditoriumId: string) {
    return this.auditoriumService.getAuditoriumSeatsById(auditoriumId);
  }

  @Patch(':id')
  editAuditoriumById(
    @Param('id') auditoriumId: string,
    @Body() editAuditorium: EditAuditoriumDto,
  ) {
    return this.auditoriumService.updateAuditorum(auditoriumId, editAuditorium);
  }

  @Delete(':id')
  deleteAuditoriumById(@Param('id') auditoriumId: string) {
    return this.auditoriumService.delete(auditoriumId);
  }

  @Put('editSeat/:id')
  editSeatTypeById(
    @Param('id') auditoriumId: string,
    @Body() seatConfig: SeatDto,
  ) {
    return this.auditoriumService.editSeatType(auditoriumId, seatConfig);
  }
}
