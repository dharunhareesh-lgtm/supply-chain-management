import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";

function OrderDetails() {
  return (
    <>
      <Navbar />

      <div className="layout">

        <CustomerSidebar />

        <div className="content">

          <h1>Order Details</h1>

          <div className="card">
            <h3>Order ID : 101</h3>
            <p>Product : Rice</p>
            <p>Quantity : 10</p>
            <p>Status : Delivered</p>
            <p>Order Date : 15-06-2026</p>
          </div>

        </div>

      </div>
    </>
  );
}

export default OrderDetails;