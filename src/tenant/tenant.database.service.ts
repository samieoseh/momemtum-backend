import { Injectable, Scope } from '@nestjs/common';
import { Connection, createConnection } from 'mongoose';

@Injectable({ scope: Scope.DEFAULT })
export class TenantDatabaseService {
  private connections: Map<string, Connection> = new Map();

  async getConnection(databaseUri: string): Promise<Connection | undefined> {
    if (this.connections.has(databaseUri)) {
      return this.connections.get(databaseUri);
    }

    const connection = await createConnection(databaseUri, {});
    connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });
    connection.on('connected', () => {
      console.log(`MongoDB connected to ${databaseUri}`);
    });
    this.connections.set(databaseUri, connection);
    return connection;
  }
}
