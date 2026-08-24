import { NextRequest, NextResponse } from "next/server";
import {
  isCloudConfigured,
  loadSnapshot,
  saveSnapshot,
  pingCloud,
  type PharmacySnapshot,
} from "@/lib/cloud-store";

export const dynamic = "force-dynamic";

/** GET /api/sync — load shared pharmacy data for all devices */
export async function GET() {
  try {
    if (!isCloudConfigured()) {
      return NextResponse.json({
        ok: true,
        cloud: false,
        message:
          "Cloud sync not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN on Vercel for multi-device sharing.",
        data: null,
      });
    }
    const data = await loadSnapshot();
    return NextResponse.json({ ok: true, cloud: true, data });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, cloud: true, error: e instanceof Error ? e.message : "Load failed" },
      { status: 500 }
    );
  }
}

/** PUT /api/sync — save shared pharmacy data from any device */
export async function PUT(req: NextRequest) {
  try {
    if (!isCloudConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          cloud: false,
          error:
            "Cloud sync not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN on Vercel.",
        },
        { status: 503 }
      );
    }
    const body = (await req.json()) as PharmacySnapshot;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
    }
    const snapshot: PharmacySnapshot = {
      version: Number(body.version) || 1,
      updatedAt: new Date().toISOString(),
      medicines: Array.isArray(body.medicines) ? body.medicines : [],
      batches: Array.isArray(body.batches) ? body.batches : [],
      sales: Array.isArray(body.sales) ? body.sales : [],
      users: Array.isArray(body.users) ? body.users : [],
      settings: body.settings ?? {},
      auditLogs: Array.isArray(body.auditLogs) ? body.auditLogs : [],
      notifications: Array.isArray(body.notifications) ? body.notifications : [],
      reorderRequests: Array.isArray(body.reorderRequests) ? body.reorderRequests : [],
    };
    await saveSnapshot(snapshot);
    return NextResponse.json({ ok: true, cloud: true, updatedAt: snapshot.updatedAt });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Save failed" },
      { status: 500 }
    );
  }
}

/** POST /api/sync — health / status (uses Upstash PING when configured) */
export async function POST() {
  if (!isCloudConfigured()) {
    return NextResponse.json({
      ok: true,
      cloud: false,
      message:
        "Add UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN on Vercel to enable multi-device sync.",
    });
  }
  const ping = await pingCloud();
  return NextResponse.json({
    ok: ping.ok,
    cloud: true,
    message: ping.ok
      ? "Upstash connected — all devices share the same data."
      : ping.message,
  });
}
