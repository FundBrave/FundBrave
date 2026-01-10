import { Module, Global } from '@nestjs/common';
import { ActivityService } from './activity.service';

/**
 * Activity Module
 * Global module that provides ActivityService throughout the application
 * for logging user actions and generating activity feeds
 */
@Global()
@Module({
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
