import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";

import RegisterSupplier from "./pages/RegisterSupplier";
import RegisterCustomer from "./pages/RegisterCustomer";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageSuppliers from "./pages/admin/ManageSuppliers";
import ManageProducts from "./pages/admin/ManageProducts";
import Reports from "./pages/admin/Reports";

import SupplierDashboard from "./pages/supplier/SupplierDashboard";
import AddProduct from "./pages/supplier/AddProduct";
import MyProducts from "./pages/supplier/MyProducts";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import Products from "./pages/customer/Products";
import Orders from "./pages/customer/Orders";

import LogisticsDashboard from "./pages/logistics/LogisticsDashboard";
import Deliveries from "./pages/logistics/Deliveries";
import Tracking from "./pages/logistics/Tracking";

import WarehouseDashboard from "./pages/warehouse/WarehouseDashboard";
import Inventory from "./pages/warehouse/Inventory";
import StockManagement from "./pages/warehouse/StockManagement";

import AddSupplier from "./pages/admin/AddSupplier";
import EditSupplier from "./pages/admin/EditSupplier";

import AdminAddProduct from "./pages/admin/AddProduct";
import AdminEditProduct from "./pages/admin/EditProduct";

import OrderDetails from "./pages/customer/OrderDetails";
import TrackOrder from "./pages/customer/TrackOrder";
import ManageOrders from "./pages/warehouse/ManageOrders";
import AddStock from "./pages/warehouse/AddStock";
import EditStock from "./pages/warehouse/EditStock";


import ProtectedRoute
from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
<Route path="/" element={<Home />} />

<Route path="/login" element={<Login />} />

<Route
  path="/register-customer"
  element={<RegisterCustomer />}
/>

<Route
  path="/register-supplier"
  element={<RegisterSupplier />}
/>


<Route
  path="/admin"
  element={
    <ProtectedRoute role="ADMIN">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/suppliers"
  element={
    <ProtectedRoute role="ADMIN">
      <ManageSuppliers />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/products"
  element={
    <ProtectedRoute role="ADMIN">
      <ManageProducts />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/reports"
  element={
    <ProtectedRoute role="ADMIN">
      <Reports />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/add-supplier"
  element={
    <ProtectedRoute role="ADMIN">
      <AddSupplier />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/edit-supplier/:id"
  element={
    <ProtectedRoute role="ADMIN">
      <EditSupplier />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/add-product"
  element={
    <ProtectedRoute role="ADMIN">
      <AdminAddProduct />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/edit-product/:id"
  element={
    <ProtectedRoute role="ADMIN">
      <AdminEditProduct />
    </ProtectedRoute>
  }
/>

<Route
  path="/supplier"
  element={
    <ProtectedRoute role="SUPPLIER">
      <SupplierDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/supplier/add-product"
  element={
    <ProtectedRoute role="SUPPLIER">
      <AddProduct />
    </ProtectedRoute>
  }
/>

<Route
  path="/supplier/products"
  element={
    <ProtectedRoute role="SUPPLIER">
      <MyProducts />
    </ProtectedRoute>
  }
/>

<Route
  path="/customer"
  element={
    <ProtectedRoute role="CUSTOMER">
      <CustomerDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/customer/products"
  element={
    <ProtectedRoute role="CUSTOMER">
      <Products />
    </ProtectedRoute>
  }
/>

<Route
  path="/customer/orders"
  element={
    <ProtectedRoute role="CUSTOMER">
      <Orders />
    </ProtectedRoute>
  }
/>

<Route
  path="/customer/order-details"
  element={
    <ProtectedRoute role="CUSTOMER">
      <OrderDetails />
    </ProtectedRoute>
  }
/>

<Route
  path="/customer/track-order"
  element={
    <ProtectedRoute role="CUSTOMER">
      <TrackOrder />
    </ProtectedRoute>
  }
/>

<Route
  path="/warehouse"
  element={
    <ProtectedRoute role="WAREHOUSE">
      <WarehouseDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/warehouse/inventory"
  element={
    <ProtectedRoute role="WAREHOUSE">
      <Inventory />
    </ProtectedRoute>
  }
/>

<Route
  path="/warehouse/stock"
  element={
    <ProtectedRoute role="WAREHOUSE">
      <StockManagement />
    </ProtectedRoute>
  }
/>

<Route
  path="/warehouse/orders"
  element={
    <ProtectedRoute role="WAREHOUSE">
      <ManageOrders />
    </ProtectedRoute>
  }
/>

<Route
  path="/warehouse/add-stock"
  element={
    <ProtectedRoute role="WAREHOUSE">
      <AddStock />
    </ProtectedRoute>
  }
/>

<Route
  path="/warehouse/edit-stock/:id"
  element={
    <ProtectedRoute role="WAREHOUSE">
      <EditStock />
    </ProtectedRoute>
  }
/>

<Route
  path="/logistics"
  element={
    <ProtectedRoute role="LOGISTICS">
      <LogisticsDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/logistics/deliveries"
  element={
    <ProtectedRoute role="LOGISTICS">
      <Deliveries />
    </ProtectedRoute>
  }
/>

<Route
  path="/logistics/tracking"
  element={
    <ProtectedRoute role="LOGISTICS">
      <Tracking />
    </ProtectedRoute>
  }
/>


      </Routes>
    </BrowserRouter>
  );
}

export default App;