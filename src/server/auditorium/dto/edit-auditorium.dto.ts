import {
  IsOptional,
  IsString
} from 'class-validator';

export class EditAuditoriumDto {
  @IsString()
  @IsOptional()
  name: String;

  @IsString()
  @IsOptional()
  theatre: String;
}
