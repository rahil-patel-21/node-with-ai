// Imports
import { LLMService } from './llm.service';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('llm')
export class LLMController {
  constructor(private readonly service: LLMService) {}

  @Post('initSession')
  async funInitSession(@Body() body) {
    return await this.service.initSession(body);
  }
}
