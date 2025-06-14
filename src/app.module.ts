// Imports
import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LLMModule } from './llm/llm.module';
import { FileModule } from './file/file.module';
import { AppController } from './app.controller';
import { UtilsModule } from './utils/utils.module';
import { SocketModule } from './socket/socket.module';
import { ProjectModule } from './project/project.module';

@Module({
  imports: [FileModule, LLMModule, ProjectModule, SocketModule, UtilsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
