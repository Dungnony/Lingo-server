import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantQuotaService } from './assistant-quota.service';
import { AssistantService } from './assistant.service';

@Module({
  controllers: [AssistantController],
  providers: [AssistantService, AssistantQuotaService],
})
export class AssistantModule {}
