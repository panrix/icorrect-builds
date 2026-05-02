#!/bin/bash
# pdf-to-images.sh — Convert PDF pages to PNG images for agent viewing
# Usage: pdf-to-images.sh <pdf_path> [page_range] [dpi]
#
# Examples:
#   pdf-to-images.sh schematic.pdf           # All pages, 200 DPI
#   pdf-to-images.sh schematic.pdf 1-5       # Pages 1-5
#   pdf-to-images.sh schematic.pdf 3         # Page 3 only
#   pdf-to-images.sh schematic.pdf 30-50 300 # Pages 30-50 at 300 DPI
#
# Output: PNG files in /tmp/pdf-images/<basename>/
# Returns: List of output file paths (one per line)

set -euo pipefail

PDF_PATH="${1:-}"
PAGE_RANGE="${2:-all}"
DPI="${3:-200}"

if [ -z "$PDF_PATH" ]; then
    echo "Error: No PDF path provided" >&2
    echo "Usage: pdf-to-images.sh <pdf_path> [page_range] [dpi]" >&2
    exit 1
fi

if [ ! -f "$PDF_PATH" ]; then
    echo "Error: File not found: $PDF_PATH" >&2
    exit 1
fi

# Get page count
PAGE_COUNT=$(pdfinfo "$PDF_PATH" 2>/dev/null | grep "^Pages:" | awk '{print $2}')
if [ -z "$PAGE_COUNT" ]; then
    echo "Error: Could not determine page count" >&2
    exit 1
fi

# Create output directory based on PDF filename
BASENAME=$(basename "$PDF_PATH" .pdf)
OUTPUT_DIR="/tmp/pdf-images/${BASENAME}"
mkdir -p "$OUTPUT_DIR"

# Parse page range
if [ "$PAGE_RANGE" = "all" ]; then
    FIRST_PAGE=1
    LAST_PAGE=$PAGE_COUNT
elif [[ "$PAGE_RANGE" =~ ^([0-9]+)-([0-9]+)$ ]]; then
    FIRST_PAGE=${BASH_REMATCH[1]}
    LAST_PAGE=${BASH_REMATCH[2]}
elif [[ "$PAGE_RANGE" =~ ^([0-9]+)$ ]]; then
    FIRST_PAGE=${BASH_REMATCH[1]}
    LAST_PAGE=${BASH_REMATCH[1]}
else
    echo "Error: Invalid page range '$PAGE_RANGE'. Use: all, N, or N-M" >&2
    exit 1
fi

# Clamp to actual page count
if [ "$LAST_PAGE" -gt "$PAGE_COUNT" ]; then
    LAST_PAGE=$PAGE_COUNT
fi

if [ "$FIRST_PAGE" -lt 1 ]; then
    FIRST_PAGE=1
fi

if [ "$FIRST_PAGE" -gt "$PAGE_COUNT" ]; then
    echo "Error: Start page $FIRST_PAGE exceeds total pages ($PAGE_COUNT)" >&2
    exit 1
fi

TOTAL=$((LAST_PAGE - FIRST_PAGE + 1))
echo "Converting $TOTAL page(s) from '$BASENAME' (pages $FIRST_PAGE-$LAST_PAGE of $PAGE_COUNT) at ${DPI} DPI..." >&2

# Convert using pdftoppm
pdftoppm -png -r "$DPI" -f "$FIRST_PAGE" -l "$LAST_PAGE" "$PDF_PATH" "$OUTPUT_DIR/page"

# List output files
OUTPUT_FILES=$(ls "$OUTPUT_DIR"/page-*.png 2>/dev/null | sort -V)

if [ -z "$OUTPUT_FILES" ]; then
    echo "Error: No images generated" >&2
    exit 1
fi

COUNT=$(echo "$OUTPUT_FILES" | wc -l)
echo "Generated $COUNT image(s) in $OUTPUT_DIR" >&2

# Output file paths to stdout (for agent consumption)
echo "$OUTPUT_FILES"
