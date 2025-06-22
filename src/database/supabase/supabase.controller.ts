// Imports
import { SupabaseService } from './supabase.service';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('database/supabase')
export class SupabaseController {
  constructor(private readonly service: SupabaseService) {}

  @Post('inject')
  async funInject(@Body() body) {
    return await this.service.inject(body);
  }
}
