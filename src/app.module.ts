// Imports
import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { RAGModule } from './rag/rag.module';
import { LLMModule } from './llm/llm.module';
import { FileModule } from './file/file.module';
import { AppController } from './app.controller';
import { UtilsModule } from './utils/utils.module';
import { SocketModule } from './socket/socket.module';
import { DatabaseModule } from './database/db.module';
import { ProjectModule } from './project/project.module';
import { SupabaseModule } from './database/supabase/supabase.module';

@Module({
  imports: [
    DatabaseModule,
    FileModule,
    LLMModule,
    ProjectModule,
    RAGModule,
    SocketModule,
    SupabaseModule,
    UtilsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
