import type { Prisma } from '../../generated/prisma/client';

/** Prisma filter for offers a member can see and claim right now. */
export function liveOfferWhere(now: Date = new Date()): Prisma.OfferWhereInput {
  return {
    isPaused: false,
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    partner: { isActive: true },
  };
}

export function isOfferLive(
  offer: { isPaused: boolean; startsAt: Date; endsAt: Date | null; partner: { isActive: boolean } },
  now: Date = new Date(),
): boolean {
  return (
    !offer.isPaused &&
    offer.partner.isActive &&
    offer.startsAt.getTime() <= now.getTime() &&
    (offer.endsAt === null || offer.endsAt.getTime() > now.getTime())
  );
}
