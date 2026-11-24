import type { components } from './schema';

type Schemas = components['schemas'];

export type Member = Schemas['MemberDto'];
export type Plan = Schemas['PlanDto'];
export type Tokens = Schemas['TokensDto'];
export type AuthResponse = Schemas['AuthResponseDto'];
export type RegisterInput = Schemas['RegisterDto'];
export type UpdateProfileInput = Schemas['UpdateProfileDto'];
export type MembershipCard = Schemas['MembershipCardDto'];
export type VerificationCode = Schemas['VerificationCodeDto'];
export type Category = Schemas['CategoryDto'];
export type PartnerSummary = Schemas['PartnerSummaryDto'];
export type PartnerList = Schemas['PartnerListDto'];
export type PartnerDetail = Schemas['PartnerDetailDto'];
export type Offer = Schemas['OfferDto'];
export type Voucher = Schemas['VoucherDto'];
export type ClaimedVoucher = Schemas['ClaimedVoucherDto'];
export type VoucherList = Schemas['VoucherListDto'];
export type ErrorCode = Schemas['ErrorDetail']['code'];
export type MembershipStatus = Member['membershipStatus'];
export type VoucherStatus = Voucher['status'];
