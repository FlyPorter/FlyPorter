#!/bin/bash
# High Load Generator - Triggers HPA scaling AND Prometheus alerts (70-90% CPU)
# Usage: ./high-load.sh [API_URL] [duration_seconds] [concurrency]
# Notes:
# - hey only accepts a single URL per run. To hit multiple endpoints we spawn
#   multiple hey processes in parallel, each with the same concurrency level.
# - By default this script runs for a duration (-z) instead of a fixed request
#   count so you get sustained load for the demo.

set -euo pipefail

API_URL="${1:-https://api.flyporter.website/api}"
DURATION="${2:-360}"    # seconds of sustained load (defaults to 6 minutes to satisfy 5m alert windows)
CONCURRENCY="${3:-80}"  # concurrent workers per endpoint

# Optional quick demo mode: set FAST_DEMO=1 to force a short run
if [[ "${FAST_DEMO:-}" == "1" ]]; then
  DURATION=20  # ~20s for fast demo; good for a quick HPA-only showcase
  echo "FAST_DEMO enabled: duration forced to ${DURATION}s (alerts with 5m windows will NOT fire)."
fi

ENDPOINTS=(
  health
  flight
  city
  airport
  route
)

echo "=========================================="
echo "High Load Test - HPA + Alert Trigger"
echo "=========================================="
echo "Target: 70-90% CPU usage"
echo "Expected:"
echo "  - HPA scales to max replicas (4)"
echo "  - Prometheus HighCPUUsage alert fires (>70% for 5min)"
echo "  - May trigger CriticalCPUUsage alert (>90% for 3min)"
echo "API URL: ${API_URL}"
echo "Duration: ${DURATION}s"
echo "Concurrency per endpoint: ${CONCURRENCY}"
echo "Endpoints: ${ENDPOINTS[*]}"
echo "=========================================="
echo ""

# Check if hey is installed
if ! command -v hey >/dev/null 2>&1; then
  echo "Error: 'hey' is not installed."
  echo "Install with: brew install hey (macOS) or download from https://github.com/rakyll/hey"
  exit 1
fi

echo "Starting high load test..."
echo "Running hey with -z ${DURATION}s on each endpoint in parallel."
echo "Press Ctrl+C to stop early."
echo ""

PIDS=()
LOG_DIR="$(mktemp -d /tmp/high-load-logs-XXXXXX)"

for ep in "${ENDPOINTS[@]}"; do
  URL="${API_URL}/${ep}"
  LOG_FILE="${LOG_DIR}/hey-${ep}.log"
  echo "Launching load for endpoint: ${URL}"
  # Run hey for a fixed duration to sustain load
  hey -z "${DURATION}s" -c "${CONCURRENCY}" -m GET \
    -H "Accept: application/json" \
    "${URL}" > "${LOG_FILE}" 2>&1 &
  PIDS+=($!)
done

# Wait for all hey processes to finish
FAIL=0
for pid in "${PIDS[@]}"; do
  if ! wait "${pid}"; then
    FAIL=1
  fi
done

echo ""
echo "=========================================="
echo "High load test complete!"
echo ""

# Show a brief summary from each hey run
for ep in "${ENDPOINTS[@]}"; do
  LOG_FILE="${LOG_DIR}/hey-${ep}.log"
  if [[ -f "${LOG_FILE}" ]]; then
    echo "---- ${ep} summary ----"
    # Pull the Summary section from hey output
    awk '/^Summary:/{flag=1} flag{print}' "${LOG_FILE}"
    echo ""
  fi
done

if [[ "${FAIL}" -ne 0 ]]; then
  echo "One or more load generators exited with non-zero status. Check logs in ${LOG_DIR}."
else
  # Clean up logs to avoid clutter; comment out if you want to inspect raw output
  rm -rf "${LOG_DIR}"
fi

echo "Check Prometheus alerts:"
echo "  - Port-forward: kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090"
echo "  - Open: http://localhost:9090/alerts"
echo ""
echo "Check HPA status:"
echo "  kubectl get hpa -n flyporter -w"
echo ""
echo "Check pod metrics:"
echo "  kubectl top pods -n flyporter -l app=flyporter-backend"
echo "=========================================="
