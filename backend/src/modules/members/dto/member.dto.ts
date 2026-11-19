import { ApiProperty } from '@nestjs/swagger';
import type { Plan, User } from '../../../generated/prisma/client';
import { membershipState, MembershipState } from '../../../shared/membership-status';

export class PlanDto {
  @ApiProperty({ example: 'ANNUAL' }) code!: string;
  @ApiProperty({ example: 'Annual membership' }) name!: string;
  @ApiProperty({ example: 9900, description: 'Price in cents' }) priceCents!: number;
  @ApiProperty({ example: 0, description: 'One-off registration fee in cents' }) registrationFeeCents!: number;
  @ApiProperty({ example: 12 }) durationMonths!: number;

  static from(plan: Plan): PlanDto {
    return {
      code: plan.code,
      name: plan.name,
      priceCents: plan.priceCents,
      registrationFeeCents: plan.registrationFeeCents,
      durationMonths: plan.durationMonths,
    };
  }
}

/** Full profile. Returned only to the owning member or an admin. */
export class MemberDto {
  @ApiProperty({ example: '2b1e6c1a-6a49-4d8f-9a55-0d6c7f0f3b21' }) id!: string;
  @ApiProperty({ example: 'BC-10293' }) memberId!: string;
  @ApiProperty({ example: 'jane@example.com' }) email!: string;
  @ApiProperty({ nullable: true, example: 'Jane', type: String }) firstName!: string | null;
  @ApiProperty({ nullable: true, example: 'Doe', type: String }) lastName!: string | null;
  @ApiProperty({ nullable: true, example: '+1 555 0100', type: String }) phone!: string | null;
  @ApiProperty({ nullable: true, example: '1 Main St, Springfield', type: String }) address!: string | null;
  @ApiProperty({ nullable: true, example: '1990-04-12', type: String, description: 'YYYY-MM-DD' }) birthday!: string | null;
  @ApiProperty({ enum: ['active', 'inactive', 'expired'] }) membershipStatus!: MembershipState;
  @ApiProperty({ nullable: true, type: PlanDto }) plan!: PlanDto | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) activatedAt!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) expiresAt!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;

  static from(user: User & { plan: Plan | null }): MemberDto {
    return {
      id: user.id,
      memberId: user.memberId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      birthday: user.birthday ? user.birthday.toISOString().slice(0, 10) : null,
      membershipStatus: membershipState(user),
      plan: user.plan ? PlanDto.from(user.plan) : null,
      activatedAt: user.activatedAt?.toISOString() ?? null,
      expiresAt: user.expiresAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
