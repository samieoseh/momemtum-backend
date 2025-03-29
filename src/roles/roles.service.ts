import { Injectable } from '@nestjs/common';
import { roles } from './constants/roles';
import { Connection } from 'mongoose';
import { RoleSchema } from './domain/role.schema';

@Injectable()
export class RolesService {
  async createDefaultRoles(tenantConnection: Connection) {
    const existingRoles = await tenantConnection
      .model('Role', RoleSchema)
      .find();

    if (existingRoles.length > 0) {
      return existingRoles;
    }

    console.log('Creating default roles...');

    const roleModel = tenantConnection.model('Role', RoleSchema);

    for (const role of roles) {
      await roleModel.create({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      });
    }

    const allRoles = await roleModel.find();
    console.log(
      'All roles created ::',
      allRoles.map((role) => role.name),
    );
    return allRoles;
  }
}
