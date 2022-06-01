import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
class SeatConfig extends Document {
  @Prop({ required: true })
  row: Number;

  @Prop({ required: true })
  col: Number;

  @Prop({ required: true })
  type: String;
}
export const SeatConfigSchema = SchemaFactory.createForClass(SeatConfig);

export type AuditoriumDocument = Auditorium & Document;

@Schema()
export class Auditorium {
  @Prop({ required: true, type: String })
  name: String;

  @Prop({ type: String })
  theatre: String;

  @Prop({ type: Number })
  rows: Number;

  @Prop({ type: Number })
  columns: Number;

  @Prop({ type: Types.ObjectId, ref: 'SeatConfig' })
  seats: SeatConfig;
}

export const AuditoriumSchema = SchemaFactory.createForClass(Auditorium);
