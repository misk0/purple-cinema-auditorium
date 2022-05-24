import { ParseIntPipe } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsNumberString, IsString } from "class-validator";

export class SeatDto {
    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    row: Number;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    column: Number;

    @IsString()
    @IsNotEmpty()
    type: String;
}