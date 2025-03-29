import { IsNotEmpty, IsString } from 'class-validator';
import { SignupDto } from './signup-dto';

export class CompanyRegistrationDto {
  @IsNotEmpty()
  @IsString()
  readonly companyName: string;

  @IsNotEmpty()
  @IsString()
  readonly email: string;
}
