import type { Order } from "./types";
import { plainZAR } from "./money";
import { formatDeliveryDate } from "./delivery";
import { formatPhone } from "./validation";

export function buildOrderMessage(o: Omit<Order, "whatsappMessage">, storeName: string): string {
  const c = o.customer;
  const a = o.address;
  const lines: string[] = [];
  lines.push(`*New order — ${storeName}*`);
  lines.push(`Ref: *${o.reference}*`);
  lines.push("");
  lines.push(`*Name:* ${c.firstName} ${c.surname}`);
  lines.push(`*Contact:* ${formatPhone(c.phone)}`);
  if (c.email) lines.push(`*Email:* ${c.email}`);
  lines.push("");
  lines.push(`*Delivery:* ${formatDeliveryDate(o.deliveryDate)}`);
  lines.push(`*Address:*`);
  lines.push(a.street);
  if (a.building) lines.push(a.building);
  lines.push(`${a.suburb}, Cape Town`);
  if (a.instructions) lines.push(`_Note: ${a.instructions}_`);
  lines.push("");
  lines.push(`*Items*`);
  for (const l of o.lines) {
    const name = l.variantName ? `${l.name} (${l.variantName})` : l.name;
    lines.push(`• ${l.quantity} × ${name} @ ${plainZAR(l.unitPriceCents)} = ${plainZAR(l.lineTotalCents)}`);
  }
  lines.push("");
  lines.push(`Subtotal: ${plainZAR(o.subtotalCents)}`);
  lines.push(`Delivery: ${o.deliveryFeeCents === 0 ? "Free" : plainZAR(o.deliveryFeeCents)}`);
  lines.push(`*Total: ${plainZAR(o.totalCents)}*`);
  lines.push("");
  lines.push(`Please confirm my order. Thank you.`);
  return lines.join("\n");
}

export function whatsappLink(number: string, message: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 9) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function whatsappChatLink(number: string, text = ""): string | null {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 9) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
