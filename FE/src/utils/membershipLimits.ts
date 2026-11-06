export const MEMBERSHIP_LIMITS = {
  FREE: { ai: 15, publish: 5, price: 0 },
  PREMIUM: { ai: 50, publish: 15, price: 18000 },
  PRO: { ai: 100, publish: 20, price: 36000 },
} as const
export type MembershipTier = keyof typeof MEMBERSHIP_LIMITS
export function getUsagePercent(used: number, limit: number) {
  return Math.min(100, Math.max(0, (used / limit) * 100))
}
