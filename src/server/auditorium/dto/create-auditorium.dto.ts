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

  @IsNumber()
  @Min(1)
  rows: Number;

  @IsNumber()
  @Min(1)
  columns: Number;
}
