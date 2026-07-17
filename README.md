# Supply Chain Management System (SCM)

An enterprise-grade, highly interactive Supply Chain Management System featuring a custom React + Vite frontend and a secure Spring Boot Maven backend. It offers comprehensive role-based access control, interactive geospatial tracking, real-time analytics, and 3D visualization.

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

### Frontend
*   **Core:** React 19 (Functional Components, Context API), Vite 8
*   **Styling & Motion:** Tailwind CSS v4, Framer Motion, GSAP (GreenSock Animation Platform)
*   **Data Visualization:** Recharts, Leaflet, React Leaflet
*   **3D Graphics:** Three.js, React Three Fiber, React Three Drei
*   **Icons:** Lucide React, React Icons

### Backend
*   **Core Framework:** Spring Boot (Java 17/21)
*   **Build Tool:** Maven
*   **Database & Persistence:** MySQL, Spring Data JPA / Hibernate
*   **Security & OTP:** Custom OTP Service for secure actions
*   **Integrations:** Spring Mail (SMTP integration for notifications), Spring AI (OpenAI integrations)

---

## 📦 Repository Structure

```text
capstone/
├── supply-chain-system/     # React Frontend Application
│   ├── public/              # Static assets (videos, icons, images)
│   ├── src/                 # React source code
│   ├── package.json         # Frontend dependencies and scripts
│   └── vite.config.js       # Vite build configurations
├── supply-chain-backend/    # Spring Boot Backend API
│   ├── src/                 # Java source code
│   ├── pom.xml              # Maven dependencies & configurations
│   └── mvnw/mvnw.cmd        # Maven wrapper scripts
├── .gitignore               # Root gitignore covering both stacks
├── LICENSE                  # MIT License
└── README.md                # Project documentation
```

---

## ⚙️ Installation & Setup

### 1. Backend Setup (Spring Boot)

1.  **Navigate to backend directory:**
    ```bash
    cd supply-chain-backend
    ```

2.  **Configure Environment Variables:**
    The backend uses environment placeholders in `application.properties`. Set the following environment variables (or configure a local `.env` / system variables):
    ```env
    SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/supply_chain_db?createDatabaseIfNotExist=true
    SPRING_DATASOURCE_USERNAME=root
    SPRING_DATASOURCE_PASSWORD=your_mysql_password
    SPRING_MAIL_USERNAME=your_gmail_username@gmail.com
    SPRING_MAIL_PASSWORD=your_gmail_app_password
    OPENAI_API_KEY=your_openai_api_key
    ```

3.  **Run the Backend:**
    ```bash
    ./mvnw spring-boot:run
    ```
    The API server will run at `http://localhost:8082`.

---

### 2. Frontend Setup (React + Vite)

1.  **Navigate to frontend directory:**
    ```bash
    cd supply-chain-system
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file inside `supply-chain-system/`:
    ```env
    VITE_API_URL=http://localhost:8082
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The frontend client will start at `http://localhost:5173`.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
