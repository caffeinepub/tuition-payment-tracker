import { Toaster } from "@/components/ui/sonner";
import Attendance from "@/pages/Attendance";
import AttendanceCalendar from "@/pages/AttendanceCalendar";
import Dashboard from "@/pages/Dashboard";
import Payments from "@/pages/Payments";
import Settings from "@/pages/Settings";
import TuitionDetail from "@/pages/TuitionDetail";
import Tuitions from "@/pages/Tuitions";
import { useAppStore } from "@/store/useAppStore";
import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Settings2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

export type MainTab =
  | "dashboard"
  | "students"
  | "payments"
  | "attendance"
  | "settings";

export type Screen =
  | { tab: MainTab }
  | { tab: "students"; view: "detail"; tuitionId: string }
  | {
      tab: "attendance";
      view: "calendar";
      studentKey: string;
      studentName: string;
      tuitionName: string;
    };

const NAV_ITEMS: { tab: MainTab; label: string; Icon: React.ElementType }[] = [
  { tab: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { tab: "students", label: "Students", Icon: Users },
  { tab: "payments", label: "Payments", Icon: CreditCard },
  { tab: "attendance", label: "Attendance", Icon: CalendarDays },
  { tab: "settings", label: "Settings", Icon: Settings2 },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>({ tab: "dashboard" });
  const generateMissingDues = useAppStore((s) => s.generateMissingDues);

  useEffect(() => {
    generateMissingDues();
  }, [generateMissingDues]);

  const activeTab = screen.tab;

  function navigate(s: Screen) {
    setScreen(s);
  }

  function goToTab(tab: MainTab) {
    setScreen({ tab });
  }

  return (
    <div className="flex flex-col h-dvh bg-background">
      <main className="flex-1 overflow-y-auto bottom-nav-safe">
        {screen.tab === "dashboard" && <Dashboard navigate={navigate} />}
        {screen.tab === "students" && !(screen as any).view && (
          <Tuitions navigate={navigate} />
        )}
        {screen.tab === "students" && (screen as any).view === "detail" && (
          <TuitionDetail
            tuitionId={(screen as any).tuitionId}
            navigate={navigate}
          />
        )}
        {screen.tab === "payments" && <Payments navigate={navigate} />}
        {screen.tab === "attendance" && !(screen as any).view && (
          <Attendance navigate={navigate} />
        )}
        {screen.tab === "attendance" && (screen as any).view === "calendar" && (
          <AttendanceCalendar
            studentKey={(screen as any).studentKey}
            studentName={(screen as any).studentName}
            tuitionName={(screen as any).tuitionName}
            navigate={navigate}
          />
        )}
        {screen.tab === "settings" && <Settings />}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch h-16">
          {NAV_ITEMS.map(({ tab, label, Icon }) => {
            const isActive = activeTab === tab;
            return (
              <button
                type="button"
                key={tab}
                data-ocid={`nav.${tab}.tab`}
                onClick={() => goToTab(tab)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-all ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <Toaster position="top-center" richColors />
    </div>
  );
}
