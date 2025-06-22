// Imports
import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { LLMController } from './llm.controller';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [UtilsModule],
  controllers: [LLMController],
  exports: [LLMService],
  providers: [LLMService],
})
export class LLMModule {}
