"use client";

import { useRef, useState } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { downloadJson } from "@/lib/utils";
import { Download, Upload, Database, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const {
    medicines,
    batches,
    sales,
    auditLogs,
    reorderRequests,
    settings,
    currentUser,
    importData,
  } = usePharmacy();

  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [importing, setImporting] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const canExport = currentUser?.role === "admin" || currentUser?.role === "manager";

  const handleExport = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      pharmacy: settings.name,
      medicines,
      batches,
      sales,
      auditLogs: isAdmin ? auditLogs : [],
      reorderRequests,
    };
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(`stechem-backup-${date}.json`, payload);
    setMessage({ type: "ok", text: "Data exported successfully. File downloaded." });
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setMessage(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.medicines || !Array.isArray(data.medicines)) {
        throw new Error("Invalid backup file: missing medicines");
      }
      if (!data.batches || !Array.isArray(data.batches)) {
        throw new Error("Invalid backup file: missing batches");
      }

      const result = importData({
        medicines: data.medicines,
        batches: data.batches,
        sales: data.sales || [],
        auditLogs: data.auditLogs || [],
        reorderRequests: data.reorderRequests || [],
      });

      if (result.ok) {
        setMessage({
          type: "ok",
          text: `Import successful: ${data.medicines.length} medicines, ${data.batches.length} batches, ${(data.sales || []).length} sales.`,
        });
      } else {
        setMessage({ type: "err", text: result.error || "Import failed" });
      }
    } catch (e) {
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : "Failed to read backup file",
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!canExport) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Only managers and admins can export or import data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings & Data</h1>
        <p className="text-muted-foreground">Export backup or restore pharmacy data</p>
      </div>

      {message && (
        <div
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {message.type === "ok" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-teal-600" />
            Current data
          </CardTitle>
          <CardDescription>Summary of what is stored in this browser</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-lg border border-[var(--border)] p-3">
              <p className="text-muted-foreground">Medicines</p>
              <p className="text-xl font-bold">{medicines.length}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3">
              <p className="text-muted-foreground">Batches</p>
              <p className="text-xl font-bold">{batches.length}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3">
              <p className="text-muted-foreground">Sales</p>
              <p className="text-xl font-bold">{sales.length}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3">
              <p className="text-muted-foreground">Reorders</p>
              <p className="text-xl font-bold">{reorderRequests.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-5 w-5 text-teal-600" />
            Export data
          </CardTitle>
          <CardDescription>
            Download a JSON backup of medicines, stock batches, and sales. Keep this file safe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export backup (.json)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-5 w-5 text-teal-600" />
            Import data
          </CardTitle>
          <CardDescription>
            Restore from a previous backup. This will replace current medicines, batches, and sales in this browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isAdmin && (
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Only Admin can import data.
            </p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
            }}
          />
          <Button
            variant="outline"
            disabled={!isAdmin || importing}
            onClick={() => fileRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {importing ? "Importing..." : "Choose backup file"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
