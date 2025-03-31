import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HospitalUpdateDto } from './dto/hospital-update-dto';
import { HospitalsService } from './hospitals.service';
import { JwtAuthGuard } from '../jwt/jwt.auth.guard';

@Controller('hospitals')
@UseGuards(JwtAuthGuard)
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}
  @Patch('/:id')
  async updateHospital(
    @Param('id') id: string,
    @Body() hospitalUpdateDto: HospitalUpdateDto,
  ) {
    const updatedHospital = this.hospitalsService.updateHospital(
      id,
      hospitalUpdateDto,
    );

    return updatedHospital;
  }
}
