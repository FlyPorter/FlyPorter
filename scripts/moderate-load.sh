#!/bin/bash
# Moderate Load Generator - Triggers HPA scaling (60-70% CPU)
# Usage: ./moderate-load.sh [API_URL]

API_URL="${1:-https://api.flyporter.website/api}"

echo "=========================================="
echo "Moderate Load Test - HPA Trigger"
echo "=========================================="
echo "Target: 60-70% CPU usage"
echo "Expected: HPA scales from 2 to 3-4 replicas"
echo "API URL: $API_URL"
echo "=========================================="
echo ""

# Check if hey is installed
if ! command -v hey &> /dev/null; then
    echo "Error: 'hey' is not installed."
    echo "Install with: brew install hey (macOS) or download from https://github.com/rakyll/hey"
    exit 1
fi

echo "Starting load test..."
echo "Press Ctrl+C to stop"
echo ""

# Generate load: 10k requests, 50 concurrent, targeting multiple endpoints
hey -n 10000 -c 50 -m GET \
    -H "Accept: application/json" \
    "${API_URL}/health" \
    "${API_URL}/flight" \
    "${API_URL}/city" \
    "${API_URL}/airport"

echo ""
echo "=========================================="
echo "Load test complete!"
echo "Check HPA status: kubectl get hpa -n flyporter"
echo "Check pods: kubectl get pods -n flyporter -l app=flyporter-backend"
echo "=========================================="
