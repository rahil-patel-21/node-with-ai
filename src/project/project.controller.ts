// Imports
import { ProjectService } from './project.service';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';

@Controller('project')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Post('create')
  async funCreate(@Body() body) {
    return await this.service.create(body);
  }

  @Post('promptToFiles')
  async funPromptToFiles(@Body() body) {
    return await this.service.promptToFiles(body);
  }

  @Get('codeBase')
  async funCodeBase(@Query() query) {
    return await this.service.codeBase(query);
  }
}
