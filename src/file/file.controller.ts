// Imports
import { FileService } from './file.service';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';

@Controller('file')
export class FileController {
  constructor(private readonly service: FileService) {}

  @Post('createNextJs')
  async funCreateNextJs(@Body() body) {
    return await this.service.createNextJs(body);
  }

  @Get('dictJson')
  async funDictJson(@Query() query) {
    return await this.service.dictJson(query);
  }
}
