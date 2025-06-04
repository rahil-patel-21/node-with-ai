// Imports
import { Module } from '@nestjs/common';
import { LLMService } from 'src/llm/llm.service';
import { FileModule } from 'src/file/file.module';
import { ProjectService } from './project.service';
import { UtilsModule } from 'src/utils/utils.module';
import { ProjectController } from './project.controller';

@Module({
  imports: [FileModule, UtilsModule],
  controllers: [ProjectController],
  providers: [LLMService, ProjectService],
})
export class ProjectModule {}
