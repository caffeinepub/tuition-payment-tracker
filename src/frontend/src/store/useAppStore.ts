import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────
export interface Tuition {
  id: string;
  name: string;
  students: string[];
  monthlyFee: number;
  startDate: string; // ISO date YYYY-MM-DD
  isActive: boolean;
}

export interface MonthlyDue {
  id: string;
  tuitionId: string;
  month: number; // 1–12
  year: number;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
}

export interface Payment {
  id: string;
  tuitionId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  allocatedMonths: string[]; // MonthlyDue ids
}

export type AttendanceStatus = "present" | "absent" | "holiday";

export interface AttendanceRecord {
  id: string;
  studentId: string; // `${tuitionId}__${studentName}`
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

// ── Helpers ──────────────────────────────────────────────────
function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Extract YYYY-MM from startDate, then return the month AFTER */
export function firstDueYearMonth(startDate: string): {
  year: number;
  month: number;
} {
  const d = new Date(startDate);
  let year = d.getFullYear();
  let month = d.getMonth() + 2; // 0-indexed +1 for 1-indexed +1 for next month
  if (month > 12) {
    month = 1;
    year++;
  }
  return { year, month };
}

export function todayYearMonth(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function compareYearMonth(
  a: { year: number; month: number },
  b: { year: number; month: number },
): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

function monthsInRange(
  from: { year: number; month: number },
  to: { year: number; month: number },
): { year: number; month: number }[] {
  const result: { year: number; month: number }[] = [];
  let { year, month } = from;
  while (compareYearMonth({ year, month }, to) <= 0) {
    result.push({ year, month });
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return result;
}

function makeDueId(tuitionId: string, year: number, month: number): string {
  return `due-${tuitionId}-${year}-${String(month).padStart(2, "0")}`;
}

function generateDuesForTuition(tuition: Tuition): MonthlyDue[] {
  const from = firstDueYearMonth(tuition.startDate);
  const to = todayYearMonth();
  if (compareYearMonth(from, to) > 0) return [];
  return monthsInRange(from, to).map(({ year, month }) => ({
    id: makeDueId(tuition.id, year, month),
    tuitionId: tuition.id,
    month,
    year,
    amount: tuition.monthlyFee,
    isPaid: false,
  }));
}

function allocatePayments(
  tuitionId: string,
  allDues: MonthlyDue[],
  allPayments: Payment[],
): { updatedDues: MonthlyDue[]; updatedPayments: Payment[] } {
  const updatedDues = allDues.map((d) =>
    d.tuitionId === tuitionId
      ? { ...d, isPaid: false, paidDate: undefined }
      : { ...d },
  );

  const tuitionPayments = allPayments
    .filter((p) => p.tuitionId === tuitionId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const updatedPayments = allPayments.map((p) => ({
    ...p,
    allocatedMonths: [...p.allocatedMonths],
  }));

  const remainingByPayment = new Map<string, number>();
  for (const p of tuitionPayments) remainingByPayment.set(p.id, p.amount);

  const tuitionDues = updatedDues
    .filter((d) => d.tuitionId === tuitionId)
    .sort((a, b) => compareYearMonth(a, b));

  for (const p of updatedPayments) {
    if (p.tuitionId === tuitionId) p.allocatedMonths = [];
  }

  for (const due of tuitionDues) {
    for (const payment of tuitionPayments) {
      const rem = remainingByPayment.get(payment.id) ?? 0;
      if (rem <= 0) continue;
      const dueRef = updatedDues.find((d) => d.id === due.id);
      if (!dueRef || dueRef.isPaid) continue;

      remainingByPayment.set(payment.id, rem - due.amount);
      dueRef.isPaid = true;
      dueRef.paidDate = payment.date;

      const pRef = updatedPayments.find((p) => p.id === payment.id);
      if (pRef) pRef.allocatedMonths.push(due.id);
      break;
    }
  }

  return { updatedDues, updatedPayments };
}

// ── Store ──────────────────────────────────────────────────────
interface AppStore {
  tuitions: Tuition[];
  dues: MonthlyDue[];
  payments: Payment[];
  attendance: AttendanceRecord[];

  addTuition: (data: Omit<Tuition, "id">) => void;
  updateTuition: (id: string, data: Omit<Tuition, "id">) => void;
  deleteTuition: (id: string) => void;
  addPayment: (data: Omit<Payment, "id" | "allocatedMonths">) => void;
  updatePayment: (
    id: string,
    data: Omit<Payment, "id" | "allocatedMonths">,
  ) => void;
  deletePayment: (id: string) => void;
  generateMissingDues: () => void;
  markAttendance: (
    studentId: string,
    date: string,
    status: AttendanceStatus | null,
  ) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      tuitions: [],
      dues: [],
      payments: [],
      attendance: [],

      addTuition: (data) => {
        const tuition: Tuition = { ...data, id: genId() };
        const newDues = generateDuesForTuition(tuition);
        set((state) => ({
          tuitions: [...state.tuitions, tuition],
          dues: [...state.dues, ...newDues],
        }));
      },

      updateTuition: (id, data) => {
        const { dues, payments } = get();
        const tuition: Tuition = { ...data, id };
        const otherDues = dues.filter((d) => d.tuitionId !== id);
        const freshDues = generateDuesForTuition(tuition);
        const allDues = [...otherDues, ...freshDues];
        const { updatedDues, updatedPayments } = allocatePayments(
          id,
          allDues,
          payments,
        );
        set((state) => ({
          tuitions: state.tuitions.map((t) => (t.id === id ? tuition : t)),
          dues: updatedDues,
          payments: updatedPayments,
        }));
      },

      deleteTuition: (id) => {
        set((state) => ({
          tuitions: state.tuitions.filter((t) => t.id !== id),
          dues: state.dues.filter((d) => d.tuitionId !== id),
          payments: state.payments.filter((p) => p.tuitionId !== id),
          attendance: state.attendance.filter(
            (a) => !a.studentId.startsWith(`${id}__`),
          ),
        }));
      },

      addPayment: (data) => {
        const payment: Payment = { ...data, id: genId(), allocatedMonths: [] };
        const { dues, payments } = get();
        const allPayments = [...payments, payment];
        const { updatedDues, updatedPayments } = allocatePayments(
          data.tuitionId,
          dues,
          allPayments,
        );
        set({ dues: updatedDues, payments: updatedPayments });
      },

      updatePayment: (id, data) => {
        const { dues, payments } = get();
        const updatedPayments = payments.map((p) =>
          p.id === id ? { ...data, id, allocatedMonths: [] } : p,
        );
        const { updatedDues, updatedPayments: finalPayments } =
          allocatePayments(data.tuitionId, dues, updatedPayments);
        set({ dues: updatedDues, payments: finalPayments });
      },

      deletePayment: (id) => {
        const { dues, payments } = get();
        const payment = payments.find((p) => p.id === id);
        if (!payment) return;
        const updatedPayments = payments.filter((p) => p.id !== id);
        const { updatedDues, updatedPayments: finalPayments } =
          allocatePayments(payment.tuitionId, dues, updatedPayments);
        set({ dues: updatedDues, payments: finalPayments });
      },

      generateMissingDues: () => {
        const { tuitions, dues } = get();
        const today = todayYearMonth();
        const newDues: MonthlyDue[] = [];
        for (const tuition of tuitions) {
          if (!tuition.isActive) continue;
          const from = firstDueYearMonth(tuition.startDate);
          if (compareYearMonth(from, today) > 0) continue;
          const dueId = makeDueId(tuition.id, today.year, today.month);
          if (!dues.some((d) => d.id === dueId)) {
            newDues.push({
              id: dueId,
              tuitionId: tuition.id,
              month: today.month,
              year: today.year,
              amount: tuition.monthlyFee,
              isPaid: false,
            });
          }
        }
        if (newDues.length > 0) {
          set((state) => ({ dues: [...state.dues, ...newDues] }));
        }
      },

      markAttendance: (studentId, date, status) => {
        set((state) => {
          if (status === null) {
            return {
              attendance: state.attendance.filter(
                (a) => !(a.studentId === studentId && a.date === date),
              ),
            };
          }
          const existing = state.attendance.find(
            (a) => a.studentId === studentId && a.date === date,
          );
          if (existing) {
            return {
              attendance: state.attendance.map((a) =>
                a.studentId === studentId && a.date === date
                  ? { ...a, status }
                  : a,
              ),
            };
          }
          return {
            attendance: [
              ...state.attendance,
              { id: genId(), studentId, date, status },
            ],
          };
        });
      },
    }),
    { name: "eduleger-v1", version: 1 },
  ),
);

// ── Selectors ──────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

export function getDuePendingAmount(
  tuitionId: string,
  dues: MonthlyDue[],
): number {
  const today = todayYearMonth();
  return dues
    .filter(
      (d) =>
        d.tuitionId === tuitionId &&
        !d.isPaid &&
        compareYearMonth(d, today) <= 0,
    )
    .reduce((sum, d) => sum + d.amount, 0);
}

export function getOverdueCount(tuitionId: string, dues: MonthlyDue[]): number {
  const today = todayYearMonth();
  return dues.filter(
    (d) =>
      d.tuitionId === tuitionId && !d.isPaid && compareYearMonth(d, today) < 0,
  ).length;
}

export function makeStudentKey(tuitionId: string, studentName: string): string {
  return `${tuitionId}__${studentName}`;
}
