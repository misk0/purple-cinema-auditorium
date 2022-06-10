import {
  IsNotEmpty,
  IsNumber, IsOptional,
  IsString, Min
} from 'class-validator';

export class CreateAuditoriumDto {
  @IsString()
  @IsNotEmpty()
  name: String;

  @IsString()
  @IsOptional()
  theatre: String;

  //@IsNumberString({}, { message: 'Rows parameter is missing or malformed' })
  @IsNumber()
  @Min(1)
  rows: Number;

  @IsNumber()
  @Min(1)
  //@IsNumberString({}, { message: 'Columns parameter is missing or malformed' })
  columns: Number;
}
