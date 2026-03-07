import AddPaymentDialog from "@/components/AddPaymentDialog";
import AddStudentDialog from "@/components/AddStudentDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type StudentStatus,
  formatCurrency,
  isOverdue,
  isUpcoming,
  pendingOverdueAmount,
  useAppStore,
} from "@/store/useAppStore";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  LayoutDashboard,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

function StatusBadge({ status }: { status: StudentStatus }) {
  const map: Record<StudentStatus, { label: string; className: string }> = {
    Active: {
      label: "Active",
      className: "bg-success/15 text-success border-success/30 border",
    },
    Paused: {
      label: "Paused",
      className:
        "bg-warning/15 text-warning-foreground border-warning/30 border",
    },
    Left: {
      label: "Left",
      className: "bg-muted text-muted-foreground border border-border",
    },
  };
  const { label, className } = map[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export default function Students() {
  const { students, dues, deleteStudent, updateStudent } = useAppStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | StudentStatus>("All");
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);

  // Edit student state
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editFee, setEditFee] = useState("");
  const [editDueDay, setEditDueDay] = useState("");
  const [editStatus, setEditStatus] = useState<StudentStatus>("Active");
  const [editContact, setEditContact] = useState("");

  const studentToDelete =
    students.find((s) => s.id === deleteStudentId) ?? null;

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.subject.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || s.status === filter;
    return matchSearch && matchFilter;
  });

  const openEdit = (student: (typeof students)[0]) => {
    setEditStudentId(student.id);
    setEditName(student.name);
    setEditSubject(student.subject);
    setEditFee(String(student.monthlyFee));
    setEditDueDay(String(student.dueDay));
    setEditStatus(student.status);
    setEditContact(student.parentContact);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editStudentId ||
      !editName.trim() ||
      !editSubject.trim() ||
      !editFee ||
      !editContact.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateStudent(editStudentId, {
      name: editName.trim(),
      subject: editSubject.trim(),
      monthlyFee: Number(editFee),
      dueDay: Number(editDueDay),
      status: editStatus,
      parentContact: editContact.trim(),
    });
    toast.success("Student updated");
    setEditStudentId(null);
  };

  function getStudentStats(studentId: string) {
    const studentDues = dues.filter((d) => d.studentId === studentId);
    // Only count dues that are actually overdue (past due date), not upcoming future dues
    const overdueDues = studentDues.filter((d) => isOverdue(d));
    const pending = overdueDues.length;
    const overdue = overdueDues.length;
    const pendingAmount = studentDues.reduce(
      (sum, d) => sum + pendingOverdueAmount(d),
      0,
    );
    return { pending, overdue, pendingAmount };
  }

  return (
    <div className="p-4 md:p-6 space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Students
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {students.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              data-ocid="students.dashboard.button"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>
          <Button
            onClick={() => setAddStudentOpen(true)}
            className="gap-2"
            size="sm"
            data-ocid="students.add_button"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="students.search_input"
          />
        </div>
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
        >
          <TabsList className="h-9" data-ocid="students.filter.tab">
            <TabsTrigger value="All" className="text-xs px-3">
              All
            </TabsTrigger>
            <TabsTrigger value="Active" className="text-xs px-3">
              Active
            </TabsTrigger>
            <TabsTrigger value="Paused" className="text-xs px-3">
              Paused
            </TabsTrigger>
            <TabsTrigger value="Left" className="text-xs px-3">
              Left
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 text-center"
            data-ocid="students.empty_state"
          >
            <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No students found</p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {filtered.map((student, idx) => {
              const stats = getStudentStats(student.id);
              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  data-ocid={`students.item.${idx + 1}`}
                >
                  <Card className="shadow-card hover:shadow-elevated transition-all border hover:border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        {/* Avatar + Info */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="font-display font-bold text-primary text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                to="/students/$id"
                                params={{ id: student.id }}
                                className="font-semibold text-sm text-foreground hover:text-primary transition-colors"
                              >
                                {student.name}
                              </Link>
                              <StatusBadge status={student.status} />
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                              <BookOpen className="w-3 h-3" />
                              <span>{student.subject}</span>
                              <span className="mx-1">·</span>
                              <Phone className="w-3 h-3" />
                              <span>{student.parentContact}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats + Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Desktop stats */}
                          <div className="hidden md:flex items-center gap-4 text-xs">
                            <div className="text-center">
                              <p className="font-bold text-foreground">
                                {formatCurrency(student.monthlyFee)}
                              </p>
                              <p className="text-muted-foreground">per month</p>
                            </div>
                            {stats.pendingAmount > 0 && (
                              <div className="text-center">
                                <p className="font-bold text-destructive">
                                  {formatCurrency(stats.pendingAmount)}
                                </p>
                                <p className="text-muted-foreground">
                                  {stats.pending} month(s)
                                </p>
                              </div>
                            )}
                            {stats.overdue > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {stats.overdue} overdue
                              </Badge>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => setPaymentStudentId(student.id)}
                            data-ocid={`students.add_payment.button.${idx + 1}`}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Pay</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => openEdit(student)}
                            data-ocid={`students.edit_button.${idx + 1}`}
                            aria-label={`Edit ${student.name}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteStudentId(student.id)}
                            data-ocid={`students.delete_button.${idx + 1}`}
                            aria-label={`Delete ${student.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>

                          <Link to="/students/$id" params={{ id: student.id }}>
                            <Button size="sm" variant="ghost" className="p-2">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Mobile stats row */}
                      <div className="md:hidden mt-3 pt-3 border-t border-border flex gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Fee: </span>
                          <span className="font-semibold">
                            {formatCurrency(student.monthlyFee)}/mo
                          </span>
                        </div>
                        {stats.pendingAmount > 0 && (
                          <div>
                            <span className="text-muted-foreground">
                              Pending:{" "}
                            </span>
                            <span className="font-semibold text-destructive">
                              {formatCurrency(stats.pendingAmount)}
                            </span>
                          </div>
                        )}
                        {stats.overdue > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {stats.overdue} overdue
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <AddStudentDialog
        open={addStudentOpen}
        onOpenChange={setAddStudentOpen}
      />
      <AddPaymentDialog
        open={!!paymentStudentId}
        onOpenChange={(v) => {
          if (!v) setPaymentStudentId(null);
        }}
        defaultStudentId={paymentStudentId ?? undefined}
      />

      {/* Edit Student Dialog */}
      <Dialog
        open={!!editStudentId}
        onOpenChange={(v) => {
          if (!v) setEditStudentId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg" data-ocid="students.edit.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="se-name">Name *</Label>
                <Input
                  id="se-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  data-ocid="students.edit.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="se-subject">Subject / Class *</Label>
                <Input
                  id="se-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="se-fee">Monthly Fee (₹) *</Label>
                <Input
                  id="se-fee"
                  type="number"
                  min="1"
                  value={editFee}
                  onChange={(e) => setEditFee(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="se-dueday">Due Day (1–31) *</Label>
                <Input
                  id="se-dueday"
                  type="number"
                  min="1"
                  max="31"
                  value={editDueDay}
                  onChange={(e) => setEditDueDay(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="se-status">Status *</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => setEditStatus(v as StudentStatus)}
                >
                  <SelectTrigger id="se-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                    <SelectItem value="Left">Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="se-contact">Parent Contact *</Label>
                <Input
                  id="se-contact"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditStudentId(null)}
                data-ocid="students.edit.cancel_button"
              >
                Cancel
              </Button>
              <Button type="submit" data-ocid="students.edit.save_button">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Student Confirmation */}
      <AlertDialog
        open={!!deleteStudentId}
        onOpenChange={(v) => {
          if (!v) setDeleteStudentId(null);
        }}
      >
        <AlertDialogContent data-ocid="students.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {studentToDelete?.name}
              </span>{" "}
              and all their dues and payment history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="students.delete.cancel_button"
              onClick={() => setDeleteStudentId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="students.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteStudentId) {
                  deleteStudent(deleteStudentId);
                  setDeleteStudentId(null);
                }
              }}
            >
              Delete Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
