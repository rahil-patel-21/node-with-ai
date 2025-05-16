// Imports
import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LLMModule } from './llm/llm.module';
import { AppController } from './app.controller';

@Module({
  imports: [LLMModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
