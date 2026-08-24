/**
 * Stechem Pharmacy — multi-device backend via Upstash Redis (REST).
 *
 * Required on Vercel (Environment Variables):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Free tier: https://console.upstash.com → Create Database → REST API
 *
 * Without these vars the app runs in local-only mode (per browser / device).
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

function configured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

export function isCloudConfigured(): boolean {
  return configured();
}

async function upstash(command: (string | number)[]): Promise<unknown> {
  const base = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Upstash error ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { result?: unknown };
  return data.result;
}

/** Load the shared pharmacy snapshot (null if empty or not configured). */
export async function loadSnapshot(): Promise<PharmacySnapshot | null> {
  if (!configured()) return null;
  const raw = await upstash(["GET", KEY]);
  if (raw == null || raw === "") return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as PharmacySnapshot;
    } catch {
      throw new Error("Invalid snapshot JSON in Upstash");
    }
  }
  return raw as PharmacySnapshot;
}

/** Save the shared pharmacy snapshot (overwrites previous). */
export async function saveSnapshot(snapshot: PharmacySnapshot): Promise<void> {
  if (!configured()) {
    throw new Error("Cloud store not configured (UPSTASH_REDIS_REST_URL / TOKEN)");
  }
  const payload: PharmacySnapshot = {
    ...snapshot,
    version: Number(snapshot.version) || 1,
    updatedAt: snapshot.updatedAt || new Date().toISOString(),
  };
  await upstash(["SET", KEY, JSON.stringify(payload)]);
}

/** Lightweight check that Redis is reachable. */
export async function pingCloud(): Promise<{ ok: boolean; message: string }> {
  if (!configured()) {
    return {
      ok: false,
      message: "UPSTASH_REDIS_REST_URL / TOKEN not set",
    };
  }
  try {
    const pong = await upstash(["PING"]);
    return {
      ok: pong === "PONG" || pong === "pong",
      message: pong === "PONG" || pong === "pong" ? "Upstash connected" : String(pong),
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Ping failed",
    };
  }
}
