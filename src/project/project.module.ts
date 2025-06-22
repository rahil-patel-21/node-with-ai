// Imports
import { Module } from '@nestjs/common';
import { RAGModule } from 'src/rag/rag.module';
import { LLMService } from 'src/llm/llm.service';
import { FileModule } from 'src/file/file.module';
import { ProjectService } from './project.service';
import { UtilsModule } from 'src/utils/utils.module';
import { SocketModule } from 'src/socket/socket.module';
import { ProjectController } from './project.controller';

@Module({
  imports: [FileModule, RAGModule, SocketModule, UtilsModule],
  controllers: [ProjectController],
  providers: [LLMService, ProjectService],
})
export class ProjectModule {}
