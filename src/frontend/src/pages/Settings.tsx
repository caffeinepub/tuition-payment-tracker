import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  Upload,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type Status = { type: "success" | "error"; message: string } | null;

export default function Settings() {
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleBackup() {
    try {
      const backup: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const raw = localStorage.getItem(key);
            backup[key] = raw ? JSON.parse(raw) : null;
          } catch {
            backup[key] = localStorage.getItem(key);
          }
        }
      }

      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10);
      const filename = `eduledger-backup-${dateStr}.json`;
      const blob = new Blob(
        [
          JSON.stringify(
            {
              _eduledger: true,
              version: 1,
              exportedAt: today.toISOString(),
              data: backup,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setStatus({
        type: "success",
        message: "Backup created successfully. Please store this file safely.",
      });
      toast.success("Backup created successfully!");
    } catch {
      setStatus({ type: "error", message: "Backup failed. Please try again." });
      toast.error("Backup failed. Please try again.");
    }
  }

  function handleRestoreClick() {
    setStatus(null);
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setRestoreDialogOpen(true);
    // Reset the input so the same file can be selected again if needed
    e.target.value = "";
  }

  async function handleRestoreConfirm() {
    if (!pendingFile) return;
    setRestoreDialogOpen(false);

    try {
      const text = await pendingFile.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        setStatus({
          type: "error",
          message: "Invalid file. The selected file is not valid JSON.",
        });
        toast.error("Invalid file: not valid JSON.");
        setPendingFile(null);
        return;
      }

      if (
        !parsed._eduledger ||
        !parsed.data ||
        typeof parsed.data !== "object"
      ) {
        setStatus({
          type: "error",
          message:
            "Incorrect file structure. Please select a valid EduLedger backup file.",
        });
        toast.error("Not a valid EduLedger backup file.");
        setPendingFile(null);
        return;
      }

      // Write all keys back to localStorage
      localStorage.clear();
      for (const [key, value] of Object.entries(parsed.data)) {
        localStorage.setItem(
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        );
      }

      toast.success("Data restored successfully. Reloading...");
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setStatus({
        type: "error",
        message: "Restore failed. Please try again.",
      });
      toast.error("Restore failed. Please try again.");
    }

    setPendingFile(null);
  }

  function handleRestoreCancel() {
    setRestoreDialogOpen(false);
    setPendingFile(null);
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
        {/* Status message */}
        {status && (
          <div
            data-ocid={
              status.type === "success"
                ? "settings.success_state"
                : "settings.error_state"
            }
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              status.type === "success"
                ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
            )}
            <p className="text-sm font-medium">{status.message}</p>
          </div>
        )}

        {/* Backup & Restore Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Backup &amp; Restore</CardTitle>
            <CardDescription className="text-sm">
              Save and recover your EduLedger data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Backup Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Backup Data
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Export all your data (students, payments, attendance) to a JSON
                file.
              </p>
              <Button
                data-ocid="settings.backup_button"
                onClick={handleBackup}
                className="w-full"
                variant="default"
              >
                <Download className="w-4 h-4 mr-2" />
                Backup Data
              </Button>
              <div className="flex items-start gap-2 bg-muted/50 rounded-md p-2.5">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Your data is stored locally on your device. We recommend
                  taking regular backups.
                </p>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Restore Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Restore Data
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Import a previously created backup file to restore your data.
              </p>
              <Button
                data-ocid="settings.restore_button"
                onClick={handleRestoreClick}
                className="w-full"
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                Restore Data
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileSelected}
              />
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-2.5 dark:bg-amber-950 dark:border-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Restoring will overwrite your current data. This action cannot
                  be undone.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/30">
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Important Notes
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Backup is manual — remember to back up regularly.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Data is stored only in this browser on this device.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Clearing browser data will remove all app data.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Keep your backup files safely to prevent data loss.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent data-ocid="settings.dialog" className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Restore
            </DialogTitle>
            <DialogDescription>
              Restoring will overwrite your current data. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {pendingFile && (
            <div className="bg-muted rounded-md px-3 py-2">
              <p className="text-xs text-muted-foreground">
                File:{" "}
                <span className="font-medium text-foreground">
                  {pendingFile.name}
                </span>
              </p>
            </div>
          )}
          <DialogFooter className="flex-row gap-2">
            <Button
              data-ocid="settings.restore_cancel_button"
              variant="outline"
              className="flex-1"
              onClick={handleRestoreCancel}
            >
              Cancel
            </Button>
            <Button
              data-ocid="settings.restore_confirm_button"
              variant="destructive"
              className="flex-1"
              onClick={handleRestoreConfirm}
            >
              Yes, Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
