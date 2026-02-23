import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAuth, RequireGuest } from "./auth/RouteGuards";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import Workspaces from "./pages/Workspaces.jsx";
import WorkspaceDashboard from "./pages/WorkspaceDashboard.jsx";

export const router = createBrowserRouter([
  {
    element: <RequireGuest />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/login", element: <Login /> },
    ],
  },
  { path: "/register", element: <Register /> },
  { path: "/reset-password", element: <ResetPassword /> },
  {
    element: <RequireAuth />,
    children: [
      { path: "/workspaces", element: <Workspaces /> },
      { path: "/w/:workspaceId", element: <WorkspaceDashboard /> },

      { path: "/", element: <Navigate to="/workspaces" replace /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
