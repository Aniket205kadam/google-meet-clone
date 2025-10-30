import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(
    (state) => state.authentication.isAuthenticated
  );

  if (!isAuthenticated) {
    // Not logged in -> redirect to login
    return <Navigate to="/login" replace />;
  }

  // Logged in -> render child component
  return children;
};

export default ProtectedRoute;
