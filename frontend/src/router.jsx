import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAuth, RequireGuest } from "./auth/RouteGuards";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import Workspaces from "./pages/Workspaces.jsx";
import WorkspaceDashboard from "./pages/WorkspaceDashboard.jsx";

import WorkspaceLayout from "./layouts/WorkspaceLayout.jsx";
import Articles from "./pages/Articles.jsx";
import Topics from "./pages/Topics.jsx";
import Themes from "./pages/Themes.jsx";

export const router = createBrowserRouter([
  {
    element: <RequireGuest />,
    children: [{ path: "/login", element: <Login /> }],
  },
  { path: "/register", element: <Register /> },
  { path: "/reset-password", element: <ResetPassword /> },

  {
    element: <RequireAuth />,
    children: [
      { path: "/workspaces", element: <Workspaces /> },
      {
        element: <WorkspaceLayout />,
        children: [
          { path: "/w/:workspaceId", element: <WorkspaceDashboard /> },
          { path: "/w/:workspaceId/articles", element: <Articles /> },
          { path: "/w/:workspaceId/topics", element: <Topics /> },
          { path: "/w/:workspaceId/themes", element: <Themes /> },
        ],
      },

      { path: "/", element: <Navigate to="/workspaces" replace /> },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);
