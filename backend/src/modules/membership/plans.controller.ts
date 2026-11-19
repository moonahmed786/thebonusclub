import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlanDto } from '../members/dto/member.dto';
import { MembershipService } from './membership.service';

@ApiTags('Membership')
@Controller('plans')
export class PlansController {
  constructor(private readonly membership: MembershipService) {}

  @Get()
  @ApiOperation({ summary: 'List membership plans and prices (public).' })
  @ApiOkResponse({ type: [PlanDto] })
  list(): Promise<PlanDto[]> {
    return this.membership.listPlans();
  }
}
