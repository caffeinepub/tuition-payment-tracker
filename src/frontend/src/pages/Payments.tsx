import AddPaymentDialog from "@/components/AddPaymentDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  type Payment,
  type PaymentMode,
  formatCurrency,
  useAppStore,
} from "@/store/useAppStore";
import { Link } from "@tanstack/react-router";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const modeColors: Record<string, string> = {
  Cash: "bg-success/15 text-success border-success/30 border",
  UPI: "bg-chart-1/15 text-chart-1 border-chart-1/30 border",
  Bank: "bg-accent-foreground/15 text-accent-foreground border-accent-foreground/30 border",
};

export default function Payments() {
  const { students, payments, editPayment, deletePayment } = useAppStore();
  const [filterStudentId, setFilterStudentId] = useState<string>("all");
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editMode, setEditMode] = useState<PaymentMode>("Cash");
  const [editNotes, setEditNotes] = useState("");

  // Delete confirm state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const filtered = payments
    .filter((p) => filterStudentId === "all" || p.studentId === filterStudentId)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

  const totalFiltered = filtered.reduce((sum, p) => sum + p.amountPaid, 0);

  const openEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setEditAmount(String(payment.amountPaid));
    setEditDate(payment.paymentDate);
    setEditMode(payment.paymentMode);
    setEditNotes(payment.notes);
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment || !editAmount || Number(editAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    editPayment(editingPayment.id, {
      studentId: editingPayment.studentId,
      paymentDate: editDate,
      amountPaid: Number(editAmount),
      paymentMode: editMode,
      notes: editNotes,
    });
    toast.success("Payment updated");
    setEditOpen(false);
    setEditingPayment(null);
  };

  const openDelete = (payment: Payment) => {
    setDeletingPayment(payment);
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deletingPayment) return;
    deletePayment(deletingPayment.id);
    toast.success("Payment deleted");
    setDeleteOpen(false);
    setDeletingPayment(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Payments
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
            {filterStudentId !== "all" &&
              ` · Total: ${formatCurrency(totalFiltered)}`}
          </p>
        </div>
        <Button
          onClick={() => setAddPaymentOpen(true)}
          className="gap-2"
          size="sm"
          data-ocid="payment.add_button"
        >
          <Plus className="w-4 h-4" />
          Add Payment
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterStudentId} onValueChange={setFilterStudentId}>
          <SelectTrigger className="w-52" data-ocid="payment.student.select">
            <SelectValue placeholder="Filter by student" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filterStudentId !== "all" && (
          <div className="text-sm font-semibold text-foreground">
            Total:{" "}
            <span className="text-success">
              {formatCurrency(totalFiltered)}
            </span>
          </div>
        )}
      </div>

      {/* Payment list */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center" data-ocid="payments.empty_state">
          <CreditCard className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No payments found</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {filtered.map((payment, idx) => {
            const student = students.find((s) => s.id === payment.studentId);
            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                data-ocid={`payments.item.${idx + 1}`}
              >
                <Card className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="font-display font-bold text-primary text-sm">
                            {student?.name.charAt(0).toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {student ? (
                              <Link
                                to="/students/$id"
                                params={{ id: student.id }}
                                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                              >
                                {student.name}
                              </Link>
                            ) : (
                              <span className="text-sm font-semibold text-muted-foreground">
                                Unknown
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${modeColors[payment.paymentMode] ?? "bg-muted text-muted-foreground"}`}
                            >
                              {payment.paymentMode}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>
                              {new Date(payment.paymentDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            {payment.notes && (
                              <>
                                <span>·</span>
                                <span className="truncate max-w-48">
                                  {payment.notes}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <p className="text-base font-bold text-foreground mr-1">
                          {formatCurrency(payment.amountPaid)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(payment)}
                          data-ocid={`payments.edit_button.${idx + 1}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => openDelete(payment)}
                          data-ocid={`payments.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Summary footer */}
      {filtered.length > 0 && (
        <div className="pt-2 border-t border-border flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            {filtered.length} payments
          </span>
          <span className="font-bold">{formatCurrency(totalFiltered)}</span>
        </div>
      )}

      <AddPaymentDialog
        open={addPaymentOpen}
        onOpenChange={setAddPaymentOpen}
      />

      {/* Edit Payment Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="edit_payment.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                data-ocid="edit_payment.amount.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                max={today}
                data-ocid="edit_payment.date.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Mode</Label>
              <ToggleGroup
                type="single"
                value={editMode}
                onValueChange={(v) => v && setEditMode(v as PaymentMode)}
                className="justify-start"
                data-ocid="edit_payment.mode.select"
              >
                <ToggleGroupItem value="Cash" className="text-xs px-3">
                  Cash
                </ToggleGroupItem>
                <ToggleGroupItem value="UPI" className="text-xs px-3">
                  UPI
                </ToggleGroupItem>
                <ToggleGroupItem value="Bank" className="text-xs px-3">
                  Bank
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                className="resize-none"
                data-ocid="edit_payment.notes.textarea"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                data-ocid="edit_payment.cancel_button"
              >
                Cancel
              </Button>
              <Button type="submit" data-ocid="edit_payment.save_button">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          className="sm:max-w-sm"
          data-ocid="delete_payment.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Delete Payment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove the payment of{" "}
            <span className="font-semibold text-foreground">
              {deletingPayment
                ? formatCurrency(deletingPayment.amountPaid)
                : ""}
            </span>{" "}
            and recalculate all dues for this student. This cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              data-ocid="delete_payment.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              data-ocid="delete_payment.confirm_button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
