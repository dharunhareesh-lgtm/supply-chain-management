const checkFilters = async () => {
  try {
    const res = await fetch("http://localhost:8082/api/forecast/filters");
    const data = await res.json();
    console.log("=== SYNCED DISTINCT COMMODITIES ===");
    console.log("Count:", (data.commodities || []).length);
    console.log("List:", data.commodities || []);
  } catch (err) {
    console.error(err);
  }
};

checkFilters();
