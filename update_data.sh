#!/bin/bash

# Find the latest dataset file (by modification time)
# We filter for dataset*.xlsx to avoid picking up other random excel files if any
LATEST_DATASET=$(ls -t dataset*.xlsx | head -n 1)

# Find the latest HTML file (by modification time)
LATEST_HTML=$(ls -t oncotracker\ v*.html | head -n 1)

if [ -z "$LATEST_DATASET" ]; then
    echo "No dataset file found."
    exit 1
fi

if [ -z "$LATEST_HTML" ]; then
    echo "No HTML file found."
    exit 1
fi

echo "Latest dataset: $LATEST_DATASET"
echo "Latest HTML: $LATEST_HTML"

echo "Updating..."
python3 update_data.py "$LATEST_DATASET" "$LATEST_HTML"
