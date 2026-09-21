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

  const isSupplierRole =
    userRole === "SUPPLIER" ||
    userRole === "FPO" ||
    userRole === "FARMER" ||
    userRole === "FPO_SUPPLIER" ||
    userRole === "INDIVIDUAL_FARMER";

  const isWarehouseRole =
    userRole === "WAREHOUSE" ||
    userRole === "WAREHOUSE_MANAGER";

  // Allow matching if userRole matches target role, or supplier/warehouse role variations
  const isAllowed =
    userRole === role ||
    (role === "SUPPLIER" && isSupplierRole) ||
    (role === "WAREHOUSE" && isWarehouseRole) ||
    (Array.isArray(role) && (role.includes(userRole) || (role.includes("SUPPLIER") && isSupplierRole) || (role.includes("WAREHOUSE") && isWarehouseRole)));

  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;