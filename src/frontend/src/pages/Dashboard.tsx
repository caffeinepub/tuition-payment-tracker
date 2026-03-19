import type { Screen } from "@/App";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  formatCurrency,
  getDuePendingAmount,
  getOverdueCount,
  useAppStore,
} from "@/store/useAppStore";
import {
  AlertTriangle,
  ChevronRight,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, XAxis } from "recharts";

interface Props {
  navigate: (s: Screen) => void;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function Dashboard({ navigate }: Props) {
  const tuitions = useAppStore((s) => s.tuitions);
  const dues = useAppStore((s) => s.dues);
  const payments = useAppStore((s) => s.payments);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const activeTuitions = tuitions.filter((t) => t.isActive).length;
    const totalPending = tuitions.reduce(
      (sum, t) => sum + getDuePendingAmount(t.id, dues),
      0,
    );
    const overdueCount = tuitions.reduce(
      (sum, t) => sum + getOverdueCount(t.id, dues),
      0,
    );
    const thisMonthIncome = payments
      .filter((p) => {
        const d = new Date(p.date);
        return (
          d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return { activeTuitions, totalPending, overdueCount, thisMonthIncome };
  }, [tuitions, dues, payments]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months: { month: string; income: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const income = payments
        .filter((p) => {
          const pd = new Date(p.date);
          return pd.getFullYear() === year && pd.getMonth() + 1 === month;
        })
        .reduce((sum, p) => sum + p.amount, 0);
      months.push({ month: MONTH_LABELS[d.getMonth()], income });
    }
    return months;
  }, [payments]);

  const chartConfig = {
    income: { label: "Income", color: "#4A6FD4" },
  };

  const tuitionRows = useMemo(
    () =>
      tuitions
        .filter((t) => t.isActive)
        .map((t) => ({
          ...t,
          pending: getDuePendingAmount(t.id, dues),
          overdue: getOverdueCount(t.id, dues),
        }))
        .sort((a, b) => b.overdue - a.overdue || b.pending - a.pending),
    [tuitions, dues],
  );

  return (
    <div className="px-4 pt-6 pb-28 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
            EduLedger
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tuition payment tracker
          </p>
        </div>
        <Button
          size="sm"
          data-ocid="dashboard.add.primary_button"
          onClick={() => navigate({ tab: "students" })}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Tuition
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(stats.thisMonthIncome)}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              This Month Income
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-2">
              <TrendingDown className="w-4 h-4 text-warning-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(stats.totalPending)}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Total Pending
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-foreground">
              {stats.activeTuitions}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Active Tuitions
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-xl font-bold text-foreground">
              {stats.overdueCount}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Overdue Months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Income Chart */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Last 6 Months Income
        </h2>
        <Card data-ocid="dashboard.income_chart.panel" className="shadow-card">
          <CardContent className="p-4 pt-3">
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        `₹${Number(value).toLocaleString("en-IN")}`
                      }
                    />
                  }
                />
                <Bar
                  dataKey="income"
                  fill="#4A6FD4"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tuition List */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Tuitions
        </h2>
        {tuitionRows.length === 0 ? (
          <Card data-ocid="dashboard.empty_state" className="shadow-card">
            <CardContent className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No tuitions yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your first tuition to get started
              </p>
              <Button
                size="sm"
                className="mt-4"
                data-ocid="dashboard.empty.primary_button"
                onClick={() => navigate({ tab: "students" })}
              >
                Add Tuition
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tuitionRows.map((t, idx) => (
              <Card
                key={t.id}
                data-ocid={`dashboard.tuition.item.${idx + 1}`}
                className="shadow-card cursor-pointer hover:shadow-elevated transition-shadow"
                onClick={() =>
                  navigate({ tab: "students", view: "detail", tuitionId: t.id })
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">
                          {t.name}
                        </span>
                        {t.overdue > 0 && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5 py-0 shrink-0"
                          >
                            {t.overdue} overdue
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.students.join(", ")} · {formatCurrency(t.monthlyFee)}
                        /mo
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-bold text-sm ${
                          t.pending > 0 ? "text-destructive" : "text-success"
                        }`}
                      >
                        {t.pending > 0 ? formatCurrency(t.pending) : "Paid"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        pending
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
