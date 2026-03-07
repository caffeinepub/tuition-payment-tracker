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
import { type StudentStatus, useAppStore } from "@/store/useAppStore";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const currentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function AddStudentDialog({
  open,
  onOpenChange,
}: AddStudentDialogProps) {
  const { addStudent } = useAppStore();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [dueDay, setDueDay] = useState("5");
  const [startMonth, setStartMonth] = useState(currentMonthStr());
  const [status, setStatus] = useState<StudentStatus>("Active");
  const [parentContact, setParentContact] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !name.trim() ||
      !subject.trim() ||
      !monthlyFee ||
      !parentContact.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (Number(monthlyFee) <= 0) {
      toast.error("Monthly fee must be greater than 0");
      return;
    }
    const day = Number(dueDay);
    if (day < 1 || day > 31) {
      toast.error("Due day must be between 1 and 31");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      addStudent({
        name: name.trim(),
        subject: subject.trim(),
        monthlyFee: Number(monthlyFee),
        dueDay: day,
        startMonth,
        status,
        parentContact: parentContact.trim(),
      });
      toast.success(`${name.trim()} added successfully`);
      setLoading(false);
      onOpenChange(false);
      resetForm();
    }, 300);
  };

  const resetForm = () => {
    setName("");
    setSubject("");
    setMonthlyFee("");
    setDueDay("5");
    setStartMonth(currentMonthStr());
    setStatus("Active");
    setParentContact("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-lg" data-ocid="add_student.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="as-name">Student Name *</Label>
              <Input
                id="as-name"
                placeholder="e.g. Arjun Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-ocid="add_student.name.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="as-subject">Subject / Class *</Label>
              <Input
                id="as-subject"
                placeholder="e.g. Mathematics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="as-fee">Monthly Fee (₹) *</Label>
              <Input
                id="as-fee"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 2500"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="as-dueday">Due Day (1–31) *</Label>
              <Input
                id="as-dueday"
                type="number"
                min="1"
                max="31"
                placeholder="e.g. 5"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="as-startmonth">Start Month *</Label>
              <Input
                id="as-startmonth"
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                max={currentMonthStr()}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="as-status">Status *</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as StudentStatus)}
              >
                <SelectTrigger id="as-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="as-contact">Parent Contact *</Label>
              <Input
                id="as-contact"
                placeholder="e.g. 9876543210"
                value={parentContact}
                onChange={(e) => setParentContact(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="add_student.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-ocid="add_student.submit_button"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
