import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

function Workspaces() {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/workspaces`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data?.error || data?.message || "Failed to load workspaces",
          );
        }

        const list = Array.isArray(data) ? data : data.workspaces;

        if (!cancelled) setWorkspaces(list ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpen = (id) => {
    navigate(`/w/${id}`);
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 mb-0">Workspaces</h1>

        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="alert alert-info py-2 mb-3">Loading workspaces…</div>
      )}

      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

      {!loading && !error && workspaces.length === 0 && (
        <div className="alert alert-secondary py-2">No workspaces found.</div>
      )}

      {!loading && !error && workspaces.length > 0 && (
        <div className="list-group">
          {workspaces.map((w) => (
            <button
              key={w._id || w.id}
              type="button"
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              onClick={() => handleOpen(w._id || w.id || w.workspaceId)}
            >
              <div>
                <div className="fw-semibold">
                  {w.name ?? "Untitled workspace"}
                </div>
                {w.description && (
                  <small className="text-muted">{w.description}</small>
                )}
              </div>
              <span className="text-muted">→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Workspaces;
