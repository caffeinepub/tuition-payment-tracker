import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────
export type StudentStatus = "Active" | "Paused" | "Left";
export type DueStatus = "Unpaid" | "Partial" | "Paid";
export type PaymentMode = "Cash" | "UPI" | "Bank";

export interface Student {
  id: string;
  name: string;
  subject: string;
  monthlyFee: number;
  dueDay: number;
  startMonth: string; // YYYY-MM
  status: StudentStatus;
  parentContact: string;
  advanceBalance: number;
}

export interface MonthlyDue {
  id: string;
  studentId: string;
  month: string; // YYYY-MM
  dueDate: string; // YYYY-MM-DD
  expectedFee: number;
  paidAmount: number;
  status: DueStatus;
}

export interface Payment {
  id: string;
  studentId: string;
  paymentDate: string; // YYYY-MM-DD
  amountPaid: number;
  paymentMode: PaymentMode;
  notes: string;
}

// ── Helpers ──────────────────────────────────────────────────
function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonth(): string {
  return formatMonth(new Date());
}

/** Returns all YYYY-MM strings from start (inclusive) to end (inclusive) */
function monthRange(start: string, end: string): string[] {
  const months: string[] = [];
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return months;
}

/** Build a due date string, capping at last day of month */
function buildDueDate(month: string, dueDay: number): string {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const day = Math.min(dueDay, lastDay);
  return `${month}-${String(day).padStart(2, "0")}`;
}

// ── Store ──────────────────────────────────────────────────────
interface AppStore {
  students: Student[];
  dues: MonthlyDue[];
  payments: Payment[];

  addStudent: (data: Omit<Student, "id" | "advanceBalance">) => void;
  updateStudent: (id: string, data: Partial<Omit<Student, "id">>) => void;
  deleteStudent: (id: string) => void;
  addPayment: (data: Omit<Payment, "id">) => void;
  editPayment: (id: string, data: Omit<Payment, "id">) => void;
  deletePayment: (id: string) => void;
  generateMissingDues: () => void;
}

/** Recalculate all dues for a student from scratch based on their payments */
function recalculateDues(
  studentId: string,
  students: Student[],
  dues: MonthlyDue[],
  payments: Payment[],
): { updatedDues: MonthlyDue[]; updatedStudents: Student[] } {
  const updatedDues = dues.map((d) =>
    d.studentId === studentId
      ? { ...d, paidAmount: 0, status: "Unpaid" as DueStatus }
      : { ...d },
  );
  const updatedStudents = students.map((s) => ({ ...s }));
  const updatedStudent = updatedStudents.find((s) => s.id === studentId)!;
  if (!updatedStudent) return { updatedDues, updatedStudents };

  updatedStudent.advanceBalance = 0;

  // Replay all payments for this student in chronological order
  const studentPayments = payments
    .filter((p) => p.studentId === studentId)
    .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));

  for (const payment of studentPayments) {
    const studentDues = updatedDues
      .filter((d) => d.studentId === studentId && d.status !== "Paid")
      .sort((a, b) => a.month.localeCompare(b.month));

    let remaining = payment.amountPaid + updatedStudent.advanceBalance;
    updatedStudent.advanceBalance = 0;

    for (const due of studentDues) {
      if (remaining <= 0) break;
      const dueRef = updatedDues.find((d) => d.id === due.id)!;
      const needed = dueRef.expectedFee - dueRef.paidAmount;
      if (remaining >= needed) {
        dueRef.paidAmount += needed;
        dueRef.status = "Paid";
        remaining -= needed;
      } else {
        dueRef.paidAmount += remaining;
        dueRef.status = "Partial";
        remaining = 0;
      }
    }

    updatedStudent.advanceBalance = remaining;
  }

  return { updatedDues, updatedStudents };
}

