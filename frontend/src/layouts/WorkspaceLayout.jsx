import React from "react";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

function WorkspaceLayout() {
  return (
    <div className="app">
      <Navbar />

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export default WorkspaceLayout;
