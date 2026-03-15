import type { Screen } from "@/App";
import ConfirmDialog from "@/components/ConfirmDialog";
import MonthlyReportModal from "@/components/MonthlyReportModal";
import PaymentForm from "@/components/PaymentForm";
import TuitionForm from "@/components/TuitionForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  compareYearMonth,
  formatCurrency,
  formatMonthLabel,
  getDuePendingAmount,
  todayYearMonth,
  useAppStore,
} from "@/store/useAppStore";
import {
  ArrowLeft,
  Copy,
  FileDown,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
  tuitionId: string;
  navigate: (s: Screen) => void;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export default function TuitionDetail({ tuitionId, navigate }: Props) {
  const tuitions = useAppStore((s) => s.tuitions);
  const dues = useAppStore((s) => s.dues);
  const payments = useAppStore((s) => s.payments);
  const deleteTuition = useAppStore((s) => s.deleteTuition);
  const deletePayment = useAppStore((s) => s.deletePayment);

  const [showEditForm, setShowEditForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState<
    string | null
  >(null);
  const [showReport, setShowReport] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const tuition = tuitions.find((t) => t.id === tuitionId);
  const today = todayYearMonth();

  const tuitionDues = useMemo(
    () =>
      dues
        .filter((d) => d.tuitionId === tuitionId)
        .sort((a, b) => compareYearMonth(b, a)),
    [dues, tuitionId],
  );

  const tuitionPayments = useMemo(
    () =>
      payments
        .filter((p) => p.tuitionId === tuitionId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [payments, tuitionId],
  );

  if (!tuition) {
    return (
      <div className="px-4 pt-6">
        <Button variant="ghost" onClick={() => navigate({ tab: "students" })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <p className="mt-4 text-muted-foreground">Tuition not found.</p>
      </div>
    );
  }

  const pending = getDuePendingAmount(tuitionId, dues);

  const overdueDues = tuitionDues.filter(
    (d) => !d.isPaid && compareYearMonth(d, today) < 0,
  );

  const currentMonthName = new Date().toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const overdueMonthsText =
    overdueDues.length > 0
      ? overdueDues
          .slice()
          .reverse()
          .map((d) => formatMonthLabel(d.year, d.month))
          .join(", ")
      : currentMonthName;

  const whatsappMessage = `Hello, this is a reminder from EduLedger.

Student: ${tuition.students.join(", ")}
Pending Fees: ₹${pending}
Month: ${overdueMonthsText}

Please pay the fees at your convenience.
Thank you.`;

  function handleOpenWhatsApp() {
    const encodedMsg = encodeURIComponent(whatsappMessage);
    const url = tuition?.phone
      ? `https://wa.me/${formatPhone(tuition.phone)}?text=${encodedMsg}`
      : `https://wa.me/?text=${encodedMsg}`;
    window.open(url, "_blank");
  }

  function handleCopyMessage() {
    navigator.clipboard.writeText(whatsappMessage);
    toast.success("Message copied!");
  }

  function getDueStatus(d: (typeof tuitionDues)[0]) {
    if (d.isPaid) return "paid";
    if (compareYearMonth(d, today) < 0) return "overdue";
    if (compareYearMonth(d, today) === 0) return "current";
    return "upcoming";
  }

  function handleDeleteTuition() {
    deleteTuition(tuitionId);
    toast.success("Tuition deleted");
    navigate({ tab: "students" });
  }

  function handleDeletePayment() {
    if (!confirmDeletePayment) return;
    deletePayment(confirmDeletePayment);
    setConfirmDeletePayment(null);
    toast.success("Payment deleted");
  }

  const editPayment = editPaymentId
    ? (payments.find((p) => p.id === editPaymentId) ?? null)
    : null;

  return (
    <div className="px-4 pt-4 pb-4 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          data-ocid="detail.back.button"
          onClick={() => navigate({ tab: "students" })}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold font-display text-foreground truncate">
            {tuition.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {tuition.students.join(", ")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          data-ocid="detail.whatsapp.button"
          className="text-green-600 hover:text-green-700"
          onClick={() => setShowWhatsApp(true)}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          data-ocid="detail.export.button"
          onClick={() => setShowReport(true)}
        >
          <FileDown className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          data-ocid="detail.edit.button"
          onClick={() => setShowEditForm(true)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          data-ocid="detail.delete.button"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="shadow-card bg-primary text-primary-foreground">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold">
                {formatCurrency(tuition.monthlyFee)}
              </p>
              <p className="text-[11px] opacity-80">Monthly Fee</p>
            </div>
            <div>
              <p
                className={`text-xl font-bold ${
                  pending > 0 ? "text-warning" : ""
                }`}
              >
                {formatCurrency(pending)}
              </p>
              <p className="text-[11px] opacity-80">Pending</p>
            </div>
            <div>
              <p className="text-xl font-bold">{tuitionPayments.length}</p>
              <p className="text-[11px] opacity-80">Payments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Dues */}
      <Card className="shadow-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Monthly Dues
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {tuitionDues.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No dues generated yet
            </p>
          ) : (
            tuitionDues.map((d, idx) => {
              const status = getDueStatus(d);
              return (
                <div
                  key={d.id}
                  data-ocid={`detail.due.item.${idx + 1}`}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">
                      {formatMonthLabel(d.year, d.month)}
                    </span>
                    {status === "paid" && (
                      <Badge className="bg-success/15 text-success border-success/30 text-[10px] px-1.5">
                        Paid
                      </Badge>
                    )}
                    {status === "overdue" && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] px-1.5"
                      >
                        Overdue
                      </Badge>
                    )}
                    {status === "current" && (
                      <Badge className="bg-warning/20 text-warning-foreground border-warning/30 text-[10px] px-1.5">
                        Due
                      </Badge>
                    )}
                    {status === "upcoming" && (
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        Upcoming
                      </Badge>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      status === "paid"
                        ? "text-success"
                        : status === "overdue"
                          ? "text-destructive"
                          : "text-foreground"
                    }`}
                  >
                    {formatCurrency(d.amount)}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card className="shadow-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Payments</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              data-ocid="detail.add_payment.button"
              onClick={() => {
                setEditPaymentId(null);
                setShowPaymentForm(true);
              }}
            >
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {tuitionPayments.length === 0 ? (
            <p
              data-ocid="detail.payments.empty_state"
              className="text-xs text-muted-foreground text-center py-4"
            >
              No payments recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {tuitionPayments.map((p, idx) => {
                const allocatedDues = p.allocatedMonths
                  .map((dId) => dues.find((d) => d.id === dId))
                  .filter(Boolean);
                return (
                  <div
                    key={p.id}
                    data-ocid={`detail.payment.item.${idx + 1}`}
                    className="flex items-start justify-between py-1.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
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
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        data-ocid={`detail.payment.edit_button.${idx + 1}`}
                        onClick={() => {
                          setEditPaymentId(p.id);
                          setShowPaymentForm(true);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        data-ocid={`detail.payment.delete_button.${idx + 1}`}
                        onClick={() => setConfirmDeletePayment(p.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TuitionForm
        open={showEditForm}
        tuition={tuition}
        onClose={() => setShowEditForm(false)}
      />
      <PaymentForm
        open={showPaymentForm}
        tuitionId={tuitionId}
        payment={editPayment}
        onClose={() => {
          setShowPaymentForm(false);
          setEditPaymentId(null);
        }}
      />
      <MonthlyReportModal
        tuitionId={tuitionId}
        open={showReport}
        onClose={() => setShowReport(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Tuition"
        description="This will permanently delete the tuition, all dues, payments, and attendance."
        onConfirm={handleDeleteTuition}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={!!confirmDeletePayment}
        title="Delete Payment"
        description="This payment will be permanently removed and dues will be recalculated."
        onConfirm={handleDeletePayment}
        onCancel={() => setConfirmDeletePayment(null)}
      />

      {/* WhatsApp Reminder Dialog */}
      <Dialog open={showWhatsApp} onOpenChange={setShowWhatsApp}>
        <DialogContent data-ocid="whatsapp.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              WhatsApp Reminder
            </DialogTitle>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {whatsappMessage}
          </div>
          {!tuition.phone && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              No phone number saved. Add one via Edit to send directly.
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              data-ocid="whatsapp.open_modal_button"
              onClick={handleOpenWhatsApp}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Send WhatsApp Reminder
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              data-ocid="whatsapp.copy.button"
              onClick={handleCopyMessage}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
