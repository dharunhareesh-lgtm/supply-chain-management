const testCommodityCascade = async (commodity) => {
  try {
    // 1. Get States
    const statesRes = await fetch(`http://localhost:8082/api/forecast/filters/states?commodity=${encodeURIComponent(commodity)}`);
    const statesData = await statesRes.json();
    const states = statesData.states || [];
    
    let totalDistricts = 0;
    let totalMarkets = 0;
    let totalVarieties = 0;
    
    // Pick the first state if exists to continue cascade check
    if (states.length > 0) {
      const state = states[0];
      
      // 2. Get Districts for state
      const distRes = await fetch(`http://localhost:8082/api/forecast/filters/districts?commodity=${encodeURIComponent(commodity)}&state=${encodeURIComponent(state)}`);
      const distData = await distRes.json();
      const districts = distData.districts || [];
      totalDistricts = districts.length;
      
      if (districts.length > 0) {
        const district = districts[0];
        
        // 3. Get Markets for state + district
        const mktRes = await fetch(`http://localhost:8082/api/forecast/filters/markets?commodity=${encodeURIComponent(commodity)}&state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
        const mktData = await mktRes.json();
        const markets = mktData.markets || [];
        totalMarkets = markets.length;
        
        if (markets.length > 0) {
          const market = markets[0];
          
          // 4. Get Varieties
          const varRes = await fetch(`http://localhost:8082/api/forecast/filters/varieties?commodity=${encodeURIComponent(commodity)}&state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&market=${encodeURIComponent(market)}`);
          const varData = await varRes.json();
          totalVarieties = (varData.varieties || []).length;
        }
      }
    }
    
    console.log(`\nCOMMODITY: "${commodity}"`);
    console.log(`  -> States Count: ${states.length}`);
    if (states.length > 0) {
      console.log(`  -> Districts Count (under State "${states[0]}"): ${totalDistricts}`);
    }
    console.log(`  -> Markets Count: ${totalMarkets}`);
    console.log(`  -> Varieties Count: ${totalVarieties}`);
    
  } catch (err) {
    console.error(`Error testing cascade for ${commodity}:`, err);
  }
};

const runAllCascadeTests = async () => {
  await testCommodityCascade("Green Gram(Moong)(Whole)");
  await testCommodityCascade("Wheat");
  await testCommodityCascade("Rice");
  await testCommodityCascade("Red gram split/Arhar dal/Tur dal");
  await testCommodityCascade("Watermelon");
};

runAllCascadeTests();
