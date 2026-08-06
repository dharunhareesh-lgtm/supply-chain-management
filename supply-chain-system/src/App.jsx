import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";

import RegisterSupplier from "./pages/RegisterSupplier";
import RegisterWarehouse from "./pages/RegisterWarehouse";
import RegisterCustomer from "./pages/RegisterCustomer";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageSuppliers from "./pages/admin/ManageSuppliers";
import ManageProducts from "./pages/admin/ManageProducts";
import Reports from "./pages/admin/Reports";
import ManageManagers from "./pages/admin/ManageManagers";
import AddManager from "./pages/admin/AddManager";
import EditManager from "./pages/admin/EditManager";
import ManageWarehouses from "./pages/admin/ManageWarehouses";
import SupplierDashboard from "./pages/supplier/SupplierDashboard";
import AddProduct from "./pages/supplier/AddProduct";
import MyProducts from "./pages/supplier/MyProducts";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import Products from "./pages/customer/Products";
import ProductDetails from "./pages/customer/ProductDetails";
import Orders from "./pages/customer/Orders";
import CartPage from "./pages/customer/CartPage";
import WishlistPage from "./pages/customer/WishlistPage";
import ComparePage from "./pages/customer/ComparePage";
import MarketForecast from "./pages/supplier/MarketForecast";
import SupplierRevenue from "./pages/supplier/SupplierRevenue";

import LogisticsDashboard from "./pages/logistics/LogisticsDashboard";
import Deliveries from "./pages/logistics/Deliveries";
import Tracking from "./pages/logistics/Tracking";
import LogisticsRevenue from "./pages/logistics/LogisticsRevenue";
import ManagerDashboard from "./pages/warehouse/ManagerDashboard";
import WarehouseDashboard from "./pages/warehouse/WarehouseDashboard";
import Inventory from "./pages/warehouse/Inventory";
import StockManagement from "./pages/warehouse/StockManagement";
import ManagerRegister from "./pages/warehouse/ManagerRegister";
import ManagerLogin from "./pages/warehouse/ManagerLogin";
import AddSupplier from "./pages/admin/AddSupplier";
import EditSupplier from "./pages/admin/EditSupplier";

import AdminAddProduct from "./pages/admin/AddProduct";
import AdminEditProduct from "./pages/admin/EditProduct";

import OrderDetails from "./pages/customer/OrderDetails";
import TrackOrder from "./pages/customer/TrackOrder";
import PendingProducts from "./pages/warehouse/PendingProducts";
import ManageOrders from "./pages/warehouse/ManageOrders";
import AddStock from "./pages/warehouse/AddStock";
import EditStock from "./pages/warehouse/EditStock";
import OrderHistory from "./pages/logistics/OrderHistory";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";
import FuturisticDashboardWrapper from "./components/FuturisticDashboardWrapper";

// Custom agricultural features
import AdminPackaging from "./pages/admin/AdminPackaging";
import AdminInsurance from "./pages/admin/AdminInsurance";
import SupplierInsurance from "./pages/supplier/SupplierInsurance";
import WarehouseRevenue from "./pages/warehouse/WarehouseRevenue";
import WarehouseClaims from "./pages/warehouse/WarehouseClaims";
import WarehouseDispatch from "./pages/warehouse/WarehouseDispatch";
import LogisticsVehicles from "./pages/logistics/LogisticsVehicles";
import ManageLogistics from "./pages/admin/ManageLogistics";
import RegisterLogistics from "./pages/RegisterLogistics";
import WarehousePartnerships from "./pages/warehouse/WarehousePartnerships";
import LogisticsPartnerships from "./pages/logistics/LogisticsPartnerships";

