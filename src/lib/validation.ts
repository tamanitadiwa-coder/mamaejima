import type { CustomerDetails, DeliveryAddress, DeliverySettings } from "./types";
import { isSupportedSuburb } from "./delivery";

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Normalise a South African mobile number to international digits (27XXXXXXXXX).
 * Accepts 082 123 4567, +27 82 123 4567, 27821234567. Returns null if invalid.
 */
export function normaliseSAPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "").replace(/^\+/, "");
  let n = digits;
  if (/^0\d{9}$/.test(n)) n = "27" + n.slice(1);
  if (!/^27[6-8]\d{8}$/.test(n)) return null;
  return n;
}

/** Numbers outside SA (e.g. a Zimbabwean +263 WhatsApp) — accepted as international. */
export function normaliseAnyPhone(input: string): string | null {
  const sa = normaliseSAPhone(input);
  if (sa) return sa;
  const digits = input.replace(/[^\d+]/g, "");
  if (/^\+\d{9,15}$/.test(digits)) return digits.slice(1);
  if (/^00\d{9,15}$/.test(digits)) return digits.slice(2);
  return null;
}

export function formatPhone(n: string): string {
  if (/^27\d{9}$/.test(n)) return `+27 ${n.slice(2, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
  return `+${n}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L}\p{M}' .-]{0,59}$/u;

export function validateCustomer(c: CustomerDetails): FieldErrors<CustomerDetails> {
  const e: FieldErrors<CustomerDetails> = {};
  if (!c.firstName.trim()) e.firstName = "Please enter your first name.";
  else if (!NAME_RE.test(c.firstName.trim())) e.firstName = "Please use letters only.";
  if (!c.surname.trim()) e.surname = "Please enter your surname.";
  else if (!NAME_RE.test(c.surname.trim())) e.surname = "Please use letters only.";
  if (!c.phone.trim()) e.phone = "We need a number to confirm your order on WhatsApp.";
  else if (!normaliseAnyPhone(c.phone))
    e.phone = "Enter a valid mobile number, e.g. 082 123 4567 or +263 77 123 4567.";
  if (c.email.trim() && !EMAIL_RE.test(c.email.trim())) e.email = "That email address doesn't look right.";
  return e;
}

export function validateAddress(a: DeliveryAddress, s: DeliverySettings): FieldErrors<DeliveryAddress> {
  const e: FieldErrors<DeliveryAddress> = {};
  const street = a.street.trim();
  if (!street) e.street = "Please enter your street address.";
  else if (street.length < 5 || !/\d/.test(street) || !/[a-z]/i.test(street))
    e.street = "Include your house or unit number and street name.";
  else if (street.length > 120) e.street = "Please shorten this to 120 characters.";
  if (a.building.length > 80) e.building = "Please shorten this to 80 characters.";
  if (!a.suburb.trim()) e.suburb = "Please choose your suburb.";
  else if (!isSupportedSuburb(a.suburb, s))
    e.suburb = `We don't deliver to ${a.suburb.trim()} yet. We currently deliver within ${s.city} only.`;
  if (a.instructions.length > 300) e.instructions = "Please keep instructions under 300 characters.";
  return e;
}

export function hasErrors(e: object): boolean {
  return Object.values(e).some(Boolean);
}

export function clean(s: unknown, max = 300): string {
  return typeof s === "string" ? s.trim().replace(/\s+/g, " ").slice(0, max) : "";
}