// ── Zustand store ──────────────────────────────────────────────
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      students: [],
      dues: [],
      payments: [],

      addStudent: (data) => {
        const student: Student = { ...data, id: genId(), advanceBalance: 0 };
        const months = monthRange(data.startMonth, currentMonth());
        const newDues: MonthlyDue[] = months.map((month) => ({
          id: `d-${student.id}-${month}`,
          studentId: student.id,
          month,
          dueDate: buildDueDate(month, data.dueDay),
          expectedFee: data.monthlyFee,
          paidAmount: 0,
          status: "Unpaid" as DueStatus,
        }));
        set((state) => ({
          students: [...state.students, student],
          dues: [...state.dues, ...newDues],
        }));
      },

      updateStudent: (id, data) => {
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, ...data } : s,
          ),
        }));
      },

      deleteStudent: (id) => {
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
          dues: state.dues.filter((d) => d.studentId !== id),
          payments: state.payments.filter((p) => p.studentId !== id),
        }));
      },

      addPayment: (data) => {
        const payment: Payment = { ...data, id: genId() };
        const { students, dues } = get();

        const student = students.find((s) => s.id === data.studentId);
        if (!student) return;

        // Clone to mutate
        const updatedDues = dues.map((d) => ({ ...d }));
        const updatedStudents = students.map((s) => ({ ...s }));

        const updatedStudent = updatedStudents.find(
          (s) => s.id === data.studentId,
        )!;
        const studentDues = updatedDues
          .filter((d) => d.studentId === data.studentId && d.status !== "Paid")
          .sort((a, b) => a.month.localeCompare(b.month));

        let remaining = data.amountPaid + updatedStudent.advanceBalance;

        for (const due of studentDues) {
          if (remaining <= 0) break;
          const dueRef = updatedDues.find((d) => d.id === due.id)!;
          const needed = dueRef.expectedFee - dueRef.paidAmount;
          if (remaining >= needed) {
            dueRef.paidAmount += needed;
            dueRef.status = "Paid";
            remaining -= needed;
          } else {
            dueRef.paidAmount += remaining;
            dueRef.status = "Partial";
            remaining = 0;
          }
        }

        updatedStudent.advanceBalance = remaining;

        set({
          payments: [...get().payments, payment],
          dues: updatedDues,
          students: updatedStudents,
        });
      },

      editPayment: (id, data) => {
        const { students, dues, payments } = get();
        const updatedPayments = payments.map((p) =>
          p.id === id ? { ...data, id } : p,
        );
        const { updatedDues, updatedStudents } = recalculateDues(
          data.studentId,
          students,
          dues,
          updatedPayments,
        );
        set({
          payments: updatedPayments,
          dues: updatedDues,
          students: updatedStudents,
        });
      },

      deletePayment: (id) => {
        const { students, dues, payments } = get();
        const payment = payments.find((p) => p.id === id);
        if (!payment) return;
        const updatedPayments = payments.filter((p) => p.id !== id);
        const { updatedDues, updatedStudents } = recalculateDues(
          payment.studentId,
          students,
          dues,
          updatedPayments,
        );
        set({
          payments: updatedPayments,
          dues: updatedDues,
          students: updatedStudents,
        });
      },

      generateMissingDues: () => {
        const { students, dues } = get();
        const curMonth = currentMonth();
        const newDues: MonthlyDue[] = [];

        for (const student of students) {
          if (student.status !== "Active") continue;
          const hasDue = dues.some(
            (d) => d.studentId === student.id && d.month === curMonth,
          );
          if (!hasDue) {
            newDues.push({
              id: `d-${student.id}-${curMonth}`,
              studentId: student.id,
              month: curMonth,
              dueDate: buildDueDate(curMonth, student.dueDay),
              expectedFee: student.monthlyFee,
              paidAmount: 0,
              status: "Unpaid",
            });
          }
        }

        if (newDues.length > 0) {
          set((state) => ({ dues: [...state.dues, ...newDues] }));
        }
      },
    }),
    {
      name: "tuition-tracker-store",
      version: 2,
    },
  ),
);

// ── Selectors (utility functions) ─────────────────────────────
export function isOverdue(due: MonthlyDue): boolean {
  if (due.status === "Paid") return false;
  const today = new Date().toISOString().split("T")[0];
  return due.dueDate < today;
}

/** Due date is today or in the future, and not yet paid */
export function isUpcoming(due: MonthlyDue): boolean {
  if (due.status === "Paid") return false;
  const today = new Date().toISOString().split("T")[0];
  return due.dueDate >= today;
}

/** Amount that is actually overdue (past due date, not paid) */
export function pendingOverdueAmount(due: MonthlyDue): number {
  if (due.status === "Paid" || isUpcoming(due)) return 0;
  return due.expectedFee - due.paidAmount;
}

export function daysOverdue(due: MonthlyDue): number {
  if (!isOverdue(due)) return 0;
  const today = new Date();
  const dueD = new Date(due.dueDate);
  return Math.floor((today.getTime() - dueD.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatMonthDisplay(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
