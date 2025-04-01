import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsNumber,
  Min,
  MaxLength,
  IsMongoId,
} from 'class-validator';

export class DoctorDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  readonly userId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  readonly medicalLicenseNumber: string;

  @IsNotEmpty()
  @IsString()
  readonly specialization: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  readonly yearsOfExperience: number;
}
