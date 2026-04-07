import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Terminal from "@/pages/Terminal";
import DockerPage from "@/pages/Docker";
import GithubPage from "@/pages/Github";
import GradioPage from "@/pages/Gradio";
import ServicesPage from "@/pages/Services";
import IntegrationsPage from "@/pages/Integrations";
import FileManagerPage from "@/pages/FileManager";
import HFSpacesPage from "@/pages/HFSpaces";
import LocalProjectsPage from "@/pages/LocalProjects";

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/terminal" element={<Terminal />} />
        <Route path="/docker" element={<DockerPage />} />
        <Route path="/github" element={<GithubPage />} />
        <Route path="/gradio" element={<GradioPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/files" element={<FileManagerPage />} />
        <Route path="/spaces" element={<HFSpacesPage />} />
        <Route path="/local" element={<LocalProjectsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function AuthGate() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster richColors theme="dark" position="top-right" />
      <AuthGate />
    </AuthProvider>
  );
}
