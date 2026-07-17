# SCM Dashboard - Supply Chain Management System

SCM Dashboard is an enterprise-grade, highly interactive Supply Chain Management web application designed with futuristic UI/UX aesthetics. Built using React, Vite, Tailwind CSS v4, and Three.js, it offers comprehensive role-based access control, interactive geospatial tracking, real-time analytics, and 3D visualization.

---

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Customized dashboards, sidebars, and control flows tailored for 6 primary roles:
    *   **Administrator:** Complete system override, manager administration, system policies, and global reports.
    *   **Supplier:** Product listing management, inventory addition, pricing controls, market forecasting, and revenue reporting.
    *   **Warehouse Manager:** Storage optimization, stock verification, dispatch workflows, location adjustments (secured by OTP), and claims handling.
    *   **Logistics Partner:** Fleet management, route searches, shipment tracking, and revenue sharing details.
    *   **Customer:** Premium product catalog, shopping cart, interactive delivery address management, and order history.
*   **3D Cargo & Fleet Viewer:** Interactive 3D visualization of shipments and carrier states using `@react-three/fiber` and `@react-three/drei`.
*   **Interactive Geospatial Maps:** Location coordinates validation and geospatial routing/tracking using Leaflet and `react-leaflet`.
*   **Secured Location Operations:** Sensitive modifications such as warehouse latitude and longitude adjustments require two-factor OTP verification.
*   **Real-time Analytics:** Visual trends on revenue, claims, dispatch rates, and market forecasting using Recharts.

---

## 🛠️ Tech Stack

*   **Frontend Core:** React 19 (Functional Components, Context API)
*   **Build Tool:** Vite 8 (Hot Module Replacement, ES Modules)
*   **Styling & Motion:** Tailwind CSS v4, Framer Motion, GSAP (GreenSock Animation Platform)
*   **Data Visualization:** Recharts, Leaflet, React Leaflet
*   **3D Graphics:** Three.js, React Three Fiber, React Three Drei
*   **Icons:** Lucide React, React Icons

---

## 📦 Folder Structure

```text
supply-chain-system/
├── public/                 # Static assets (videos, icons, images)
├── src/
│   ├── components/         # Reusable components
│   │   ├── auth/           # Login & Registration widgets
│   │   ├── landing/        # Hero section & animations
│   │   ├── logistics/      # Fleet & route viewer
│   │   ├── map/            # Interactive Leaflet maps
│   │   └── ...             # Navigation, wrappers, notification centers
│   ├── context/            # Global State Management (e.g., CartContext)
│   ├── pages/              # Core application screens
│   │   ├── admin/          # Admin dashboards & management pages
│   │   ├── customer/       # Customer store & order tracking pages
│   │   ├── logistics/      # Delivery status, revenue & tracking pages
│   │   ├── settings/       # Strict role-based settings panels
│   │   ├── supplier/       # Supplier inventory, forecasts & revenue pages
│   │   └── warehouse/      # Warehouse inventory, dispatch & claim pages
│   ├── utils/              # Helper utility scripts
│   ├── App.jsx             # Root layout & routing configuration
│   ├── index.css           # Global Tailwind directives & theme configurations
│   └── main.jsx            # React mounting entry point
├── .gitignore              # Ignored build & OS-specific files
├── LICENSE                 # MIT License details
├── package.json            # Node dependencies and scripts
└── vite.config.js          # Vite optimization & plugin setup
```

---

## ⚙️ Installation & Setup

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Step-by-Step Guide

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/dharunhareesh-lgtm/supply-chain-frontend.git
    cd supply-chain-system
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root of the project:
    ```env
    VITE_API_URL=http://localhost:8082
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

5.  **Build for Production:**
    ```bash
    npm run build
    ```

---

## 📸 Screenshots

*(Screenshots of dashboards, 3D tracking, and settings will be placed here)*

---

## 🔮 Future Enhancements

*   **Real-time WebSockets:** Implement live order and coordinate tracking updates via WebSocket server.
*   **Offline Mode:** Service worker integration for offline stock counting and local queueing.
*   **PWA Support:** Convert the app to a Progressive Web App for mobile installations.
*   **Enhanced 3D Assets:** Support custom GLTF models for fleet vehicles and warehouses.

---

## ✍️ Author

*   **Dharun** - [@dharunhareesh-lgtm](https://github.com/dharunhareesh-lgtm)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
