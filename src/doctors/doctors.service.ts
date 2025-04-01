import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Doctor } from './domain/doctors.schema';
import { Model } from 'mongoose';

@Injectable()
export class DoctorsService {
  constructor(@InjectModel(Doctor.name) readonly doctorModel: Model<Doctor>) {}
  async findDoctor(id: string) {
    return this.doctorModel.findOne({ _id: id }).populate('userId');
  }
}
