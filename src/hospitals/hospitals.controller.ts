import {
  Body,
  Controller,
  Delete,
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

  @Delete('/:tenantId/:hospitalId')
  async deleteHospital(
    @Param('tenantId') tenantId: string,
    @Param('hospitalId') hospitalId: string,
  ) {
    const result = await this.hospitalsService.deleteHospital(
      tenantId,
      hospitalId,
    );
    return {
      tenantId: result.tenantId,
      hospitalId: result.hospitalId,
      message: 'Hospital deleted successfully',
    };
  }
}
