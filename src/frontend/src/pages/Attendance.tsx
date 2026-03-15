import type { Screen } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { makeStudentKey, useAppStore } from "@/store/useAppStore";
import { CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Props {
  navigate: (s: Screen) => void;
}

export default function Attendance({ navigate }: Props) {
  const tuitions = useAppStore((s) => s.tuitions);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeTuitions = tuitions.filter((t) => t.isActive);

  return (
    <div className="px-4 pt-6 pb-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold font-display text-foreground">
        Attendance
      </h1>

      {activeTuitions.length === 0 ? (
        <Card data-ocid="attendance.empty_state" className="shadow-card">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No active tuitions
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add an active tuition to track attendance
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {activeTuitions.map((t, idx) => {
            const isExpanded = expandedId === t.id;
            return (
              <Card
                key={t.id}
                data-ocid={`attendance.tuition.item.${idx + 1}`}
                className="shadow-card"
              >
                <CardContent className="p-0">
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 p-4 text-left"
                    data-ocid={`attendance.tuition.toggle.${idx + 1}`}
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  >
                    <div className="flex-1">
                      <span className="font-semibold text-foreground">
                        {t.name}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.students.join(", ")}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border">
                      {t.students.map((studentName, sIdx) => (
                        <button
                          type="button"
                          key={studentName}
                          data-ocid={`attendance.student.item.${sIdx + 1}`}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                          onClick={() =>
                            navigate({
                              tab: "attendance",
                              view: "calendar",
                              studentKey: makeStudentKey(t.id, studentName),
                              studentName,
                              tuitionName: t.name,
                            })
                          }
                        >
                          <span className="text-sm text-foreground">
                            {studentName}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
