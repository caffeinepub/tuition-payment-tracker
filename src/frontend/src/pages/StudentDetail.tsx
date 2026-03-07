import AddPaymentDialog from "@/components/AddPaymentDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  type DueStatus,
  type Payment,
  type PaymentMode,
  type StudentStatus,
  daysOverdue,
  formatCurrency,
  formatMonthDisplay,
  isOverdue,
  isUpcoming,
  pendingOverdueAmount,
  useAppStore,
} from "@/store/useAppStore";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  CreditCard,
  Edit,
  LayoutDashboard,
  MessageCircle,
  Pencil,
  Phone,
  Trash2,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function DueStatusBadge({
  status,
  due,
}: { status: DueStatus; due: { dueDate: string; status: DueStatus } }) {
  const overdue = isOverdue(due as Parameters<typeof isOverdue>[0]);
  const upcoming = isUpcoming(due as Parameters<typeof isUpcoming>[0]);

  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/15 text-destructive border border-destructive/30">
        <AlertTriangle className="w-2.5 h-2.5" />
        Overdue
      </span>
    );
  }
  if (upcoming && status === "Unpaid") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-chart-1/10 text-chart-1 border border-chart-1/30">
        Upcoming
      </span>
    );
  }
  const map: Record<DueStatus, { className: string }> = {
    Paid: { className: "bg-success/15 text-success border-success/30 border" },
    Partial: {
      className:
        "bg-warning/15 text-warning-foreground border-warning/30 border",
    },
    Unpaid: {
      className: "bg-muted text-muted-foreground border border-border",
    },
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status].className}`}
    >
      {status}
    </span>
  );
}

function StudentStatusBadge({ status }: { status: StudentStatus }) {
  const map: Record<StudentStatus, string> = {
    Active: "bg-success/15 text-success border-success/30 border",
    Paused: "bg-warning/15 text-warning-foreground border-warning/30 border",
    Left: "bg-muted text-muted-foreground border border-border",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
}

export default function StudentDetail() {
  const { id } = useParams({ from: "/students/$id" });
  const {
    students,
    dues,
    payments,
    updateStudent,
    editPayment,
    deletePayment,
  } = useAppStore();

  const student = students.find((s) => s.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit student form state
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editFee, setEditFee] = useState("");
  const [editDueDay, setEditDueDay] = useState("");
  const [editStatus, setEditStatus] = useState<StudentStatus>("Active");
  const [editContact, setEditContact] = useState("");

  // Edit payment state
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editPAmount, setEditPAmount] = useState("");
  const [editPDate, setEditPDate] = useState("");
  const [editPMode, setEditPMode] = useState<PaymentMode>("Cash");
  const [editPNotes, setEditPNotes] = useState("");

  // Delete payment state
  const [deletePaymentOpen, setDeletePaymentOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

  const today = new Date().toISOString().split("T")[0];

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Student not found.</p>
        <Link to="/students">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Students
          </Button>
        </Link>
      </div>
    );
  }

  const studentDues = dues
    .filter((d) => d.studentId === student.id)
    .sort((a, b) => b.month.localeCompare(a.month));

  const studentPayments = payments
    .filter((p) => p.studentId === student.id)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

  // Only count dues past their due date as "Pending" -- future dues are "Upcoming"
  const totalPending = studentDues.reduce(
    (sum, d) => sum + pendingOverdueAmount(d),
    0,
  );

  const overdueDues = studentDues.filter((d) => isOverdue(d));

  // WhatsApp message
  const overdueMonths = studentDues
    .filter((d) => isOverdue(d))
    .map((d) => formatMonthDisplay(d.month))
    .join(", ");

  const whatsappMsg = overdueMonths
    ? `Hi, this is a reminder that ${student.name}'s tuition fee of ${formatCurrency(student.monthlyFee)} for ${overdueMonths} is overdue. Total pending: ${formatCurrency(totalPending)}. Please make the payment at your earliest convenience. Thank you!`
    : `Hi, this is a reminder that ${student.name}'s tuition fee of ${formatCurrency(student.monthlyFee)} is due soon. Please make the payment at your earliest convenience. Thank you!`;

  const openEdit = () => {
    setEditName(student.name);
    setEditSubject(student.subject);
    setEditFee(String(student.monthlyFee));
    setEditDueDay(String(student.dueDay));
    setEditStatus(student.status);
    setEditContact(student.parentContact);
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editName.trim() ||
      !editSubject.trim() ||
      !editFee ||
      !editContact.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateStudent(student.id, {
      name: editName.trim(),
      subject: editSubject.trim(),
      monthlyFee: Number(editFee),
      dueDay: Number(editDueDay),
      status: editStatus,
      parentContact: editContact.trim(),
    });
    toast.success("Student updated");
    setEditOpen(false);
  };

  const copyWhatsapp = () => {
    navigator.clipboard.writeText(whatsappMsg).then(() => {
      setCopied(true);
      toast.success("Message copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setEditPAmount(String(payment.amountPaid));
    setEditPDate(payment.paymentDate);
    setEditPMode(payment.paymentMode);
    setEditPNotes(payment.notes);
    setEditPaymentOpen(true);
  };

  const handleEditPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment || !editPAmount || Number(editPAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    editPayment(editingPayment.id, {
      studentId: editingPayment.studentId,
      paymentDate: editPDate,
      amountPaid: Number(editPAmount),
      paymentMode: editPMode,
      notes: editPNotes,
    });
    toast.success("Payment updated");
    setEditPaymentOpen(false);
    setEditingPayment(null);
  };

  const openDeletePayment = (payment: Payment) => {
    setDeletingPayment(payment);
    setDeletePaymentOpen(true);
  };

  const handleDeletePayment = () => {
    if (!deletingPayment) return;
    deletePayment(deletingPayment.id);
    toast.success("Payment deleted");
    setDeletePaymentOpen(false);
    setDeletingPayment(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 pb-20 md:pb-6">
      {/* Back + Dashboard nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/students"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="student_detail.back.link"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Students
        </Link>
        <Link to="/">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            data-ocid="student_detail.dashboard.button"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </Button>
        </Link>
      </div>

      {/* Header Card */}
      <Card className="shadow-card">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-display font-black text-primary text-2xl">
                  {student.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-xl font-bold text-foreground">
                    {student.name}
                  </h1>
                  <StudentStatusBadge status={student.status} />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {student.subject}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {student.parentContact}
                  </span>
                  <span className="flex items-center gap-1">
                    <Wallet className="w-3 h-3" />
                    {formatCurrency(student.monthlyFee)}/month
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                  {totalPending > 0 && (
                    <span className="text-destructive font-semibold">
                      Pending: {formatCurrency(totalPending)}
                    </span>
                  )}
                  {student.advanceBalance > 0 && (
                    <span className="text-success font-semibold">
                      Advance: {formatCurrency(student.advanceBalance)}
                    </span>
                  )}
                  {overdueDues.length > 0 && (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {overdueDues.length} overdue
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={openEdit}
                data-ocid="student.edit_button"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setWhatsappOpen(true)}
                data-ocid="whatsapp.open_modal_button"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setPaymentOpen(true)}
                data-ocid="student.add_payment_button"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Add Payment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Dues Timeline */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base font-semibold">
            Monthly Dues
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 overflow-x-auto">
          {studentDues.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No dues found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Month</TableHead>
                  <TableHead className="text-xs">Due Date</TableHead>
                  <TableHead className="text-xs text-right">Expected</TableHead>
                  <TableHead className="text-xs text-right">Paid</TableHead>
                  <TableHead className="text-xs text-right">Balance</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentDues.map((due) => {
                  const balance = due.expectedFee - due.paidAmount;
                  const overdueD = daysOverdue(due);
                  return (
                    <TableRow key={due.id}>
                      <TableCell className="text-sm font-medium">
                        {formatMonthDisplay(due.month)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(due.dueDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {formatCurrency(due.expectedFee)}
                      </TableCell>
                      <TableCell className="text-sm text-right font-medium">
                        {due.paidAmount > 0 ? (
                          <span className="text-success">
                            {formatCurrency(due.paidAmount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {balance > 0 ? (
                          <span className="text-destructive font-medium">
                            {formatCurrency(balance)}
                          </span>
                        ) : (
                          <span className="text-success">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <DueStatusBadge status={due.status} due={due} />
                          {overdueD > 0 && (
                            <span className="text-xs text-destructive">
                              {overdueD}d late
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base font-semibold">
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {studentPayments.length === 0 ? (
            <p
              className="text-sm text-muted-foreground py-4"
              data-ocid="student.payments.empty_state"
            >
              No payments recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {studentPayments.map((payment, idx) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border"
                  data-ocid={`student.payment.item.${idx + 1}`}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(payment.paymentDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {payment.paymentMode}
                      </Badge>
                      {payment.notes && (
                        <span className="text-xs text-muted-foreground truncate max-w-40">
                          {payment.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm font-bold text-foreground mr-1">
                      {formatCurrency(payment.amountPaid)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditPayment(payment)}
                      data-ocid={`student.payment.edit_button.${idx + 1}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => openDeletePayment(payment)}
                      data-ocid={`student.payment.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg" data-ocid="student.edit.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-subject">Subject *</Label>
                <Input
                  id="edit-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-fee">Monthly Fee (₹) *</Label>
                <Input
                  id="edit-fee"
                  type="number"
                  value={editFee}
                  onChange={(e) => setEditFee(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-dueday">Due Day *</Label>
                <Input
                  id="edit-dueday"
                  type="number"
                  min="1"
                  max="31"
                  value={editDueDay}
                  onChange={(e) => setEditDueDay(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => setEditStatus(v as StudentStatus)}
                >
                  <SelectTrigger id="edit-status">
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
                <Label htmlFor="edit-contact">Parent Contact *</Label>
                <Input
                  id="edit-contact"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" data-ocid="student.edit.save_button">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsappOpen} onOpenChange={setWhatsappOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="whatsapp.dialog">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              WhatsApp Reminder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <p className="text-xs text-muted-foreground">
              Copy this message and send it via WhatsApp:
            </p>
            <Textarea
              value={whatsappMsg}
              readOnly
              rows={6}
              className="resize-none text-sm bg-muted/50"
            />
            <div className="flex justify-between">
              <a
                href={`https://wa.me/${student.parentContact.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:underline font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                Open in WhatsApp
              </a>
              <Button
                size="sm"
                variant="outline"
                onClick={copyWhatsapp}
                className="gap-1.5"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWhatsappOpen(false)}
              data-ocid="whatsapp.close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        defaultStudentId={student.id}
      />

      {/* Edit Payment Dialog */}
      <Dialog open={editPaymentOpen} onOpenChange={setEditPaymentOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="student.edit_payment.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Edit Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditPaymentSubmit} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={editPAmount}
                onChange={(e) => setEditPAmount(e.target.value)}
                data-ocid="student.edit_payment.amount.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={editPDate}
                onChange={(e) => setEditPDate(e.target.value)}
                max={today}
                data-ocid="student.edit_payment.date.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Mode</Label>
              <div className="flex gap-2">
                {(["Cash", "UPI", "Bank"] as PaymentMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setEditPMode(m)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${editPMode === m ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-foreground"}`}
                    data-ocid={`student.edit_payment.mode_${m.toLowerCase()}.toggle`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={editPNotes}
                onChange={(e) => setEditPNotes(e.target.value)}
                rows={2}
                className="resize-none"
                data-ocid="student.edit_payment.notes.textarea"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditPaymentOpen(false)}
                data-ocid="student.edit_payment.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="student.edit_payment.save_button"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Dialog */}
      <Dialog open={deletePaymentOpen} onOpenChange={setDeletePaymentOpen}>
        <DialogContent
          className="sm:max-w-sm"
          data-ocid="student.delete_payment.dialog"
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
              onClick={() => setDeletePaymentOpen(false)}
              data-ocid="student.delete_payment.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePayment}
              data-ocid="student.delete_payment.confirm_button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
