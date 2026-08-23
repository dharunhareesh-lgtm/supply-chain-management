# Audit Report: DRAVIX SCM Market Forecasting Pipeline

This audit report evaluates the current market price forecasting flow and details the transition plan from the current static rule-based system to a real data-driven forecasting service.

---

## 🔍 Detailed Audit Findings

### 1. Source of Current Market Price
- Sourced from the `products` database table via the `/products` endpoint.
- It returns the price manually defined by the supplier during product listing (`products.price` representing the seller's list price).
- Currently initialized in `MarketForecast.jsx` at line 139 based on the matched product item.

### 2. Source of Government Market Prices
- Pulled from the `gov_market_prices` table in the database.
- It contains only **22 static seeded records** created via the database dump file (`local_dump_clean.sql`). No dynamic updates are performed.

### 3. External API Connection (Gov / AGMARKNET / eNAM)
- **No external API connection is configured.** No connections to AGMARKNET, eNAM, Open Government Data (OGD) platform of India, or any agricultural department exist.
- References in the UI are pure string labels.

### 4. Unit Configurations
- Stored directly as a `double` representing **₹/kg**. 
- AGMARKNET data is historically published in **₹/quintal** (100 kg), meaning the database records have been pre-scaled to ₹/kg. No backend conversion logic exists.

### 5. Historical Record Analysis
- Only 22 rows exist in the `gov_market_prices` table.
- A secondary table, `market_price_history`, tracks values submitted during forecast requests but does not serve as the baseline for trend analysis or ML.

### 6. Current Forecasting Algorithm
- Completely **rule-based** (non-ML).
- Located in `ForecastService.java` (lines 131–144):
  - **Base Price Calculation:**
    $$\text{basePrice} = (\text{avgGovPrice} \times 0.50) + (\text{currentPrice} \times \text{invRatio} \times 0.25) + (\text{currentPrice} \times \text{supRatio} \times 0.15) + (\text{currentPrice} \times (1.0 + \text{seasonalPercent}) \times 0.10)$$
  - **Horizon Growth Multiplier:**
    - Growth Rate ($\text{growthRate}$) is derived from: $0.001 \times \frac{\text{demandIndex} - 50.0}{50.0}$
    - Forecasts:
      - 7 Days: $\text{basePrice} \times (1.0 + \text{growthRate} \times 7.0)$
      - 15 Days: $\text{basePrice} \times (1.0 + \text{growthRate} \times 15.0)$
      - 30 Days: $\text{basePrice} \times (1.0 + \text{growthRate} \times 30.0)$
      - 60 Days: $\text{basePrice} \times (1.0 + \text{growthRate} \times 60.0)$

### 7. Demand Index & Stocks
- **Supplier Stock:** Sourced from the user-selected product object's stock parameter in the frontend state.
- **Warehouse Stock / Demand Index:** Calculated in the backend `ForecastService.getParameters()` method using current database statistics:
  - `WarehouseStock` is calculated via JPA from active product inventories in the region.
  - `DemandIndex` is dynamically calculated based on order counts: $\text{demandIndex} = \min(10.0 + (\text{recentOrders} \times 20.0), 100.0)$.

### 8. Regional Filtering & Fallback
- System attempts to filter `gov_market_prices` matching both commodity and region.
- **Flawed Fallback:** If regional records do not exist (e.g. Wheat + Tamil Nadu), it queries `findByCommodityIgnoreCase("Wheat")`. This averages unrelated regional inputs (Maharashtra ₹34 and Karnataka ₹36) producing a false regional average of ₹35.

---

## 🏗️ Transition to Real Data Forecasting

### A. Real-Data Government Source
To source official government data, the standard endpoint is the **Open Government Data (OGD) Platform India API (data.gov.in)**.
- **Dataset ID:** `9ef842a8-da6f-4dc7-950c-d721eb7d62f4` (Daily Mandi Prices from Agmarknet).
- **Format:** JSON payload.
- **Sample URL:**
  `https://api.data.gov.in/resource/9ef842a8-da6f-4dc7-950c-d721eb7d62f4?api-key=YOUR_OGD_API_KEY&format=json&limit=100&filters[state]=Tamil%20Nadu&filters[commodity]=Wheat`
- **Fields Returned:** `min_price`, `max_price`, `modal_price` (in ₹/quintal).

---

### B. Missing Pieces
1. **API Client Service:** An HTTP client to query data.gov.in dynamically.
2. **Dynamic Conversion Layer:** Logic to divide values by 100.0 (`modal_price / 100.0`) to convert ₹/quintal to ₹/kg.
3. **Caching Layer:** Local caching using Caffeine to store responses for 24 hours to prevent exceeding API limits.
4. **Fallback Logic refinement:** A proper fallback system when a commodity is missing from a state (e.g., return standard national average with a lower confidence indicator instead of silently mixing select states).
5. **Real Statistical Engine:** Replacing basic multipliers with a linear trend regression or moving average using Apache Commons Math or spring-ai-openai integrations.

---

## 🛠️ Files Requiring Modification
1. **`supply-chain-backend/.../service/ForecastService.java`**: Revise calculations, regional queries, and fallbacks. Add API-driven data integration.
2. **`supply-chain-backend/src/main/resources/application.properties`**: Add `gov.api.key` and `gov.api.url` parameters.
3. **`supply-chain-system/src/pages/supplier/MarketForecast.jsx`**: Enhance chart legends to explicitly distinguish between supplier prices, regional mandi prices, and predictions.

---

## 📌 Recommended Implementation Order
1. **Phase 1: Audit and Plan** (This Phase)
2. **Phase 2: Backend API Integration & Units Conversion** (Implement OGD integration, regional mapping, and ₹/quintal to ₹/kg math).
3. **Phase 3: Trend & Statistical Math Integration** (Implement dynamic statistical regressions or OpenAI predictions based on true historical series).
4. **Phase 4: Frontend UI Alignment** (Enhance labels and tooltips in the chart to reflect true real-time sources).
