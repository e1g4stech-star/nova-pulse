// =========================================================
// PLAN DEFINITIONS — Nova Pulse Billing
// =========================================================

export type PlanId = "free" | "pro" | "business";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  price: number;        // IDR per bulan
  priceYearly: number;  // IDR per tahun
  color: string;        // Tailwind gradient
  badge?: string;
  highlight?: boolean;
  features: string[];
  limits: {
    posts: number;           // -1 = unlimited
    affiliates: number;
    aiChatsPerMonth: number;
    teamMembers: number;
    mediaStorage: number;    // MB, -1 = unlimited
    calendarEvents: number;
    notes: number;
  };
  integrations: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    description: "Cocok untuk coba-coba & content creator pemula",
    price: 0,
    priceYearly: 0,
    color: "from-slate-500 to-slate-700",
    features: [
      "30 posts per bulan",
      "5 affiliate links",
      "50 AI chats per bulan",
      "1 kalender & 30 events",
      "20 notes",
      "Basic AI content",
      "Browser notification",
    ],
    limits: {
      posts: 30,
      affiliates: 5,
      aiChatsPerMonth: 50,
      teamMembers: 1,
      mediaStorage: 100,
      calendarEvents: 30,
      notes: 20,
    },
    integrations: ["Browser notification"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Untuk content creator serius & UMKM",
    price: 99000,
    priceYearly: 990000,
    color: "from-cyan-400 to-purple-500",
    badge: "POPULER",
    highlight: true,
    features: [
      "Unlimited posts",
      "50 affiliate links",
      "Unlimited AI chats",
      "Unlimited calendar & events",
      "Unlimited notes",
      "AI Content Calendar 30-hari",
      "Export JSON + CSV",
      "Email reminder harian",
      "Priority email support",
    ],
    limits: {
      posts: -1,
      affiliates: 50,
      aiChatsPerMonth: -1,
      teamMembers: 1,
      mediaStorage: 2000,
      calendarEvents: -1,
      notes: -1,
    },
    integrations: [
      "Browser notification",
      "Email reminder",
      "Daily summary",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    description: "Untuk agency & content team",
    price: 299000,
    priceYearly: 2990000,
    color: "from-yellow-400 to-red-500",
    badge: "POWER USER",
    features: [
      "Semua fitur Pro",
      "3 team members",
      "White-label option",
      "Custom domain",
      "API access",
      "Advanced analytics",
      "Bulk import/export",
      "Priority support (chat)",
      "Dedicated onboarding",
    ],
    limits: {
      posts: -1,
      affiliates: -1,
      aiChatsPerMonth: -1,
      teamMembers: 3,
      mediaStorage: 10000,
      calendarEvents: -1,
      notes: -1,
    },
    integrations: [
      "Browser notification",
      "Email reminder",
      "Daily summary",
      "Team collaboration",
      "API access",
    ],
  },
};

export const PLAN_LIST: Plan[] = [PLANS.free, PLANS.pro, PLANS.business];

export function getPlan(id: string | undefined): Plan {
  if (id && id in PLANS) return PLANS[id as PlanId];
  return PLANS.free;
}

export function isLimitExceeded(
  currentCount: number,
  limit: number
): boolean {
  if (limit === -1) return false; // unlimited
  return currentCount >= limit;
}

export function formatPrice(price: number): string {
  if (price === 0) return "Gratis";
  return "Rp " + price.toLocaleString("id-ID");
}