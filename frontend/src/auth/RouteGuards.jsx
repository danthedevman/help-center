import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

function FullPageLoader() {
  return <div style={{ padding: 24 }}>Loading...</div>;
}

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireGuest() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to="/workspaces" replace />;
  return <Outlet />;
}
