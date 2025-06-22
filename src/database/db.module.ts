// Imports
import { sequelize } from './sequelize';
import { Document } from './models/document.model';
import { Module, OnModuleInit } from '@nestjs/common';
import { SupabaseToken } from './models/supabase.token.model';

@Module({})
export class DatabaseModule implements OnModuleInit {
  async onModuleInit() {
    try {
      await sequelize.authenticate();

      Document.sync();
      SupabaseToken.sync({ alter: true }); // Alter table if not exists
      console.log('✅ Models synced');

      console.log('✅ PostgreSQL connection established (via Nest)');
    } catch (error) {
      console.error('❌ DB connection failed:', error);
    }
  }
}
