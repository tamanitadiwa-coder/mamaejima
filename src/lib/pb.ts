"use client";
import PocketBase from "pocketbase";

// One shared PocketBase client. Its auth store keeps customers signed in on
// this device until they sign out (or the device data is cleared).
export const PB_URL = (process.env.NEXT_PUBLIC_PB_URL || "").replace(/\/$/, "");

let client: PocketBase | null = null;

export function pb(): PocketBase {
  if (!client) {
    client = new PocketBase(PB_URL || "http://127.0.0.1:8090");
    client.autoCancellation(false);
  }
  return client;
}

export const backendConfigured = () => !!PB_URL;
