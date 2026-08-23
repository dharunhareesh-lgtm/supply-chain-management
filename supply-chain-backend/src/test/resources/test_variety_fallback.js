const fetchForecast = async (productName, region, district, market, variety) => {
  try {
    const res = await fetch("http://localhost:8082/api/forecast/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName,
        currentPrice: 25.0,
        quantityAvailable: 1000,
        demandIndex: 50,
        month: "August",
        warehouseStock: 500,
        region,
        district,
        market,
        variety
      })
    });
    const data = await res.json();
    console.log(`\nFORECAST REQUEST: ${productName} in ${market} (${variety || "None"})`);
    if (data.error) {
      console.log(`RESULT: Error -> ${data.error}`);
    } else {
      console.log(`RESULT: Gov Price = ₹${data.governmentPrice}/kg, Market = ${data.market}, Variety = ${data.variety}, Obs Date = ${data.observationDate}, Status = ${data.forecastStatus}`);
    }
  } catch (err) {
    console.error(err);
  }
};

const runTests = async () => {
  // Test 1: Gujarat, Gir Somnath, Veraval APMC (No variety)
  await fetchForecast("Wheat", "Gujarat", "Gir Somnath", "Veraval APMC", "");
  // Test 2: Nagpur APMC (No variety)
  await fetchForecast("Wheat", "Maharashtra", "Nagpur", "Nagpur APMC", "");
};

runTests();
