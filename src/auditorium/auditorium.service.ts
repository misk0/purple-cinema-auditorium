import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAuditoriumDto, EditAuditoriumDto, SeatDto } from './dto';
import { Auditorium, AuditoriumDocument } from './schemas/auditorium.schema';

@Injectable()
export class AuditoriumService {
    constructor( @InjectModel(Auditorium.name) 
                private auditoriumModel: Model<AuditoriumDocument>) {}
    
    async create(createAuditoriumDto: CreateAuditoriumDto): Promise<Auditorium> {
        let seats = [];
        for (let row = 0; row < createAuditoriumDto.rows; row++) {
            for (let col = 0; col < createAuditoriumDto.columns; col++ ){
                seats.push({'row': row, 'col': col, 'type': 'X'})
            }
        }
        (createAuditoriumDto as any).seats = seats;

        const createdAuditorum = new this.auditoriumModel(createAuditoriumDto);
        console.log(createAuditoriumDto);
        //createdAuditorum.populate({path: 'seats', populate: seats});
        return createdAuditorum.save();
    }

    async findAll() : Promise<Auditorium[]> {
        return await this.auditoriumModel.find().exec();
    }

    async getAuditoriumById(auditoriumId: string) {
        return await this.auditoriumModel.findById(auditoriumId);
    }

    async updateAuditorum(auditoriumId: string, editAuditorium: EditAuditoriumDto ) {
        const editedAuditorium = this.auditoriumModel.findByIdAndUpdate(auditoriumId, editAuditorium, {new: true})
        return editedAuditorium;
    }

    async delete(auditoriumId: string) {
        return this.auditoriumModel.deleteOne({ _id: auditoriumId});
        
    }

    async getAuditoriumSeatsById(auditoriumId: string) {
        return  await this.auditoriumModel.findById(auditoriumId).select('seats');
    }

    async editSeatType(auditoriumId: string, seatConfig: SeatDto) {
        console.log(seatConfig);
        return await this.auditoriumModel.updateOne({_id: auditoriumId, seats: { $elemMatch: {row: seatConfig.row, col: seatConfig.column}}},
                                                    {"$set": {"seats.$.type": seatConfig.type}});
    }


}
