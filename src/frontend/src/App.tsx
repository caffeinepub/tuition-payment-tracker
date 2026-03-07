import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";
import Payments from "@/pages/Payments";
import StudentDetail from "@/pages/StudentDetail";
import Students from "@/pages/Students";
import { useAppStore } from "@/store/useAppStore";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { useEffect } from "react";

// ── Route definitions ──────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
      <Toaster richColors position="top-right" />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardWrapper,
});

const studentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/students",
  component: Students,
});

const studentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/students/$id",
  component: StudentDetail,
});

const paymentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payments",
  component: Payments,
});

// Catch-all redirect to dashboard
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  studentsRoute,
  studentDetailRoute,
  paymentsRoute,
  notFoundRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ── Dashboard wrapper to trigger generateMissingDues ──────────
function DashboardWrapper() {
  const generateMissingDues = useAppStore((s) => s.generateMissingDues);

  useEffect(() => {
    generateMissingDues();
  }, [generateMissingDues]);

  return <Dashboard />;
}

// ── App ────────────────────────────────────────────────────────
export default function App() {
  return <RouterProvider router={router} />;
}
