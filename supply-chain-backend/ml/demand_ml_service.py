#!/usr/bin/env python3
"""
demand_ml_service.py — Linear Regression Demand Forecasting ML Service for DRAVIX SCM.

Technologies: Python, pandas, scikit-learn (LinearRegression).
Capabilities:
- Can be run as a CLI tool: python demand_ml_service.py '<json_input>'
- Can read from stdin: python demand_ml_service.py
- Can be run as a lightweight HTTP server: python demand_ml_service.py --serve --port 5001
"""

import sys
import json
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def train_and_forecast(payload):
    """
    Given historical demand data, clean, validate, train Linear Regression,
    and generate 7, 15, 30, and 60-day demand forecasts along with ML evaluation metrics.
    """
    history = payload.get("history") or payload.get("historicalDemand") or []
    
    if not history or not isinstance(history, list):
        return {
            "status": "NO_DATA",
            "message": "No historical transaction data available for this product.",
            "forecast": {},
            "observationCount": 0
        }

    # Convert to DataFrame
    rows = []
    for item in history:
        if not isinstance(item, dict):
            continue
        date_val = item.get("date")
        qty_val = item.get("quantity")
        if date_val is not None and qty_val is not None:
            try:
                qty_num = float(qty_val)
                if qty_num >= 0:
                    rows.append({"date": str(date_val).strip(), "quantity": qty_num})
            except (ValueError, TypeError):
                continue

    if len(rows) < 3:
        return {
            "status": "INSUFFICIENT_DATA",
            "message": "Not enough historical data to generate a reliable forecast. At least 3 transaction periods are required.",
            "forecast": {},
            "observationCount": len(rows)
        }

    df = pd.DataFrame(rows)
    # Sort chronologically by date
    df = df.sort_values(by="date").reset_index(drop=True)

    # Feature X: time step index (0, 1, 2, ... N-1)
    n = len(df)
    X = np.arange(n).reshape(-1, 1)
    y = df["quantity"].values

    # Fit Linear Regression
    model = LinearRegression()
    model.fit(X, y)

    # In-sample predictions & Evaluation Metrics
    y_pred = model.predict(X)
    mae = float(mean_absolute_error(y, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y, y_pred)))
    
    # Calculate R2 (only meaningful if variance > 0)
    variance = np.var(y)
    if variance > 1e-6:
        r2 = float(r2_score(y, y_pred))
        # Bound R2 reasonably for display (can be negative if fit is worse than mean)
        r2 = max(-1.0, min(1.0, r2))
    else:
        r2 = 1.0

    # Forecasting future periods
    # Next period prediction (e.g. next month t = n)
    pred_next_month = float(model.predict(np.array([[n]]))[0])
    pred_month_plus_1 = float(model.predict(np.array([[n + 1]]))[0])

    # Ensure non-negative predictions
    pred_next_month = max(0.0, pred_next_month)
    pred_month_plus_1 = max(0.0, pred_month_plus_1)

    # Assume each historical step represents a 30-day monthly demand bucket:
    # Daily rate for upcoming month
    daily_rate = pred_next_month / 30.0

    demand_7_days = round(daily_rate * 7.0, 1)
    demand_15_days = round(daily_rate * 15.0, 1)
    demand_30_days = round(pred_next_month, 1)
    demand_60_days = round(pred_next_month + pred_month_plus_1, 1)

    return {
        "status": "SUCCESS",
        "modelName": "Linear Regression",
        "observationCount": n,
        "forecast": {
            "7Days": demand_7_days,
            "15Days": demand_15_days,
            "30Days": demand_30_days,
            "60Days": demand_60_days
        },
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2": round(r2, 4)
    }


class ForecastHTTPHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)
        try:
            payload = json.loads(post_data.decode("utf-8"))
            result = train_and_forecast(payload)
            response_code = 200
        except Exception as e:
            result = {"status": "ERROR", "message": str(e)}
            response_code = 400

        self.send_response(response_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        # Quiet logger
        pass


def run_server(port=5001):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, ForecastHTTPHandler)
    print(f"Demand ML Service listening on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DRAVIX SCM Demand Forecast ML Service")
    parser.add_argument("--serve", action="store_true", help="Run as HTTP microservice")
    parser.add_argument("--port", type=int, default=5001, help="Port for HTTP microservice")
    parser.add_argument("json_arg", nargs="?", help="Optional JSON string input")

    args = parser.parse_args()

    if args.serve:
        run_server(args.port)
    else:
        # CLI or stdin mode
        input_data = ""
        if args.json_arg:
            input_data = args.json_arg
        elif not sys.stdin.isatty():
            input_data = sys.stdin.read()

        if input_data.strip():
            try:
                payload = json.loads(input_data)
                result = train_and_forecast(payload)
                print(json.dumps(result))
            except Exception as ex:
                print(json.dumps({"status": "ERROR", "message": str(ex)}))
        else:
            print(json.dumps({"status": "ERROR", "message": "No input JSON provided"}))
