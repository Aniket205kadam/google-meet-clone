import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.authentication.isAuthenticated);

  if (isAuthenticated) {
    // Already logged in -> redirect to Home page
    return <Navigate to="/" replace />;
  }

  // Not Logged in so render child component
  return children;
};

export default PublicRoute;
