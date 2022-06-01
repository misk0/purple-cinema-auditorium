import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  isValidationOptions,
} from 'class-validator';

export class CreateAuditoriumDto {
  @IsString()
  @IsNotEmpty()
  name: String;

  @IsString()
  @IsOptional()
  theatre: String;

  @IsNumberString({}, { message: 'Rows parameter is missing or malformed' })
  rows: Number;

  @IsNumberString({}, { message: 'Columns parameter is missing or malformed' })
  columns: Number;
}
