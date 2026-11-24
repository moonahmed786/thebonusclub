import React from 'react';
import { Button } from '../../shared/components/Button';

interface ClaimButtonProps {
  onClaim: () => void;
  claiming: boolean;
  membershipActive: boolean;
}

/** Disabled while a claim is in flight (double taps cannot send twice) and for inactive members. */
export function ClaimButton({ onClaim, claiming, membershipActive }: ClaimButtonProps) {
  return (
    <Button
      testID="claim-button"
      title={membershipActive ? 'Claim Voucher Code' : 'Membership not active'}
      onPress={onClaim}
      loading={claiming}
      disabled={!membershipActive}
      accessibilityHint="Creates a single-use voucher code for this offer"
    />
  );
}
