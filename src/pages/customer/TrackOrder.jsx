import CustomerSidebar from "../../components/CustomerSidebar";
import Navbar from "../../components/Navbar";

function TrackOrder() {
  return (
    <>
      <Navbar />

      <div className="layout">

        <CustomerSidebar />

        <div className="content">

          <h1>Track Order</h1>

          <div className="card">
            <h3>Order #101</h3>

            <br />

            <p>✅ Order Placed</p>
            <br />

            <p>✅ Processing</p>
            <br />

            <p>✅ Shipped</p>
            <br />

            <p>🚚 Delivered</p>
          </div>

        </div>

      </div>
    </>
  );
}

export default TrackOrder;