// Imports
import { Module } from '@nestjs/common';
import { UtilsModule } from 'src/utils/utils.module';
import { SupabaseService } from './supabase.service';
import { SupabaseController } from './supabase.controller';

@Module({
  controllers: [SupabaseController],
  imports: [UtilsModule],
  providers: [SupabaseService],
})
export class SupabaseModule {}
