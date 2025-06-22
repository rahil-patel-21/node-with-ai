// Imports
import { Sequelize } from 'sequelize';
import { Env } from 'src/constants/Env';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SupabaseService {
  constructor() {}

  async inject(reqData: {
    raw_query: string;
    db_config: {
      username: string;
      password: string;
    };
  }) {
    const { raw_query, db_config } = reqData;

    if (!raw_query) {
      return { error: true, message: 'Parameter raw_query is missing' };
    }
    if (!db_config) {
      return { error: true, message: 'Invalid db_config' };
    }

    const sequelize = new Sequelize(
      'postgres', // DB name
      db_config.username, // Username
      db_config.password, // Password
      {
        host: Env.database.supabase.postgres.host, // Host
        dialect: 'postgres',
        logging: false, // set to true for SQL logs
      },
    );

    try {
      await sequelize.authenticate();
      const [results, metadata] = await sequelize.query(raw_query);
      await sequelize.close();

      return { error: false, results };
    } catch (error) {
      return {
        error: true,
        message: error.message,
        detail: error.parent?.detail || null,
      };
    }
  }
}
