import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

/**
 * WebSockets Module
 * Provides real-time event broadcasting via Socket.IO
 */
@Module({
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class WebSocketsModule {}
