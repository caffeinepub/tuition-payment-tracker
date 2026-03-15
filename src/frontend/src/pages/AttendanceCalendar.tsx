import type { Screen } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import type { AttendanceStatus } from "@/store/useAppStore";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  studentKey: string;
  studentName: string;
  tuitionName: string;
  navigate: (s: Screen) => void;
}

const STATUS_CYCLE: (AttendanceStatus | null)[] = [
  null,
  "present",
  "absent",
  "holiday",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export default function AttendanceCalendar({
  studentKey,
  studentName,
  tuitionName,
  navigate,
}: Props) {
  const attendance = useAppStore((s) => s.attendance);
  const markAttendance = useAppStore((s) => s.markAttendance);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);

  const totalDays = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth);

  const todayStr = today.toISOString().split("T")[0];

  const monthAttendance = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    const prefix = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;
    for (const r of attendance) {
      if (r.studentId === studentKey && r.date.startsWith(prefix)) {
        map.set(r.date, r.status);
      }
    }
    return map;
  }, [attendance, studentKey, viewYear, viewMonth]);

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    for (const [, status] of monthAttendance) {
      if (status === "present") present++;
      else if (status === "absent") absent++;
    }
    const total = present + absent;
    const pct = total > 0 ? Math.round((present / total) * 100) : null;
    return { present, absent, pct, totalDays };
  }, [monthAttendance, totalDays]);

  function canGoForward() {
    if (viewYear < today.getFullYear()) return true;
    if (viewYear === today.getFullYear() && viewMonth < today.getMonth() + 1)
      return true;
    return false;
  }

  function prevMonth() {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (!canGoForward()) return;
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  }

  function handleDayTap(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (dateStr > todayStr) return;
    const current = monthAttendance.get(dateStr) ?? null;
    const currentIdx = STATUS_CYCLE.indexOf(current);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
    markAttendance(studentKey, dateStr, nextStatus);
  }

  function getStatusColor(status: AttendanceStatus | undefined | null) {
    switch (status) {
      case "present":
        return "bg-success text-success-foreground";
      case "absent":
        return "bg-destructive text-destructive-foreground";
      case "holiday":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  }

  const monthName = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" },
  );

  // Build calendar grid
  const calendarCells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  return (
    <div className="px-4 pt-4 pb-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          data-ocid="calendar.back.button"
          onClick={() => navigate({ tab: "attendance" })}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold font-display text-foreground">
            {studentName}
          </h1>
          <p className="text-xs text-muted-foreground">{tuitionName}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          data-ocid="calendar.prev.button"
          onClick={prevMonth}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="font-semibold text-foreground text-sm">
          {monthName}
        </span>
        <Button
          variant="ghost"
          size="icon"
          data-ocid="calendar.next.button"
          onClick={nextMonth}
          disabled={!canGoForward()}
          className="disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card className="shadow-card">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-success">{stats.present}</p>
            <p className="text-[11px] text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-destructive">{stats.absent}</p>
            <p className="text-[11px] text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-foreground">
              {stats.pct !== null ? `${stats.pct}%` : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground">Attendance</p>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground text-center -mt-2">
        {stats.present}/{stats.totalDays} days present this month
      </p>

      <Card className="shadow-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">
            Mark Attendance
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Tap a day: → Present → Absent → Holiday → Unmark
          </p>
        </CardHeader>
        <CardContent className="px-3 pb-4">
          <div className="grid grid-cols-7 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] text-muted-foreground py-1 font-medium"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, cellIdx) => {
              const cellKey = day === null ? `empty-${cellIdx}` : `day-${day}`;
              if (day === null) {
                return <div key={cellKey} />;
              }
              const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isFuture = dateStr > todayStr;
              const isToday = dateStr === todayStr;
              const status = monthAttendance.get(dateStr);
              return (
                <button
                  type="button"
                  key={cellKey}
                  data-ocid="calendar.day.toggle"
                  onClick={() => handleDayTap(day)}
                  disabled={isFuture}
                  className={[
                    "aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all select-none",
                    isFuture
                      ? "bg-muted/30 text-muted-foreground/30 cursor-not-allowed"
                      : status
                        ? getStatusColor(status)
                        : "bg-muted/50 text-foreground hover:bg-muted",
                    isToday && !status
                      ? "ring-2 ring-primary ring-offset-1"
                      : "",
                    isToday && status
                      ? "ring-2 ring-offset-1 ring-foreground/30"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-success" />
          Present
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-destructive" />
          Absent
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-warning" />
          Holiday
        </div>
      </div>
    </div>
  );
}
