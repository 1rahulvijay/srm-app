from flask import Flask, render_template, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
import random
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_time_series():
    try:
        now = datetime.now()
        return [
            {
                "month_end": (now - timedelta(days=30 * i)).strftime("%b '%y"),
                "count_id": random.randint(100, 230),
                "count_gf": random.randint(80, 135),
                "count_gfc": random.randint(100, 210),
                "total_tf": round(random.uniform(2.5, 3.7), 2),
                "ocm_overall": round(random.uniform(1.5, 2.05), 2),
                "total_clients": random.randint(50, 150),
                "active_clients": random.randint(30, 100),
                "satisfaction": random.randint(60, 95),
                "tasks_completed": random.randint(200, 500),
                "avg_completion_time": random.randint(10, 30),
                "efficiency_rate": random.randint(70, 95),
                "overdue_tasks": random.randint(5, 20),
                "total_fte": random.randint(20, 60),
                "utilization": random.randint(60, 90),
                "overtime_hours": random.randint(10, 40),
            }
            for i in range(12, 0, -1)
        ]
    except Exception as e:
        logger.error(f"Error generating time series: {e}")
        return []

def generate_sankey_data():
    try:
        verticals = ["Retail", "Technology", "Education", "Finance", "Manufacturing", "Healthcare"]
        request_types = [
            "Inquiry", "Support", "Complaint", "Feedback", "Onboarding",
            "Billing", "Technical", "Consultation", "Escalation", "Training",
            "Refund", "Other"
        ]

        nodes = [{"name": name} for name in verticals] + [{"name": name} for name in request_types]
        links = []
        other_value = 0
        threshold = 10  # Aggregate links with value < 10 into "Other"

        for i, vertical in enumerate(verticals):
            selected_requests = random.sample(request_types, k=random.randint(8, 10))
            for request_type in selected_requests:
                value = random.randint(5, 50)
                if value < threshold and request_type != "Other":
                    other_value += value
                else:
                    links.append({
                        "source": i,
                        "target": len(verticals) + request_types.index(request_type),
                        "value": value if value >= threshold else 0
                    })

        # Add "Other" link if there’s aggregated value
        if other_value > 0:
            links.append({
                "source": random.randint(0, len(verticals) - 1),  # Random source for "Other"
                "target": len(verticals) + request_types.index("Other"),
                "value": other_value
            })

        while len(links) < 30:  # Reduced target to 30 links for less clutter
            source = random.randint(0, len(verticals) - 1)
            target = random.randint(len(verticals), len(nodes) - 1)
            value = random.randint(10, 50)  # Ensure values are above threshold
            if not any(link["source"] == source and link["target"] == target for link in links):
                links.append({"source": source, "target": target, "value": value})

        return {"nodes": nodes, "links": links}
    except Exception as e:
        logger.error(f"Error generating Sankey data: {e}")
        return {"nodes": [], "links": []}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/productivity")
def productivity():
    return render_template("productivity.html")

@app.route("/fte")
def fte():
    return render_template("fte.html")

@app.route("/sankey")
def sankey():
    return render_template("sankey.html")

@app.route("/combined")
def combined():
    return render_template("combined.html")

@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)

@app.route("/api/data")
def get_data():
    data = generate_time_series()
    if not data:
        logger.error("No data available for /api/data")
        return jsonify({"error": "No data available"}), 500
    current_month = data[0]
    prev_month = data[1] if len(data) > 1 else None
    trends = {
        "count_id_trend": "↑" if prev_month and current_month["count_id"] > prev_month["count_id"] else "↓",
        "count_gf_trend": "↑" if prev_month and current_month["count_gf"] > prev_month["count_gf"] else "↓",
        "count_gfc_trend": "↑" if prev_month and current_month["count_gfc"] > prev_month["count_gfc"] else "↓",
        "count_id_percent_change": round(((current_month["count_id"] - prev_month["count_id"]) / prev_month["count_id"]) * 100, 2) if prev_month and prev_month["count_id"] != 0 else 0,
        "count_gf_percent_change": round(((current_month["count_gf"] - prev_month["count_gf"]) / prev_month["count_gf"]) * 100, 2) if prev_month and prev_month["count_gf"] != 0 else 0,
        "count_gfc_percent_change": round(((current_month["count_gfc"] - prev_month["count_gfc"]) / prev_month["count_gfc"]) * 100, 2) if prev_month and prev_month["count_gfc"] != 0 else 0,
    }
    response = {
        "lineData": [{"label": d["month_end"], "value": d["count_id"]} for d in data],
        "barData": [{"label": d["month_end"], "value": d["count_gf"]} for d in data],
        "areaData": [{"label": d["month_end"], "value": d["count_gfc"]} for d in data],
        "scatterData": [{"label": d["month_end"], "total_tf": d["total_tf"], "ocm_overall": d["ocm_overall"]} for d in data],
        "metrics": {"current_metrics": {"count_id": current_month["count_id"], "count_gf": current_month["count_gf"], "count_gfc": current_month["count_gfc"], "trends": trends}},
    }
    logger.info(f"/api/data response: {response}")
    return jsonify(response)

