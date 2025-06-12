// Imports
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/socket',
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SocketGateway');

  // Map sessionId -> socketId
  private sessionMap: Map<string, string> = new Map();

  afterInit(server: Server) {
    this.logger.log('Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove any session ID mapped to this client
    for (const [sessionId, socketId] of this.sessionMap.entries()) {
      if (socketId === client.id) {
        this.sessionMap.delete(sessionId);
        break;
      }
    }
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { sender: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`[${data.sender}]: ${data.message}`);
    this.server.emit('message', {
      sender: data.sender,
      message: data.message,
    });
  }

  @SubscribeMessage('register-session')
  handleSessionRegister(
    @MessageBody() data: { session_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.session_id) {
      this.sessionMap.set(data.session_id, client.id);
      this.logger.log(
        `Registered session ${data.session_id} to socket ${client.id}`,
      );
    }
  }

  // Emit to all clients
  emitToAll(event: string, payload: any) {
    this.server.emit(event, payload);
  }

  emitToClient(clientId: string, event: string, payload: any) {
    try {
      // Type assertion to help TS understand it's a Map
      const socketsMap = this.server.sockets as unknown as Map<string, Socket>;
      const client = socketsMap.get(clientId);
      if (client) {
        client.emit(event, payload);
      } else {
        this.logger.warn(`Client not found: ${clientId}`);
      }
    } catch (error) {
      this.logger.error(`emitToClient failed: ${error}`);
    }
  }

  // Emit to a client by session ID
  emitToSession(sessionId: string, event: string, payload: any) {
    const socketId = this.sessionMap.get(sessionId);
    if (socketId) {
      this.emitToClient(socketId, event, payload);
    } else {
      this.logger.warn(`No socket found for session: ${sessionId}`);
    }
  }
}
