import { Link } from "react-router-dom";
import bg from "../assets/bg.jpg";

function Home() {
  return (
    <div
  className="home-container"
  style={{
    backgroundImage: `url(${bg})`
  }}
>
    <div className="overlay">
      <div className="hero-section">
        <h3>Dravix SCM</h3>
        <h1>Supply Chain Management System</h1>

        <p>
          Manage suppliers, inventory, orders, and deliveries efficiently
          through a centralized platform.
        </p>

        <div className="features">
          <div className="feature-card">
            <h3>Supplier Management</h3>
            <p>Manage suppliers and procurement activities.</p>
          </div>

          <div className="feature-card">
            <h3>Inventory Tracking</h3>
            <p>Monitor warehouse stock in real time.</p>
          </div>

          <div className="feature-card">
            <h3>Order Management</h3>
            <p>Track customer orders efficiently.</p>
          </div>

          <div className="feature-card">
            <h3>Delivery Monitoring</h3>
            <p>Monitor logistics and deliveries.</p>
          </div>
        </div>

        <Link to="/login">
          <button className="login-btn">Get Started</button>
        </Link>
      </div>
    </div>
    </div>
  );
}

export default Home;