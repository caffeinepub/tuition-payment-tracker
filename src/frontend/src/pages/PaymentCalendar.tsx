import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  compareYearMonth,
  formatCurrency,
  formatMonthLabel,
  getDuePendingAmount,
  todayYearMonth,
  useAppStore,
} from "@/store/useAppStore";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PaymentCalendar() {
  const tuitions = useAppStore((s) => s.tuitions);
  const dues = useAppStore((s) => s.dues);
  const payments = useAppStore((s) => s.payments);

  const today = new Date();
  const todayYM = todayYearMonth();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-12

  const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD

  function prevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    const isCurrentMonth =
      viewYear === todayYM.year && viewMonth === todayYM.month;
    if (isCurrentMonth) return; // Don't go to future months
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else setViewMonth((m) => m + 1);
  }

  const isCurrentMonth =
    viewYear === todayYM.year && viewMonth === todayYM.month;
  const canGoNext = !isCurrentMonth;

  // Build a map: date string -> { paymentIds: string[], pendingTuitionIds: string[] }
  const calendarData = useMemo(() => {
    const map = new Map<
      string,
      { paymentIds: string[]; pendingTuitionIds: string[] }
    >();

    // Payment days → green
    for (const p of payments) {
      const d = new Date(p.date);
      if (d.getFullYear() !== viewYear || d.getMonth() + 1 !== viewMonth)
        continue;
      if (!map.has(p.date))
        map.set(p.date, { paymentIds: [], pendingTuitionIds: [] });
      map.get(p.date)!.paymentIds.push(p.id);
    }

    // Pending/overdue dues → red on 1st of that month (if past) or today (if current month)
    for (const due of dues) {
      if (due.isPaid) continue;
      const dueYM = { year: due.year, month: due.month };
      if (compareYearMonth(dueYM, todayYM) > 0) continue; // future due, skip

      let markDate: string;
      if (due.year === viewYear && due.month === viewMonth) {
        // Mark the 1st of the current view month, unless it's current month then mark today
        if (due.year === todayYM.year && due.month === todayYM.month) {
          markDate = `${due.year}-${String(due.month).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        } else {
          markDate = `${due.year}-${String(due.month).padStart(2, "0")}-01`;
        }
        if (!map.has(markDate))
          map.set(markDate, { paymentIds: [], pendingTuitionIds: [] });
        map.get(markDate)!.pendingTuitionIds.push(due.tuitionId);
      }
    }

    return map;
  }, [payments, dues, viewYear, viewMonth, todayYM, today]);

  // Calendar grid
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=Sun

  type CellItem = { key: string; day: number | null };
  const cells: CellItem[] = [
    ...Array.from({ length: firstDayOfWeek }, (_, i) => ({
      key: `pad-start-${i}`,
      day: null,
    })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      key: `day-${i + 1}`,
      day: i + 1,
    })),
  ];
  while (cells.length % 7 !== 0)
    cells.push({ key: `pad-end-${cells.length}`, day: null });

  function dateStr(day: number) {
    return `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isFuture(day: number) {
    const ds = dateStr(day);
    const d = new Date(ds);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d > t;
  }

  // Selected date detail
  const selectedData = selectedDate ? calendarData.get(selectedDate) : null;

  const selectedPayments = selectedData
    ? selectedData.paymentIds
        .map((id) => payments.find((p) => p.id === id))
        .filter(Boolean)
    : [];

  const selectedPendingTuitions = selectedData
    ? [...new Set(selectedData.pendingTuitionIds)]
        .map((tid) => tuitions.find((t) => t.id === tid))
        .filter(Boolean)
    : [];

  function getTuitionName(id: string) {
    return tuitions.find((t) => t.id === id)?.name ?? "Unknown";
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4 max-w-lg mx-auto">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          data-ocid="payment_cal.prev.button"
          onClick={prevMonth}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-base font-bold text-foreground">
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          data-ocid="payment_cal.next.button"
          onClick={nextMonth}
          disabled={!canGoNext}
          className="disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />{" "}
          Payment received
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />{" "}
          Pending fees
        </span>
      </div>

      {/* Calendar grid */}
      <Card
        data-ocid="payment_cal.calendar.panel"
        className="shadow-card overflow-hidden"
      >
        <CardContent className="p-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map(({ key, day }) => {
              if (day === null) {
                return <div key={key} />;
              }
              const ds = dateStr(day);
              const data = calendarData.get(ds);
              const hasPayment = (data?.paymentIds.length ?? 0) > 0;
              const hasPending = (data?.pendingTuitionIds.length ?? 0) > 0;
              const isToday =
                day === today.getDate() &&
                viewMonth === today.getMonth() + 1 &&
                viewYear === today.getFullYear();
              const future = isFuture(day);
              const isSelected = selectedDate === ds;

              return (
                <button
                  key={key}
                  data-ocid={`payment_cal.day.item.${day}`}
                  type="button"
                  disabled={future}
                  onClick={() => setSelectedDate(isSelected ? null : ds)}
                  className={`relative flex flex-col items-center justify-center rounded-lg py-1.5 transition-colors
                    ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isToday
                          ? "ring-2 ring-primary ring-offset-1"
                          : "hover:bg-muted"
                    }
                    ${future ? "opacity-30 pointer-events-none" : ""}
                  `}
                >
                  <span
                    className={`text-xs font-medium leading-none ${
                      isSelected ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {day}
                  </span>
                  {(hasPayment || hasPending) && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasPayment && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? "bg-white" : "bg-green-500"
                          }`}
                        />
                      )}
                      {hasPending && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? "bg-white" : "bg-red-500"
                          }`}
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detail panel for selected date */}
      {selectedDate &&
        (selectedPayments.length > 0 || selectedPendingTuitions.length > 0) && (
          <Card
            data-ocid="payment_cal.detail.panel"
            className="shadow-card border-border"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">
                  {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                    "en-IN",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    },
                  )}
                </p>
                <button
                  type="button"
                  data-ocid="payment_cal.detail.close_button"
                  onClick={() => setSelectedDate(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedPayments.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
                    Payments Received
                  </p>
                  <div className="space-y-2">
                    {selectedPayments.map(
                      (p) =>
                        p && (
                          <div
                            key={p.id}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {getTuitionName(p.tuitionId)}
                              </p>
                              {p.note && (
                                <p className="text-xs text-muted-foreground italic">
                                  {p.note}
                                </p>
                              )}
                            </div>
                            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                              {formatCurrency(p.amount)}
                            </Badge>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              )}

              {selectedPendingTuitions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">
                    Pending Fees
                  </p>
                  <div className="space-y-2">
                    {selectedPendingTuitions.map(
                      (t) =>
                        t && (
                          <div
                            key={t.id}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {t.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t.students.join(", ")}
                              </p>
                            </div>
                            <Badge variant="destructive">
                              {formatCurrency(getDuePendingAmount(t.id, dues))}
                            </Badge>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {selectedDate &&
        !selectedData?.paymentIds.length &&
        !selectedData?.pendingTuitionIds.length && (
          <Card
            data-ocid="payment_cal.detail.empty_state"
            className="shadow-card"
          >
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No payment activity on this day.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
