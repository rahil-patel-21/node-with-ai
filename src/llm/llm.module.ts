// Imports
import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { LLMController } from './llm.controller';

@Module({ controllers: [LLMController], providers: [LLMService] })
export class LLMModule {}
