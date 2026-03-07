import { Button } from "@/components/ui/button";
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
  type PaymentMode,
  formatCurrency,
  useAppStore,
} from "@/store/useAppStore";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStudentId?: string;
}

export default function AddPaymentDialog({
  open,
  onOpenChange,
  defaultStudentId,
}: AddPaymentDialogProps) {
  const { students, dues, addPayment } = useAppStore();
  const today = new Date().toISOString().split("T")[0];

  const [studentId, setStudentId] = useState(defaultStudentId ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [mode, setMode] = useState<PaymentMode>("Cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedStudent = students.find((s) => s.id === studentId);
  const pendingAmount = selectedStudent
    ? dues
        .filter(
          (d) => d.studentId === selectedStudent.id && d.status !== "Paid",
        )
        .reduce((sum, d) => sum + d.expectedFee - d.paidAmount, 0)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !amount || Number(amount) <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      addPayment({
        studentId,
        paymentDate: date,
        amountPaid: Number(amount),
        paymentMode: mode,
        notes,
      });
      toast.success(
        `${formatCurrency(Number(amount))} payment recorded for ${selectedStudent?.name}`,
      );
      setLoading(false);
      onOpenChange(false);
      resetForm();
    }, 300);
  };

  const resetForm = () => {
    setStudentId(defaultStudentId ?? "");
    setAmount("");
    setDate(today);
    setMode("Cash");
    setNotes("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md" data-ocid="add_payment.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">Add Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Student */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-student">Student *</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger
                id="ap-student"
                data-ocid="add_payment.student.select"
              >
                <SelectValue placeholder="Select student..." />
              </SelectTrigger>
              <SelectContent>
                {students
                  .filter((s) => s.status !== "Left")
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.subject}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedStudent && pendingAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Pending:{" "}
                <span className="text-destructive font-semibold">
                  {formatCurrency(pendingAmount)}
                </span>
                {selectedStudent.advanceBalance > 0 && (
                  <>
                    {" "}
                    · Advance:{" "}
                    <span className="text-success font-semibold">
                      {formatCurrency(selectedStudent.advanceBalance)}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-amount">Amount (₹) *</Label>
            <Input
              id="ap-amount"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 2500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-ocid="add_payment.amount.input"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-date">Payment Date *</Label>
            <Input
              id="ap-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today}
            />
          </div>

          {/* Payment Mode */}
          <div className="space-y-1.5">
            <Label>Payment Mode</Label>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(v) => v && setMode(v as PaymentMode)}
              className="justify-start"
              data-ocid="add_payment.mode.select"
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

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-notes">Notes (optional)</Label>
            <Textarea
              id="ap-notes"
              placeholder="e.g. Paid 2 months together"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="add_payment.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-ocid="add_payment.submit_button"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
