import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { MembershipCardView } from '../src/features/membership/MembershipCardView';
import { ClaimButton } from '../src/features/vouchers/ClaimButton';
import { VoucherCodeView } from '../src/features/vouchers/VoucherCodeView';
import { toApiError } from '../src/shared/api/errors';
import { ErrorView } from '../src/shared/components/StateViews';

describe('MembershipCardView', () => {
  const base = { name: 'Jane Doe', memberId: 'BC-10293', expiresAt: '2027-03-10T08:00:00.000Z', planName: 'Annual membership' };

  it('shows an active card with label and member ID', async () => {
    await render(<MembershipCardView card={{ ...base, membershipStatus: 'active' }} />);
    expect(screen.getByText('BC-10293')).toBeTruthy();
    expect(screen.getByLabelText('Active')).toBeTruthy();
    expect(screen.queryByText(/waiting for activation/)).toBeNull();
  });

  it('shows an inactive card in a disabled state with an explanation', async () => {
    await render(<MembershipCardView card={{ ...base, expiresAt: null, membershipStatus: 'inactive' }} />);
    expect(screen.getByLabelText('Inactive')).toBeTruthy();
    expect(screen.getByText(/waiting for activation/)).toBeTruthy();
    expect(screen.getByText(/Not activated yet/)).toBeTruthy();
  });
});

describe('ClaimButton', () => {
  it('claims when tapped', async () => {
    const onClaim = jest.fn();
    await render(<ClaimButton onClaim={onClaim} claiming={false} membershipActive />);
    await fireEvent.press(screen.getByTestId('claim-button'));
    expect(onClaim).toHaveBeenCalledTimes(1);
  });

  it('is disabled while a claim is in flight', async () => {
    const onClaim = jest.fn();
    await render(<ClaimButton onClaim={onClaim} claiming membershipActive />);
    const button = screen.getByTestId('claim-button');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
    await fireEvent.press(button);
    expect(onClaim).not.toHaveBeenCalled();
  });

  it('is disabled for inactive members', async () => {
    const onClaim = jest.fn();
    await render(<ClaimButton onClaim={onClaim} claiming={false} membershipActive={false} />);
    expect(screen.getByText('Membership not active')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('claim-button'));
    expect(onClaim).not.toHaveBeenCalled();
  });
});

describe('VoucherCodeView', () => {
  it('lets a claimed code be copied', async () => {
    await render(<VoucherCodeView code="K7PX-3MQ9-T2WD" status="claimed" />);
    expect(screen.getByText('Copy code')).toBeTruthy();
  });

  it('does not offer copy for a redeemed or expired code', async () => {
    await render(<VoucherCodeView code="K7PX-3MQ9-T2WD" status="redeemed" />);
    expect(screen.queryByText('Copy code')).toBeNull();
    expect(screen.getByText('This code has been used.')).toBeTruthy();
  });
});

describe('ErrorView', () => {
  it('shows the mapped message, not the server text', async () => {
    const err = toApiError(422, { error: { code: 'VOUCHER_CLAIM_LIMIT_REACHED', message: 'internal detail' } });
    await render(<ErrorView error={err} />);
    expect(screen.getByTestId('error-message').props.children).toBe('You already have an unused voucher for this offer. Use it first.');
    expect(screen.queryByText(/internal detail/)).toBeNull();
  });
});
