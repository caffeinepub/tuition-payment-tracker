import AddPaymentDialog from "@/components/AddPaymentDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  formatMonthDisplay,
  isOverdue,
  isUpcoming,
  pendingOverdueAmount,
  useAppStore,
} from "@/store/useAppStore";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  IndianRupee,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function getMonthStr(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return d.toLocaleDateString("en-IN", { month: "short" });
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Dashboard() {
  const { students, dues } = useAppStore();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = getMonthStr(0);

  // Stats
  const thisMonthIncome = dues
    .filter((d) => d.month === currentMonth)
    .reduce((sum, d) => sum + d.paidAmount, 0);

  // Only count dues that are actually overdue (past due date) as pending
  const totalPending = dues.reduce(
    (sum, d) => sum + pendingOverdueAmount(d),
    0,
  );

  const overdueStudentIds = new Set(
    dues.filter((d) => isOverdue(d)).map((d) => d.studentId),
  );
  const overdueCount = overdueStudentIds.size;

  const activeStudents = students.filter((s) => s.status === "Active").length;

  // Bar chart: last 12 months
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const month = getMonthStr(11 - i);
    const collected = dues
      .filter((d) => d.month === month)
      .reduce((sum, d) => sum + d.paidAmount, 0);
    return {
      month: getMonthLabel(11 - i),
      amount: collected,
    };
  });

  // Overdue students list
  const overdueStudents = students
    .filter((s) => overdueStudentIds.has(s.id))
    .map((s) => {
      const overdueDues = dues.filter(
        (d) => d.studentId === s.id && isOverdue(d),
      );
      const totalOverdue = overdueDues.reduce(
        (sum, d) => sum + d.expectedFee - d.paidAmount,
        0,
      );
      return { student: s, overdueDues, totalOverdue };
    });

  // Upcoming due dates (next 7 days)
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split("T")[0];

  const upcomingDues = dues
    .filter(
      (d) =>
        d.status !== "Paid" && d.dueDate >= today && d.dueDate <= in7DaysStr,
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 10);

  // Student summary cards
  const activeStudentCards = students
    .filter((s) => s.status === "Active")
    .map((s) => {
      const studentDues = dues
        .filter((d) => d.studentId === s.id)
        .sort((a, b) => a.month.localeCompare(b.month));
      const paidDues = studentDues.filter((d) => d.status === "Paid");
      const latestPaid =
        paidDues.length > 0 ? paidDues[paidDues.length - 1].month : null;
      const pendingMonths = studentDues.filter(
        (d) => pendingOverdueAmount(d) > 0,
      ).length;
      return { student: s, latestPaid, pendingMonths };
    });

  const statCards = [
    {
      title: "This Month Income",
      value: formatCurrency(thisMonthIncome),
      icon: IndianRupee,
      colorClass: "bg-chart-1/10 text-chart-1",
      borderClass: "border-chart-1/20",
    },
    {
      title: "Total Pending",
      value: formatCurrency(totalPending),
      icon: TrendingUp,
      colorClass: "bg-destructive/10 text-destructive",
      borderClass: "border-destructive/20",
    },
    {
      title: "Overdue Students",
      value: overdueCount,
      icon: AlertTriangle,
      colorClass: "bg-warning/10 text-warning",
      borderClass: "border-warning/20",
    },
    {
      title: "Active Tuitions",
      value: activeStudents,
      icon: Users,
      colorClass: "bg-success/10 text-success",
      borderClass: "border-success/20",
    },
  ];

  return (
    <div
      className="p-4 md:p-6 space-y-6 pb-20 md:pb-6"
      data-ocid="dashboard.section"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
              day: "numeric",
            })}
          </p>
        </div>
        <Button
          onClick={() => setPaymentDialogOpen(true)}
          className="gap-2"
          size="sm"
          data-ocid="dashboard.add_payment.button"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Payment</span>
          <span className="sm:hidden">Pay</span>
        </Button>
      </div>

      {/* Stat Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {statCards.map((card) => (
          <motion.div key={card.title} variants={item}>
            <Card className={`border shadow-card ${card.borderClass}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {card.title}
                    </p>
                    <p className="text-2xl font-display font-bold text-foreground mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${card.colorClass}`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-semibold">
              Monthly Income
            </CardTitle>
            <p className="text-xs text-muted-foreground">Last 12 months</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 11,
                      fill: "oklch(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "oklch(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), "Collected"]}
                    contentStyle={{
                      background: "oklch(var(--popover))",
                      border: "1px solid oklch(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="oklch(var(--chart-1))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overdue Students */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Overdue Students
                </CardTitle>
                <Badge variant="destructive" className="text-xs">
                  {overdueStudents.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {overdueStudents.length === 0 ? (
                <div
                  className="text-center py-6"
                  data-ocid="dashboard.overdue.empty_state"
                >
                  <p className="text-sm text-muted-foreground">
                    No overdue payments 🎉
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {overdueStudents.map(
                    ({ student, overdueDues, totalOverdue }, idx) => (
                      <Link
                        key={student.id}
                        to="/students/$id"
                        params={{ id: student.id }}
                        className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 hover:bg-destructive/10 transition-colors border border-destructive/10 block"
                        data-ocid={`dashboard.overdue.item.${idx + 1}`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {student.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {overdueDues.length} month(s) overdue
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-destructive">
                            {formatCurrency(totalOverdue)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Due Dates */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="shadow-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-chart-1" />
                Upcoming Due Dates
              </CardTitle>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardHeader>
            <CardContent className="pt-0">
              {upcomingDues.length === 0 ? (
                <div
                  className="text-center py-6"
                  data-ocid="dashboard.upcoming.empty_state"
                >
                  <p className="text-sm text-muted-foreground">
                    No dues in next 7 days
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingDues.map((due, idx) => {
                    const student = students.find(
                      (s) => s.id === due.studentId,
                    );
                    return (
                      <div
                        key={due.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                        data-ocid={`dashboard.upcoming.item.${idx + 1}`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {student?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due:{" "}
                            {new Date(due.dueDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          {formatCurrency(due.expectedFee - due.paidAmount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Student Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-semibold">
            Active Students
          </h2>
          <Link
            to="/students"
            className="text-xs text-primary hover:underline font-medium"
          >
            View all →
          </Link>
        </div>
        {activeStudentCards.length === 0 ? (
          <Card className="shadow-card">
            <CardContent
              className="py-8 text-center"
              data-ocid="dashboard.students.empty_state"
            >
              <p className="text-sm text-muted-foreground">
                No active students
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeStudentCards.map(
              ({ student, latestPaid, pendingMonths }, idx) => (
                <Link
                  key={student.id}
                  to="/students/$id"
                  params={{ id: student.id }}
                  data-ocid={`dashboard.student.card.${idx + 1}`}
                >
                  <Card className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer border hover:border-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {student.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.subject}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-primary">
                          {formatCurrency(student.monthlyFee)}
                          <span className="text-muted-foreground font-normal">
                            /mo
                          </span>
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Paid up to
                          </span>
                          <span className="font-medium text-success">
                            {latestPaid ? formatMonthDisplay(latestPaid) : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Pending months
                          </span>
                          <span
                            className={`font-medium ${pendingMonths > 0 ? "text-destructive" : "text-success"}`}
                          >
                            {pendingMonths}
                          </span>
                        </div>
                        {student.advanceBalance > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Advance
                            </span>
                            <span className="font-medium text-success">
                              {formatCurrency(student.advanceBalance)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ),
            )}
          </div>
        )}
      </motion.div>

      <AddPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      />
    </div>
  );
}
