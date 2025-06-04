// Imports
import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';

@Module({
  controllers: [FileController],
  exports: [FileService],
  providers: [FileService],
})
export class FileModule {}
