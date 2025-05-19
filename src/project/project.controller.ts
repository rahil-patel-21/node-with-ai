// Imports
import { ProjectService } from './project.service';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('project')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Post('create')
  async funCreate(@Body() body) {
    return await this.service.create(body);
  }
}
