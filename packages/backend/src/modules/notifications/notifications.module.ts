import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { WebSocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [forwardRef(() => WebSocketsModule)],
  providers: [NotificationsService, NotificationsResolver],
  exports: [NotificationsService],
})
export class NotificationsModule {}
