// Imports
import { Module } from '@nestjs/common';
import { RAGService } from './rag.service';
import { LLMModule } from 'src/llm/llm.module';

@Module({
  imports: [LLMModule],
  exports: [RAGService],
  providers: [RAGService],
})
export class RAGModule {}
