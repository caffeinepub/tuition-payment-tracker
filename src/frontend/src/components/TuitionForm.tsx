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
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/useAppStore";
import type { Tuition } from "@/store/useAppStore";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface StudentEntry {
  id: string;
  value: string;
}

interface Props {
  open: boolean;
  tuition: Tuition | null;
  onClose: () => void;
}

function makeEntry(value = ""): StudentEntry {
  return { id: Math.random().toString(36).slice(2), value };
}

export default function TuitionForm({ open, tuition, onClose }: Props) {
  const addTuition = useAppStore((s) => s.addTuition);
  const updateTuition = useAppStore((s) => s.updateTuition);

  const [name, setName] = useState("");
  const [students, setStudents] = useState<StudentEntry[]>([makeEntry()]);
  const [monthlyFee, setMonthlyFee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (open) {
      if (tuition) {
        setName(tuition.name);
        setStudents(
          tuition.students.length > 0
            ? tuition.students.map((s) => makeEntry(s))
            : [makeEntry()],
        );
        setMonthlyFee(String(tuition.monthlyFee));
        setStartDate(tuition.startDate);
        setIsActive(tuition.isActive);
        setPhone(tuition.phone ?? "");
      } else {
        setName("");
        setStudents([makeEntry()]);
        setMonthlyFee("");
        setStartDate(new Date().toISOString().split("T")[0]);
        setIsActive(true);
        setPhone("");
      }
    }
  }, [open, tuition]);

  function handleSubmit() {
    const trimmedName = name.trim();
    const validStudents = students.map((s) => s.value.trim()).filter(Boolean);
    const fee = Number.parseFloat(monthlyFee);

    if (!trimmedName) {
      toast.error("Please enter a tuition name");
      return;
    }
    if (validStudents.length === 0) {
      toast.error("Add at least one student");
      return;
    }
    if (!fee || fee <= 0) {
      toast.error("Please enter a valid monthly fee");
      return;
    }
    if (!startDate) {
      toast.error("Please enter a start date");
      return;
    }

    const data = {
      name: trimmedName,
      students: validStudents,
      monthlyFee: fee,
      startDate,
      isActive,
      phone: phone.trim(),
    };

    if (tuition) {
      updateTuition(tuition.id, data);
      toast.success("Tuition updated");
    } else {
      addTuition(data);
      toast.success("Tuition added");
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto" data-ocid="tuition.dialog">
        <DialogHeader>
          <DialogTitle>{tuition ? "Edit Tuition" : "Add Tuition"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="tuition-name">Tuition / Family Name</Label>
            <Input
              id="tuition-name"
              data-ocid="tuition.name.input"
              placeholder="e.g. Sharma Family"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Student Names</Label>
            {students.map((entry, idx) => (
              <div key={entry.id} className="flex gap-2">
                <Input
                  data-ocid={`tuition.student.input.${idx + 1}`}
                  placeholder={`Student ${idx + 1}`}
                  value={entry.value}
                  onChange={(e) => {
                    setStudents(
                      students.map((s) =>
                        s.id === entry.id ? { ...s, value: e.target.value } : s,
                      ),
                    );
                  }}
                />
                {students.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    data-ocid={`tuition.student.delete_button.${idx + 1}`}
                    onClick={() =>
                      setStudents(students.filter((s) => s.id !== entry.id))
                    }
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 mt-1"
              data-ocid="tuition.add_student.button"
              onClick={() => setStudents([...students, makeEntry()])}
            >
              <Plus className="w-3.5 h-3.5" /> Add Student
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monthly-fee">Monthly Fee (₹)</Label>
            <Input
              id="monthly-fee"
              type="number"
              data-ocid="tuition.fee.input"
              placeholder="e.g. 3000"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              data-ocid="tuition.start_date.input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp-phone">Parent's WhatsApp Number</Label>
            <Input
              id="whatsapp-phone"
              type="tel"
              data-ocid="tuition.phone.input"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Used for sending fee reminders
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is-active">Active</Label>
            <Switch
              id="is-active"
              data-ocid="tuition.active.switch"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            data-ocid="tuition.cancel.button"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button data-ocid="tuition.submit.button" onClick={handleSubmit}>
            {tuition ? "Save Changes" : "Add Tuition"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
