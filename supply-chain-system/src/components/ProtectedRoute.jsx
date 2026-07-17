import { Navigate } from "react-router-dom";

function ProtectedRoute({
  children,
  role
}) {

  const userRole = localStorage.getItem("role");

  // Allow matching if userRole matches target role exactly, or if user is WAREHOUSE_MANAGER and target is WAREHOUSE
  const isAllowed = userRole === role || 
                    (role === "WAREHOUSE" && userRole === "WAREHOUSE_MANAGER") ||
                    (Array.isArray(role) && role.includes(userRole));

  if (!isAllowed) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;