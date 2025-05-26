// Imports
import { FileService } from './file.service';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('file')
export class FileController {
  constructor(private readonly service: FileService) {}

  @Post('createNextJs')
  async funCreateNextJs(@Body() body) {
    return await this.service.createNextJs(body);
  }
}
