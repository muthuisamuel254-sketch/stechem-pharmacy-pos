/**
 * Multi-device shared store.
 * Configure on Vercel:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 * Free tier: https://upstash.com
 */

export type PharmacySnapshot = {
  version: number;
  updatedAt: string;
  medicines: unknown[];
  batches: unknown[];
  sales: unknown[];
  users: unknown[];
  settings: unknown;
  auditLogs: unknown[];
  notifications: unknown[];
  reorderRequests: unknown[];
};

const KEY = "stechem:pharmacy:v1";

function configured() {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

export function isCloudConfigured() {
  return configured();
}

async function upstash(command: (string | number)[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(`${url}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Upstash error ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.result;
}

export async function loadSnapshot(): Promise<PharmacySnapshot | null> {
  if (!configured()) return null;
  const raw = await upstash(["GET", KEY]);
  if (!raw) return null;
  if (typeof raw === "string") return JSON.parse(raw) as PharmacySnapshot;
  return raw as PharmacySnapshot;
}

export async function saveSnapshot(snapshot: PharmacySnapshot): Promise<void> {
  if (!configured()) {
    throw new Error("Cloud store not configured (UPSTASH_REDIS_REST_URL / TOKEN)");
  }
  await upstash(["SET", KEY, JSON.stringify(snapshot)]);
}
