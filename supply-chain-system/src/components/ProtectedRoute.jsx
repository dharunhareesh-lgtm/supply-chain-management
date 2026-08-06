import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({
  children,
  role
}) {
  const location = useLocation();
  const userRole = localStorage.getItem("role");
  const mustChange = localStorage.getItem("mustChangePassword") === "true";

  if (mustChange && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  // Allow matching if userRole matches target role exactly, or if user is WAREHOUSE_MANAGER and target is WAREHOUSE
  const isAllowed = userRole === role || 
                    (role === "WAREHOUSE" && userRole === "WAREHOUSE_MANAGER") ||
                    (Array.isArray(role) && role.includes(userRole));

  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;