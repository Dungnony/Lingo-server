import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthUser } from '../../common/types';
import { SubmitOnboardingDto } from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Public()
  @Get('placement')
  placement() {
    return this.onboarding.placementQuiz();
  }

  @ApiBearerAuth()
  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.onboarding.get(user.id);
  }

  @ApiBearerAuth()
  @Post()
  submit(@CurrentUser() user: AuthUser, @Body() dto: SubmitOnboardingDto) {
    return this.onboarding.submit(user.id, dto);
  }
}
