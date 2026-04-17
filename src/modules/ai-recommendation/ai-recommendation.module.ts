import { Module } from '@nestjs/common';
import { AiRecommendationService } from './ai-recommendation.service';

@Module({
  providers: [AiRecommendationService],
  exports: [AiRecommendationService],
})
export class AiRecommendationModule {}
