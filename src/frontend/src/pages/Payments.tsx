import type { Screen } from "@/App";
import ConfirmDialog from "@/components/ConfirmDialog";
import PaymentForm from "@/components/PaymentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCurrency,
  formatMonthLabel,
  useAppStore,
} from "@/store/useAppStore";
import {
  CalendarDays,
  CreditCard,
  List,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import PaymentCalendar from "./PaymentCalendar";

interface Props {
  navigate: (s: Screen) => void;
}

export default function Payments({ navigate: _navigate }: Props) {
  const tuitions = useAppStore((s) => s.tuitions);
  const dues = useAppStore((s) => s.dues);
  const payments = useAppStore((s) => s.payments);
  const deletePayment = useAppStore((s) => s.deletePayment);

  const [view, setView] = useState<"list" | "calendar">("list");
  const [showForm, setShowForm] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sortedPayments = [...payments].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  function getTuitionName(id: string) {
    return tuitions.find((t) => t.id === id)?.name ?? "Unknown";
  }

  function handleDelete() {
    if (!confirmDelete) return;
    deletePayment(confirmDelete);
    setConfirmDelete(null);
    toast.success("Payment deleted");
  }

  const editPayment = editPaymentId
    ? (payments.find((p) => p.id === editPaymentId) ?? null)
    : null;

  return (
    <div className="px-4 pt-6 pb-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display text-foreground">
          Payments
        </h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              type="button"
              data-ocid="payments.list.tab"
              onClick={() => setView("list")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                view === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              type="button"
              data-ocid="payments.calendar.tab"
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                view === "calendar"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>

          <Button
            size="sm"
            data-ocid="payments.add.primary_button"
            onClick={() => {
              setEditPaymentId(null);
              setShowForm(true);
            }}
            className="gap-1.5"
            disabled={tuitions.length === 0}
          >
            <Plus className="w-4 h-4" />
            Record
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <PaymentCalendar />
      ) : sortedPayments.length === 0 ? (
        <Card data-ocid="payments.empty_state" className="shadow-card">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No payments yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {tuitions.length === 0
                ? "Add a tuition first, then record payments"
                : "Record your first payment"}
            </p>
            {tuitions.length > 0 && (
              <Button
                size="sm"
                className="mt-4"
                data-ocid="payments.empty.primary_button"
                onClick={() => setShowForm(true)}
              >
                Record Payment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedPayments.map((p, idx) => {
            const allocatedDues = p.allocatedMonths
              .map((dId) => dues.find((d) => d.id === dId))
              .filter(Boolean);
            return (
              <Card
                key={p.id}
                data-ocid={`payments.payment.item.${idx + 1}`}
                className="shadow-card"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {formatCurrency(p.amount)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getTuitionName(p.tuitionId)}
                      </p>
                      {allocatedDues.length > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Covers:{" "}
                          {allocatedDues
                            .map((d) => d && formatMonthLabel(d.year, d.month))
                            .join(", ")}
                        </p>
                      )}
                      {p.note && (
                        <p className="text-[11px] text-muted-foreground italic mt-0.5">
                          {p.note}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        data-ocid={`payments.payment.edit_button.${idx + 1}`}
                        onClick={() => {
                          setEditPaymentId(p.id);
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        data-ocid={`payments.payment.delete_button.${idx + 1}`}
                        onClick={() => setConfirmDelete(p.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PaymentForm
        open={showForm}
        tuitionId={editPayment?.tuitionId ?? null}
        payment={editPayment}
        onClose={() => {
          setShowForm(false);
          setEditPaymentId(null);
        }}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Payment"
        description="This payment will be permanently removed and dues will be recalculated."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