@app.route("/api/productivity_data")
def get_productivity_data():
    data = generate_time_series()
    if not data:
        logger.error("No data available for /api/productivity_data")
        return jsonify({"error": "No data available"}), 500
    current_month = data[0]
    prev_month = data[1] if len(data) > 1 else None
    trends = {
        "tasks_completed_trend": "↑" if prev_month and current_month["tasks_completed"] > prev_month["tasks_completed"] else "↓",
        "avg_completion_time_trend": "↓" if prev_month and current_month["avg_completion_time"] < prev_month["avg_completion_time"] else "↑",
        "efficiency_rate_trend": "↑" if prev_month and current_month["efficiency_rate"] > prev_month["efficiency_rate"] else "↓",
        "tasks_completed_percent_change": round(((current_month["tasks_completed"] - prev_month["tasks_completed"]) / prev_month["tasks_completed"]) * 100, 2) if prev_month and prev_month["tasks_completed"] != 0 else 0,
        "avg_completion_time_percent_change": round(((current_month["avg_completion_time"] - prev_month["avg_completion_time"]) / prev_month["avg_completion_time"]) * 100, 2) if prev_month and prev_month["avg_completion_time"] != 0 else 0,
        "efficiency_rate_percent_change": round(((current_month["efficiency_rate"] - prev_month["efficiency_rate"]) / prev_month["efficiency_rate"]) * 100, 2) if prev_month and prev_month["efficiency_rate"] != 0 else 0,
    }
    response = {
        "lineData": [{"label": d["month_end"], "value": d["tasks_completed"]} for d in data],
        "barData": [{"label": d["month_end"], "value": d["avg_completion_time"]} for d in data],
        "areaData": [{"label": d["month_end"], "value": d["efficiency_rate"]} for d in data],
        "metrics": {"current_metrics": {"tasks_completed": current_month["tasks_completed"], "avg_completion_time": current_month["avg_completion_time"], "efficiency_rate": current_month["efficiency_rate"], "trends": trends}},
    }
    logger.info(f"/api/productivity_data response: {response}")
    return jsonify(response)

@app.route("/api/fte_data")
def get_fte_data():
    data = generate_time_series()
    if not data:
        logger.error("No data available for /api/fte_data")
        return jsonify({"error": "No data available"}), 500
    current_month = data[0]
    prev_month = data[1] if len(data) > 1 else None
    trends = {
        "total_fte_trend": "↑" if prev_month and current_month["total_fte"] > prev_month["total_fte"] else "↓",
        "utilization_trend": "↑" if prev_month and current_month["utilization"] > prev_month["utilization"] else "↓",
        "overtime_hours_trend": "↓" if prev_month and current_month["overtime_hours"] < prev_month["overtime_hours"] else "↑",
        "total_fte_percent_change": round(((current_month["total_fte"] - prev_month["total_fte"]) / prev_month["total_fte"]) * 100, 2) if prev_month and prev_month["total_fte"] != 0 else 0,
        "utilization_percent_change": round(((current_month["utilization"] - prev_month["utilization"]) / prev_month["utilization"]) * 100, 2) if prev_month and prev_month["utilization"] != 0 else 0,
        "overtime_hours_percent_change": round(((current_month["overtime_hours"] - prev_month["overtime_hours"]) / prev_month["overtime_hours"]) * 100, 2) if prev_month and prev_month["overtime_hours"] != 0 else 0,
    }
    response = {
        "lineData": [{"label": d["month_end"], "value": d["total_fte"]} for d in data],
        "barData": [{"label": d["month_end"], "value": d["utilization"]} for d in data],
        "areaData": [{"label": d["month_end"], "value": d["overtime_hours"]} for d in data],
        "metrics": {"current_metrics": {"total_fte": current_month["total_fte"], "utilization": current_month["utilization"], "overtime_hours": current_month["overtime_hours"], "trends": trends}},
    }
    logger.info(f"/api/fte_data response: {response}")
    return jsonify(response)

@app.route("/api/sankey_data")
def get_sankey_data():
    data = generate_sankey_data()
    if not data["nodes"] or not data["links"]:
        logger.error("No data available for /api/sankey_data")
        return jsonify({"error": "No data available"}), 500
    response = {"nodes": data["nodes"], "links": data["links"]}
    logger.info(f"/api/sankey_data response: {response}")
    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)