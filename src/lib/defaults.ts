import type { DeliverySettings } from "./types";

// Used only before the catalogue has loaded once (e.g. first visit offline).
export const DEFAULT_DELIVERY: DeliverySettings = {
  feeCents: 0,
  freeOverCents: null,
  cutoffHours: 36,
  horizonWeeks: 8,
  blockedDates: [],
  regions: [],
  city: "Cape Town",
  province: "Western Cape",
};
