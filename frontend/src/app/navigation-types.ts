import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParams = {
  Login: undefined;
  Register: undefined;
};

export type PartnersStackParams = {
  Partners: undefined;
  Partner: { id: string; name: string };
  Offer: { id: string; partnerName: string; redemptionMethod: string };
};

export type VouchersStackParams = {
  Vouchers: undefined;
  Voucher: { id: string };
};

export type MainTabParams = {
  CardTab: undefined;
  PartnersTab: NavigatorScreenParams<PartnersStackParams>;
  VouchersTab: NavigatorScreenParams<VouchersStackParams>;
};
