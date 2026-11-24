// Shared domain types. All money is stored as integer cents (ZAR).

export interface ProductVariant {
  id: string;
  name: string; // e.g. "1 kg", "2 kg"
  priceCents: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  priceCents: number; // base price (used when no variants)
  stock: number; // base stock (used when no variants)
  sku: string;
  images: string[];
  available: boolean; // admin switch: false = "Unavailable" regardless of stock
  featured: boolean;
  popular: boolean;
  variants: ProductVariant[];
  isPlaceholder?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}

export interface DeliverySettings {
  feeCents: number;
  freeOverCents: number | null; // null = never free
  /** Orders for a Monday close this many hours before Monday 00:00 SAST. */
  cutoffHours: number;
  /** How many weeks ahead customers can book. */
  horizonWeeks: number;
  /** ISO dates (YYYY-MM-DD) of Mondays that are blocked. */
  blockedDates: string[];
  /** Suburbs we deliver to (Cape Town only). */
  regions: string[];
  city: string;
  province: string;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string; // international format digits, e.g. 27XXXXXXXXX; empty until configured
  contactEmail: string;
  contactPhone: string;
  announcement: string;
  announcementActive: boolean;
  heroImage: string;
  delivery: DeliverySettings;
}

/** Settings safe to send to any browser. */
export type PublicSettings = StoreSettings;

export type OrderStatus =
  | "awaiting_whatsapp"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "awaiting_whatsapp", label: "Awaiting WhatsApp confirmation" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready for delivery" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function statusLabel(s: OrderStatus): string {
  return ORDER_STATUSES.find((x) => x.value === s)?.label ?? s;
}

export interface CustomerDetails {
  firstName: string;
  surname: string;
  phone: string;
  email: string;
}

export interface DeliveryAddress {
  street: string;
  building: string;
  suburb: string;
  instructions: string;
}

export interface OrderLine {
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface Order {
  id: string; // = checkoutId (idempotency key)
  reference: string;
  status: OrderStatus;
  customer: CustomerDetails;
  address: DeliveryAddress;
  deliveryDate: string; // YYYY-MM-DD (a Monday)
  lines: OrderLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  whatsappMessage: string;
  stockReleased: boolean;
  statusHistory: { status: OrderStatus; at: string }[];
  createdAt: string;
  updatedAt: string;
}

/** What the browser sends. Prices/totals are never trusted from here. */
export interface OrderRequest {
  checkoutId: string;
  customer: CustomerDetails;
  address: DeliveryAddress;
  deliveryDate: string;
  items: { productId: string; variantId: string | null; quantity: number }[];
}

export interface BasketItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  // Snapshot for display/offline only. Never used for final pricing.
  name: string;
  variantName: string | null;
  priceCents: number;
  image: string | null;
  slug: string;
}
