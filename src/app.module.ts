// Imports
import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LLMModule } from './llm/llm.module';
import { AppController } from './app.controller';
import { UtilsModule } from './utils/utils.module';
import { ProjectModule } from './project/project.module';

@Module({
  imports: [LLMModule, ProjectModule, UtilsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
