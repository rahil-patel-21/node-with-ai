// Imports
import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.service';

@Module({ exports: [SocketGateway], providers: [SocketGateway] })
export class SocketModule {}
