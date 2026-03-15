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
import { useAppStore } from "@/store/useAppStore";
import type { Payment } from "@/store/useAppStore";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  tuitionId: string | null; // pre-selected tuition
  payment: Payment | null; // for edit mode
  onClose: () => void;
}

export default function PaymentForm({
  open,
  tuitionId,
  payment,
  onClose,
}: Props) {
  const tuitions = useAppStore((s) => s.tuitions);
  const addPayment = useAppStore((s) => s.addPayment);
  const updatePayment = useAppStore((s) => s.updatePayment);

  const [selectedTuitionId, setSelectedTuitionId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      if (payment) {
        setSelectedTuitionId(payment.tuitionId);
        setAmount(String(payment.amount));
        setDate(payment.date);
        setNote(payment.note ?? "");
      } else {
        setSelectedTuitionId(tuitionId ?? tuitions[0]?.id ?? "");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        setNote("");
      }
    }
  }, [open, payment, tuitionId, tuitions]);

  function handleSubmit() {
    const amt = Number.parseFloat(amount);
    if (!selectedTuitionId) {
      toast.error("Please select a tuition");
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!date) {
      toast.error("Please enter a date");
      return;
    }

    const data = {
      tuitionId: selectedTuitionId,
      amount: amt,
      date,
      note: note.trim() || undefined,
    };

    if (payment) {
      updatePayment(payment.id, data);
      toast.success("Payment updated");
    } else {
      addPayment(data);
      toast.success("Payment recorded");
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto" data-ocid="payment.dialog">
        <DialogHeader>
          <DialogTitle>
            {payment ? "Edit Payment" : "Record Payment"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Tuition</Label>
            <Select
              value={selectedTuitionId}
              onValueChange={setSelectedTuitionId}
              disabled={!!payment}
            >
              <SelectTrigger data-ocid="payment.tuition.select">
                <SelectValue placeholder="Select tuition" />
              </SelectTrigger>
              <SelectContent>
                {tuitions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-amount">Amount (₹)</Label>
            <Input
              id="payment-amount"
              type="number"
              data-ocid="payment.amount.input"
              placeholder="e.g. 3000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-date">Date</Label>
            <Input
              id="payment-date"
              type="date"
              data-ocid="payment.date.input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-note">Note (optional)</Label>
            <Input
              id="payment-note"
              data-ocid="payment.note.input"
              placeholder="e.g. For March + April"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            data-ocid="payment.cancel.button"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button data-ocid="payment.submit.button" onClick={handleSubmit}>
            {payment ? "Save Changes" : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
