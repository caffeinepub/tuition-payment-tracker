import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type AttendanceStatus,
  compareYearMonth,
  formatCurrency,
  formatMonthLabel,
  makeStudentKey,
  useAppStore,
} from "@/store/useAppStore";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  tuitionId: string;
  open: boolean;
  onClose: () => void;
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "#16a34a",
  absent: "#dc2626",
  holiday: "#ca8a04",
};

const STATUS_BG: Record<AttendanceStatus, string> = {
  present: "#dcfce7",
  absent: "#fee2e2",
  holiday: "#fef9c3",
};

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function MonthlyReportModal({
  tuitionId,
  open,
  onClose,
}: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed

  const tuitions = useAppStore((s) => s.tuitions);
  const dues = useAppStore((s) => s.dues);
  const payments = useAppStore((s) => s.payments);
  const attendance = useAppStore((s) => s.attendance);

  const tuition = tuitions.find((t) => t.id === tuitionId);

  const monthDue = useMemo(
    () =>
      dues.find(
        (d) =>
          d.tuitionId === tuitionId && d.year === year && d.month === month,
      ),
    [dues, tuitionId, year, month],
  );

  const monthPayments = useMemo(
    () =>
      payments
        .filter(
          (p) =>
            p.tuitionId === tuitionId &&
            p.date.startsWith(`${year}-${String(month).padStart(2, "0")}`),
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
    [payments, tuitionId, year, month],
  );

  // Compute advance balance: total paid - total dues
  const totalPaid = useMemo(
    () =>
      payments
        .filter((p) => p.tuitionId === tuitionId)
        .reduce((sum, p) => sum + p.amount, 0),
    [payments, tuitionId],
  );
  const totalDues = useMemo(
    () =>
      dues
        .filter((d) => d.tuitionId === tuitionId)
        .reduce((sum, d) => sum + d.amount, 0),
    [dues, tuitionId],
  );
  const advanceBalance = totalPaid - totalDues;

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun

  const monthLabel = formatMonthLabel(year, month);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    const todayYM = { year: today.getFullYear(), month: today.getMonth() + 1 };
    const nextYM =
      month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
    if (compareYearMonth(nextYM, todayYM) > 0) return;
    setYear(nextYM.year);
    setMonth(nextYM.month);
  }

  const isAtCurrentMonth =
    year === today.getFullYear() && month === today.getMonth() + 1;

  function getDueStatusLabel() {
    if (!monthDue) return "Not Generated";
    if (monthDue.isPaid) return "Paid";
    const todayYM = { year: today.getFullYear(), month: today.getMonth() + 1 };
    if (compareYearMonth({ year, month }, todayYM) < 0) return "Overdue";
    return "Pending";
  }

  function getDueStatusColor() {
    const label = getDueStatusLabel();
    if (label === "Paid") return "#16a34a";
    if (label === "Overdue") return "#dc2626";
    if (label === "Pending") return "#ca8a04";
    return "#6b7280";
  }

  function getStudentAttendance(studentName: string) {
    const key = makeStudentKey(tuitionId, studentName);
    const records: Record<string, AttendanceStatus> = {};
    const filtered = attendance.filter(
      (a) =>
        a.studentId === key &&
        a.date.startsWith(`${year}-${String(month).padStart(2, "0")}`),
    );
    for (const a of filtered) {
      const day = Number.parseInt(a.date.split("-")[2]);
      records[day] = a.status;
    }
    return records;
  }

  function buildCalendarCells(): (number | null)[] {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  const calendarCells = buildCalendarCells();
  const todayDate = today.getDate();
  const isFutureMonth =
    compareYearMonth(
      { year, month },
      { year: today.getFullYear(), month: today.getMonth() + 1 },
    ) > 0;

  function handlePrint() {
    window.print();
  }

  if (!tuition) return null;

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #monthly-report-print { display: block !important; }
          #monthly-report-print * { visibility: visible; }
          nav, [data-radix-dialog-overlay], .no-print { display: none !important; }
          @page { margin: 16mm; }
          body { background: white !important; }
          #monthly-report-print {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            background: white;
            color: black;
            font-family: sans-serif;
            font-size: 13px;
            line-height: 1.5;
          }
        }
      `}</style>

      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-lg w-full max-h-[92vh] overflow-y-auto p-0 gap-0">
          {/* Modal controls – hidden during print */}
          <div className="no-print sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
            <DialogHeader className="p-0">
              <DialogTitle className="text-base font-semibold">
                Monthly Report
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  data-ocid="report.month.prev"
                  onClick={prevMonth}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium w-24 text-center">
                  {monthLabel}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  data-ocid="report.month.next"
                  onClick={nextMonth}
                  disabled={isAtCurrentMonth}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button
                size="sm"
                className="h-7 gap-1 text-xs"
                data-ocid="report.print.button"
                onClick={handlePrint}
              >
                <Printer className="w-3 h-3" />
                Print / PDF
              </Button>
            </div>
          </div>

          {/* Printable report content */}
          <div id="monthly-report-print" className="p-5 space-y-5">
            {/* Report Header */}
            <div className="border-b pb-3">
              <h1
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {tuition.name}
              </h1>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  margin: "2px 0 0",
                }}
              >
                {tuition.students.join(", ")}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  margin: "4px 0 0",
                }}
              >
                Monthly Report – {monthLabel}
              </p>
            </div>

            {/* Payment Summary */}
            <section>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#374151",
                  marginBottom: "10px",
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "4px",
                }}
              >
                Payment Summary
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "8px 12px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#6b7280",
                      margin: "0 0 2px",
                    }}
                  >
                    Monthly Fee
                  </p>
                  <p style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>
                    {formatCurrency(tuition.monthlyFee)}
                  </p>
                </div>
                <div
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "8px 12px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#6b7280",
                      margin: "0 0 2px",
                    }}
                  >
                    Due Status
                  </p>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      margin: 0,
                      color: getDueStatusColor(),
                    }}
                  >
                    {getDueStatusLabel()}
                    {monthDue && (
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 400,
                          marginLeft: "6px",
                          color: "#374151",
                        }}
                      >
                        ({formatCurrency(monthDue.amount)})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {advanceBalance > 0 && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    marginBottom: "12px",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "12px" }}>
                    <span style={{ color: "#6b7280" }}>Advance Balance: </span>
                    <span style={{ fontWeight: 700, color: "#16a34a" }}>
                      {formatCurrency(advanceBalance)}
                    </span>
                  </p>
                </div>
              )}

              {monthPayments.length > 0 ? (
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Payments This Month
                  </p>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "12px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#f3f4f6",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <th
                          style={{
                            padding: "5px 8px",
                            textAlign: "left",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Date
                        </th>
                        <th
                          style={{
                            padding: "5px 8px",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            padding: "5px 8px",
                            textAlign: "left",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthPayments.map((p) => (
                        <tr
                          key={p.id}
                          style={{ borderBottom: "1px solid #f3f4f6" }}
                        >
                          <td style={{ padding: "5px 8px", color: "#374151" }}>
                            {new Date(p.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td
                            style={{
                              padding: "5px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                            }}
                          >
                            {formatCurrency(p.amount)}
                          </td>
                          <td
                            style={{
                              padding: "5px 8px",
                              color: "#6b7280",
                              fontStyle: "italic",
                            }}
                          >
                            {p.note || "–"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                    textAlign: "center",
                    padding: "8px 0",
                  }}
                >
                  No payments recorded for {monthLabel}
                </p>
              )}
            </section>

            {/* Attendance Summary – one per student */}
            <section>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#374151",
                  marginBottom: "10px",
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "4px",
                }}
              >
                Attendance Summary
              </h2>

              {tuition.students.map((studentName) => {
                const records = getStudentAttendance(studentName);
                const presentCount = Object.values(records).filter(
                  (s) => s === "present",
                ).length;
                const absentCount = Object.values(records).filter(
                  (s) => s === "absent",
                ).length;
                const holidayCount = Object.values(records).filter(
                  (s) => s === "holiday",
                ).length;
                const attendancePct =
                  presentCount + absentCount > 0
                    ? Math.round(
                        (presentCount / (presentCount + absentCount)) * 100,
                      )
                    : null;

                return (
                  <div
                    key={studentName}
                    style={{
                      marginBottom: "16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "10px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            margin: "0 0 2px",
                          }}
                        >
                          {studentName}
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            margin: 0,
                          }}
                        >
                          {presentCount} / {daysInMonth} days present
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          style={{
                            fontSize: "20px",
                            fontWeight: 700,
                            margin: 0,
                            color:
                              attendancePct === null
                                ? "#9ca3af"
                                : attendancePct >= 75
                                  ? "#16a34a"
                                  : attendancePct >= 50
                                    ? "#ca8a04"
                                    : "#dc2626",
                          }}
                        >
                          {attendancePct !== null ? `${attendancePct}%` : "–"}
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            margin: 0,
                          }}
                        >
                          Attendance
                        </p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      {(
                        [
                          ["Present", presentCount, "#dcfce7", "#16a34a"],
                          ["Absent", absentCount, "#fee2e2", "#dc2626"],
                          ["Holiday", holidayCount, "#fef9c3", "#ca8a04"],
                        ] as const
                      ).map(([label, count, bg, color]) => (
                        <div
                          key={label}
                          style={{
                            flex: 1,
                            background: bg,
                            borderRadius: "5px",
                            padding: "5px 8px",
                            textAlign: "center",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              margin: 0,
                              color,
                            }}
                          >
                            {count}
                          </p>
                          <p
                            style={{
                              fontSize: "10px",
                              margin: 0,
                              color: "#374151",
                            }}
                          >
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: "2px",
                          marginBottom: "2px",
                        }}
                      >
                        {DAY_LABELS.map((d) => (
                          <div
                            key={d}
                            style={{
                              textAlign: "center",
                              fontSize: "9px",
                              fontWeight: 600,
                              color: "#9ca3af",
                              padding: "1px 0",
                            }}
                          >
                            {d}
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: "2px",
                        }}
                      >
                        {calendarCells.map((day, i) => {
                          if (day === null) {
                            return <div key={`pre-cell-${i + 1}`} />;
                          }
                          const isFuture =
                            !isFutureMonth &&
                            year === today.getFullYear() &&
                            month === today.getMonth() + 1 &&
                            day > todayDate;
                          const status = records[day];
                          const bg = status
                            ? STATUS_BG[status]
                            : isFuture
                              ? "#f3f4f6"
                              : "#f9fafb";
                          const color = status
                            ? STATUS_COLORS[status]
                            : isFuture
                              ? "#d1d5db"
                              : "#6b7280";

                          return (
                            <div
                              key={day}
                              style={{
                                background: bg,
                                borderRadius: "3px",
                                padding: "3px 2px",
                                textAlign: "center",
                                fontSize: "10px",
                                fontWeight: status ? 700 : 400,
                                color,
                                opacity: isFuture ? 0.5 : 1,
                              }}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                      {/* Legend */}
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {(
                          [
                            ["Present", "#dcfce7", "#16a34a"],
                            ["Absent", "#fee2e2", "#dc2626"],
                            ["Holiday", "#fef9c3", "#ca8a04"],
                            ["Unmarked", "#f9fafb", "#6b7280"],
                          ] as const
                        ).map(([label, bg, color]) => (
                          <div
                            key={label}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <div
                              style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "2px",
                                background: bg,
                                border: `1px solid ${color}`,
                              }}
                            />
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#6b7280",
                              }}
                            >
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Footer */}
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: "8px",
                textAlign: "center",
                fontSize: "10px",
                color: "#9ca3af",
              }}
            >
              Generated on{" "}
              {today.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
