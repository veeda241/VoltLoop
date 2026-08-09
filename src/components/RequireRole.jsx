import React from "react";
import { Navigate } from "react-router-dom";
import { useStore, currentUser } from "../state/store";

export default function RequireRole({ roles, children }) {
  const { state } = useStore();
  const user = currentUser(state);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
