import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui";
import { authClient } from "@/lib/auth-client";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import ScriptEditorPage from "@/pages/ScriptEditorPage";
import ScriptDetailPage from "@/pages/ScriptDetailPage";
import ZenMode from "@/pages/ZenMode";
import NotFoundPage from "@/pages/NotFoundPage";
import Landing from "@/pages/Landing";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SentryTestTrigger } from "@/components/SentryTestTrigger";

const queryClient = new QueryClient();

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  if (session.isPending) return <Spinner />;
  if (!session.data) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

function ProtectedRoute({
  children,
  withFooter = false,
}: {
  children: React.ReactNode;
  withFooter?: boolean;
}) {
  return (
    <RequireAuth>
      <ErrorBoundary>
        <div className="min-h-screen bg-background flex flex-col">
          <AppHeader />
          <div className="flex-1">{children}</div>
          {withFooter && <Footer />}
        </div>
      </ErrorBoundary>
    </RequireAuth>
  );
}

function BareProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <ErrorBoundary>{children}</ErrorBoundary>
    </RequireAuth>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();

  if (session.isPending) return <Spinner />;
  if (session.data) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const navigate = useNavigate();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={(href) => navigate(href)}
    >
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route
          path="/sign-in"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/sign-up"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute withFooter>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scripts/new"
          element={
            <ProtectedRoute withFooter>
              <ScriptEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scripts/:id"
          element={
            <ProtectedRoute>
              <ScriptDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scripts/:id/edit"
          element={
            <ProtectedRoute withFooter>
              <ScriptEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scripts/:id/zen"
          element={
            <BareProtectedRoute>
              <ZenMode />
            </BareProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <SentryTestTrigger />
      <Toaster />
    </NeonAuthUIProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        basename={import.meta.env.BASE_URL?.replace(/\/$/, "") ?? ""}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
