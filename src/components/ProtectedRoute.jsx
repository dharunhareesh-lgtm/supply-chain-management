import { Navigate } from "react-router-dom";

function ProtectedRoute({
  children,
  role
}) {

  const userRole =
    localStorage.getItem("role");

  if (userRole !== role) {

    return <Navigate to="/login" />;

  }

  return children;
}

export default ProtectedRoute;