import CustomerVerificationPage from "./pages/customer/CustomerVerificationPage";
import ManageCustomers from "./pages/admin/ManageCustomers";
import CustomerDetailView from "./pages/admin/CustomerDetailView";
import BecomePartner from "./pages/BecomePartner";
import AdminPartnerRequests from "./pages/admin/AdminPartnerRequests";
import AdminPartnerDetail from "./pages/admin/AdminPartnerDetail";
import CustomerVerifications from "./pages/admin/CustomerVerifications";
import ForcePasswordChange from "./pages/ForcePasswordChange";

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <FuturisticDashboardWrapper>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/customer/verification" element={<CustomerVerificationPage />} />
            <Route path="/admin/customers" element={
              <ProtectedRoute role="ADMIN">
                <ManageCustomers />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers/:id" element={
              <ProtectedRoute role="ADMIN">
                <CustomerDetailView />
              </ProtectedRoute>
            } />
            <Route path="/become-partner" element={<BecomePartner />} />
            <Route path="/change-password" element={<ForcePasswordChange />} />
            <Route path="/admin/partner-requests" element={
              <ProtectedRoute role="ADMIN">
                <AdminPartnerRequests />
              </ProtectedRoute>
            } />
            <Route path="/admin/partner-requests/:id" element={
              <ProtectedRoute role="ADMIN">
                <AdminPartnerDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/kyc-verifications" element={
              <ProtectedRoute role="ADMIN">
                <CustomerVerifications />
              </ProtectedRoute>
            } />

          <Route path="/login" element={<Home autoOpenLogin />} />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/register-customer"
            element={<RegisterCustomer />}
          />

          <Route
            path="/register-supplier"
            element={<RegisterSupplier />}
          />

          <Route
            path="/register-logistics"
            element={<RegisterLogistics />}
          />

          <Route
            path="/register-warehouse"
            element={<RegisterWarehouse />}
          />

          <Route
            path="/settings"
            element={<Settings />}
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
  path="/admin/managers"
  element={
    <ProtectedRoute role="ADMIN">
      <ManageManagers />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/logistics"
  element={
    <ProtectedRoute role="ADMIN">
      <ManageLogistics />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/warehouses"
  element={
    <ProtectedRoute role="ADMIN">
      <ManageWarehouses />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/add-manager"
  element={
    <ProtectedRoute role="ADMIN">
      <AddManager />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/edit-manager/:id"
  element={
    <ProtectedRoute role="ADMIN">
      <EditManager />
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
            path="/supplier/revenue"
            element={
              <ProtectedRoute role="SUPPLIER">
                <SupplierRevenue />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supplier/edit-product/:id"
            element={
              <ProtectedRoute role="SUPPLIER">
                <AdminEditProduct />
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
            path="/customer/product/:id"
            element={
              <ProtectedRoute role="CUSTOMER">
                <ProductDetails />
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
  path="/customer/order-details/:id"
  element={
    <ProtectedRoute role="CUSTOMER">
      <OrderDetails />
    </ProtectedRoute>
  }
/>

<Route
  path="/customer/track-order/:id"
  element={
    <ProtectedRoute role="CUSTOMER">
      <TrackOrder />
    </ProtectedRoute>
  }
/>


          <Route
            path="/customer/cart"
            element={
              <ProtectedRoute role="CUSTOMER">
                <CartPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/wishlist"
            element={
              <ProtectedRoute role="CUSTOMER">
                <WishlistPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/compare"
            element={
              <ProtectedRoute role="CUSTOMER">
                <ComparePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supplier/forecast"
            element={
              <ProtectedRoute role="SUPPLIER">
                <MarketForecast />
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
            path="/warehouse/revenue"
            element={
              <ProtectedRoute role="WAREHOUSE">
                <WarehouseRevenue />
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
            path="/warehouse/partnerships"
            element={
              <ProtectedRoute role="WAREHOUSE">
                <WarehousePartnerships />
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
  path="/warehouse/manager-register"
  element={<ManagerRegister />}
/>

<Route
  path="/warehouse/manager-login"
  element={<ManagerLogin />}
/>
<Route
  path="/warehouse/manager-dashboard"
  element={
    <ProtectedRoute role="WAREHOUSE_MANAGER">
      <ManagerDashboard />
    </ProtectedRoute>
  }
/>

          <Route
            path="/warehouse/revenue"
            element={
              <ProtectedRoute role="WAREHOUSE">
                <WarehouseRevenue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/revenue"
            element={
              <ProtectedRoute role="SUPPLIER">
                <SupplierRevenue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse/pending-products"
            element={
              <ProtectedRoute role="WAREHOUSE">
                <PendingProducts />
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
            path="/logistics/revenue"
            element={
              <ProtectedRoute role="LOGISTICS">
                <LogisticsRevenue />
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


<Route
  path="/logistics/history"
  element={
    <ProtectedRoute role="LOGISTICS">
      <OrderHistory />
    </ProtectedRoute>
  }
/>

{/* New custom routes */}
<Route
  path="/admin/packaging"
  element={
    <ProtectedRoute role="ADMIN">
      <AdminPackaging />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/insurance"
  element={
    <ProtectedRoute role="ADMIN">
      <AdminInsurance />
    </ProtectedRoute>
  }
/>
<Route
  path="/supplier/insurance-claims"
  element={
    <ProtectedRoute role="SUPPLIER">
      <SupplierInsurance />
    </ProtectedRoute>
  }
/>
<Route
  path="/warehouse/claims"
  element={
    <ProtectedRoute role="WAREHOUSE">
      <WarehouseClaims />
    </ProtectedRoute>
  }
/>
<Route
  path="/warehouse/dispatch"
  element={
    <ProtectedRoute role="WAREHOUSE">
      <WarehouseDispatch />
    </ProtectedRoute>
  }
/>
<Route
  path="/logistics/vehicles"
  element={
    <ProtectedRoute role="LOGISTICS">
      <LogisticsVehicles />
    </ProtectedRoute>
  }
/>
<Route
  path="/logistics/partnership-requests"
  element={
    <ProtectedRoute role="LOGISTICS">
      <LogisticsPartnerships />
    </ProtectedRoute>
  }
/>
        </Routes>
      </FuturisticDashboardWrapper>
    </CartProvider>
  </BrowserRouter>
);
}

export default App;
