import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { Layout } from "@/components/Layout";

const Overview = lazy(() => import("@/pages/Overview").then((m) => ({ default: m.Overview })));
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail").then((m) => ({ default: m.ProjectDetail })));
const DeployLog = lazy(() => import("@/pages/DeployLog").then((m) => ({ default: m.DeployLog })));
const SystemHealth = lazy(() => import("@/pages/SystemHealth").then((m) => ({ default: m.SystemHealth })));
const Projects = lazy(() => import("@/pages/Projects").then((m) => ({ default: m.Projects })));
const Integrations = lazy(() => import("@/pages/Integrations").then((m) => ({ default: m.Integrations })));
const Setup = lazy(() => import("@/pages/Setup").then((m) => ({ default: m.Setup })));
const Activity = lazy(() => import("@/pages/Activity").then((m) => ({ default: m.Activity })));
const Login = lazy(() => import("@/pages/Login").then((m) => ({ default: m.Login })));
const Settings = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.Settings })));

const PageLoader = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
  </div>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/deploy/:jobId" element={<DeployLog />} />
            <Route path="/system" element={<SystemHealth />} />
            <Route path="/server" element={<Navigate to="/system" replace />} />
            <Route path="/dashboard/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>
);

