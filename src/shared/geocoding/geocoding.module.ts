import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { GeocodingStartupService } from './geocoding-startup.service';

@Module({
  providers: [GeocodingService, GeocodingStartupService],
  exports: [GeocodingService],
})
export class GeocodingModule {}
