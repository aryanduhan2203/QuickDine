import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Clock3,
  LayoutDashboard,
  MessageSquareText,
  NotebookPen,
  PackageCheck,
  Settings2,
  Store,
} from "lucide-react";

export type StoreOwnerRoute =
  | "/store-owner/manage-store"
  | "/store-owner/update-menu"
  | "/store-owner/track-orders"
  | "/store-owner/respond-to-reviews"
  | "/store-owner/daily-dashboard"
  | "/store-owner/performance-insights"
  | "/store-owner/availability-controls"
  | "/store-owner/store-settings";

export type StoreOwnerNavItem = {
  href: StoreOwnerRoute;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const storeOwnerNavItems: StoreOwnerNavItem[] = [
  {
    href: "/store-owner/manage-store",
    title: "Manage your store",
    description:
      "Control business details, opening hours, contact info, delivery zones, and profile visibility.",
    icon: Store,
  },
  {
    href: "/store-owner/update-menu",
    title: "Update menu",
    description:
      "Refresh dishes, prices, combos, availability, and featured items without waiting on support.",
    icon: NotebookPen,
  },
  {
    href: "/store-owner/track-orders",
    title: "Track orders",
    description:
      "Follow incoming orders, prep timing, and fulfillment status from one operational view.",
    icon: PackageCheck,
  },
  {
    href: "/store-owner/respond-to-reviews",
    title: "Respond to reviews",
    description:
      "See customer feedback, handle service issues, and protect your public reputation.",
    icon: MessageSquareText,
  },
  {
    href: "/store-owner/daily-dashboard",
    title: "Daily dashboard",
    description: "Watch order flow, peak hours, and store activity at a glance.",
    icon: LayoutDashboard,
  },
  {
    href: "/store-owner/performance-insights",
    title: "Performance insights",
    description: "Track visibility, engagement, and what drives more discovery.",
    icon: BarChart3,
  },
  {
    href: "/store-owner/availability-controls",
    title: "Availability controls",
    description: "Pause items, edit hours, and handle rush-time changes quickly.",
    icon: Clock3,
  },
  {
    href: "/store-owner/store-settings",
    title: "Store settings",
    description: "Keep operations tidy with role-based controls and business preferences.",
    icon: Settings2,
  },
];

export const storeOwnerHomeCards = storeOwnerNavItems.slice(0, 4);
export const storeOwnerOpsCards = storeOwnerNavItems.slice(4);
