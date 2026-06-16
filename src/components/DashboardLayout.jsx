function DashboardLayout({ sidebar, title, children }) {
  return (
    <div className="layout">
      {sidebar}

      <div className="content">
        <h1>{title}</h1>

        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;