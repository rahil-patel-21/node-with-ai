// Imports
import { Module } from '@nestjs/common';
import { LLMService } from 'src/llm/llm.service';
import { FileModule } from 'src/file/file.module';
import { ProjectService } from './project.service';
import { UtilsModule } from 'src/utils/utils.module';
import { ProjectController } from './project.controller';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [FileModule, SocketModule, UtilsModule],
  controllers: [ProjectController],
  providers: [LLMService, ProjectService],
})
export class ProjectModule {}
