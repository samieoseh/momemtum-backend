import { IsNotEmpty, IsString } from 'class-validator';

export class HospitalRegistrationDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  readonly email: string;
}
