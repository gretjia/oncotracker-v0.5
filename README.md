Here is a comprehensive `README.md` file documenting the current state of the project. It follows industry-standard documentation practices (Google/Microsoft style guides) to ensure clarity for developers, product managers, and clinical stakeholders.

***

# Patient Journey Visualizer

![Version](https://img.shields.io/badge/version-v0.6.2-blue)
![Status](https://img.shields.io/badge/status-prototype-orange)

# OncoTracker v0.6.2

A single-file HTML visualization tool for longitudinal cancer treatment data.
Current Version: **v0.6.2**
A web-based visualization tool for tracking cancer treatment journeys, including chemotherapy cycles, clinical events, and tumor marker trends.

> [!IMPORTANT]
> **Full Stack Migration Roadmap:** We are transitioning from this HTML prototype to a robust full-stack application. See [PLAN.md](PLAN.md) for the detailed implementation plan covering React, Python, Open Source AI, and RBAC.

## Features

* **Timeline Visualization:** Interactive D3.js chart showing treatment cycles over time.
* **Metric Tracking:** Visualizes key tumor markers (CEA, CA19-9, etc.) with dual-axis support.
* **Event Logging:** Markers for surgeries, imaging, and other clinical events.
* **Scheme Details:** Detailed breakdown of chemotherapy regimens.
* **Responsive Design:** Tailwind CSS for a clean, modern UI.
* **Formal Dataset Support:** Now supports the standardized `formal_dataset.xlsx` structure.

* **Interactive Timeline**: Zoomable x-axis (time) with custom year brackets and month markers.

* **Smart Layout**:
  * **Split Header**: Phases and Schemes are organized in the top header.
  * **In-Chart Events**: Events are displayed as vertical labels inside the chart to maximize space.
  * **Data Clipping**: Strict clipping ensures data stays within the chart area.
  * **Settings Persistence**: Automatically saves user preferences (metrics, colors, view options) to local storage.
  * **Reset Option**: "Reset" button to clear saved settings and restore defaults.

## 2. Technical Architecture

### 2.1. Technology Stack

The application is built as a **Single-Page Application (SPA)** contained within a single HTML file for ease of portability and deployment.

* **Core Language:** HTML5, CSS3, JavaScript (ES6+).
* **Visualization Engine:** [D3.js (v7)](https://d3js.org/) - Handles SVG generation, scales, axis, and rendering logic.
* **Styling Framework:** [Tailwind CSS (v3.4)](https://tailwindcss.com/) - Utility-first CSS for responsive layout and typography.
* **Iconography:** [FontAwesome (v6)](https://fontawesome.com/) - UI icons.

### 2.2. Data Processing (Python Context)

*Note: While the current frontend is pure JavaScript, the data structure implies upstream processing.*

* **Upstream Processing:** Python (`pandas`, `json`) is used to convert raw clinical Excel/CSV files into the hierarchical JSON structure required by this frontend.
* **Abbreviation Mapping:** Automated mapping of treatment terms to standardized abbreviations via `library.md` during data processing.
* **Data Ingestion:** The frontend parses a JSON object containing `Unnamed` keys (artifacts from Pandas dataframe exports) and cleans them into semantic objects.

## 3. Features & Functionality

### 3.1. Visualization Layers

1. **Phases (Background):**
    * Renders treatment cycles (e.g., "C1", "AS0") with automatic "D1" suffix removal.
    * **Rainbow Coding:** Uses a cyclic color palette (Red/Orange/Yellow/Green/Cyan/Blue/Purple) with adjustable opacity to distinguish adjacent phases.
    * **Two-Line Labels:** Phase labels display cycle name on first line (e.g., "C1") and duration on second line in English (e.g., "21 days") with smaller font.
    * **Scheme Display:** Treatment schemes are split into multiple lines and centered below the cycle label.
    * **Semantic Highlighting:** Surgery phases use a distinct red tint.
2. **Events (Vertical Markers):**
    * Dashed vertical lines representing specific medical events (e.g., "Laparoscopy").
    * **Smart Labeling:** Labels are placed at the **top** of the chart, rotated **45 degrees** to prevent overlap and maximize chart area.
3. **Clinical Indicators (Curves):**
    * Renders quantitative data (CEA, CA125, Weight, etc.) as smooth Catmull-Rom curves.
    * **Solid Data Points:** All data points are rendered as solid circles for better visibility.
    * **Value Labels:** Optional numeric labels can be displayed above each data point via toggle button in metric controls.
    * **Alert System:** Automatically parses thresholds (e.g., `<35`) from metadata. Values exceeding thresholds are rendered as **Solid Red Pulsing Dots**.

### 3.2. Interactive Controls

The application features a fixed split-pane layout with the chart occupying the top ~66% and controls at the bottom.

    * Mouse wheel zoom is disabled to prevent accidental triggering.

* **Axes:** Left Y-axis (0-100 scale), bottom X-axis showing months with intermediate ticks and year labels below.
* **Tooltips:** Hovering over data points reveals Date, Phase context, Value, and Threshold status.
* **Control Panel (Bottom):**
  * **Grid Layout:** Responsive grid (1-4 columns) adapting to mobile/desktop.
  * **Collapsible Cards:** Each metric has a control card.
    * **Collapsed:** Shows Name, Unit, Color indicator (—●— style), and Range.
    * **Expanded:** Reveals slider controls.
  * **Fine-Tuning:**
    * **Scale:** Vertical multiplication factor (adaptive range).
    * **Shift:** Vertical offset (-200 to +200).
    * **Opacity:** Adjust transparency (0.1 to 1.0).
    * **Line Toggle:** Switch between Line Chart and Scatter Plot.
    * **Value Labels Toggle:** Show/hide numeric values on data points ("显示数值" / "隐藏数值").
  * **Color Picker:** Native HTML5 color input for live customization.

### 3.3. Mobile & Print Optimization

* **Responsive Layout:**
  * **Desktop:** Fixed split view with chart on top and controls at bottom.
  * **Mobile:** Dynamic viewport height (`100dvh`), touch-action management to separate chart panning from page scrolling.
* **Print Mode (A4 Landscape):**
  * CSS `@media print` rules hide UI controls (buttons, scrollbars).
  * Forces background color printing.
  * Optimizes text size and contrast for physical paper output.

## 4. Data Structure Definition

The application expects a JSON object named `sourceData`. The parser `processData()` handles the following schema:

```json
{
  "ProjectName": [
    { ... }, // Row 0-5: Metadata (Skipped)
    { "Unnamed: 7": "Weight", "Unnamed: 10": "MRD" ... }, // Row 6: Headers
    { "Unnamed: 7": "KG", "Unnamed: 17": "<35" ... },    // Row 7: Units & Thresholds
    { "Unnamed: 0": "2024-06-06", "Unnamed: 1": "PhaseName", "Unnamed: 7": "45.6" ... } // Row 8+: Data
  ]
}
```

## 5. Function Call Hierarchy

The logic is encapsulated in a global `AppState` object and functional components.

### Initialization

1. `processData()`:
    * Reads raw JSON.
    * Extracts Headers and Units.
    * Parses **Thresholds** via RegEx (`/[<>]\s*([\d\.]+)/`).
    * Iterates rows to build `AppState.data.timeline`, `metrics`, and `events`.
    * Calculates Phase durations.
2. `renderControls()`:
    * Generates HTML for the bottom control panel.
    * Binds click events for Expansion, Toggling, and Sliders.
3. `initChart()`:
    * Calculates SVG dimensions.
    * Sets up D3 Scales (`scaleTime`, `scaleLinear`).
    * Initializes D3 Zoom behavior.

### Rendering Cycle

* `drawChart(fullInit)`: Main entry point for rendering.
* `updateChart(rescaledX)`:
  * **Layer 1:** Draws Phase Rectangles + Text Labels (Center aligned).
  * **Layer 2:** Draws Event Dashed Lines + 45° Top Labels.
  * **Layer 3:** Draws Metrics.
    * Applies `customY` calculation based on user Scale/Shift.
    * Draws `path` (Spline).
    * Draws `circle` (Logic: Red/Pulse if `isAlert`, else White).

### Interaction Handlers

* `zoomChart(factor)` / `resetChartZoom()`: Programmatic zooming.
* `toggleMetric()`, `updateScale()`, `updateOffset()`: Reactively updates `AppState` and calls `drawChart(false)`.
* `initResizer()`: Handles the DOM drag events to adjust the height ratio between Chart and Controls.

## 6. UI Design Principles (Implemented)

1. **Clarity:** High-contrast "Light Mode" ensures readability on screens and paper.
2. **Information Hierarchy:**
    * Primary: Trends (Curves) and Anomalies (Red Dots).
    * Secondary: Context (Phases, Events).
    * Tertiary: Interaction controls (Hidden by default in collapsed cards).
3. **Safety:**
    * **Strict Clipping:** Data curves are clipped at the top margin (y=65) to prevent overlapping with phase labels.
    * **Prevention:** Mouse wheel zoom disabled to prevent accidental triggering during page scrolling.

## 7. Usage Guide

1. **Open:** Simply open `oncotracker v0.5.6.html` in any modern browser (Chrome, Edge, Safari).
2. **View:**
    * **Red Dots:** Indicate values exceeding medical thresholds.
    * **Phase Labels:** Show Cycle name + Duration (e.g., "C1 (21天)") with multi-line scheme names.
    * **X-Axis:** Monthly labels with mid-month tick marks and year labels below.
3. **Interact:**
    * **Legend:** Click legend items in the toolbar to toggle metric visibility.
    * **Opacity Slider:** Adjust phase background transparency using the "背景透明度" slider.
    * **Zoom:** Use "横纵比：+ -" buttons or "全病程" to reset view.
    * **Metric Cards:** Click a card in the bottom panel to expand fine-tuning controls.
    * **Adjust:** Use sliders to Shift (-200 to +200) or Scale specific curves.
4. **Print:** Click the "Print" button in the header for a clean A4 report.
5. **Reset:** Click the "Reset" button to clear all saved customizations and restore default settings.

## 8. Future Roadmap

* [ ] **Python Backend:** Create a Flask/FastAPI wrapper to serve dynamic JSON.
* [ ] **Data Export:** Button to export current view as PNG/PDF image.
* [ ] **Annotation:** Allow doctors to click and add text notes to specific data points.

## 9. Localization & Terminology

To maintain consistency across future updates, the following tables define the standard Chinese/English mappings used in the project.

### 9.1. UI Interface

| Chinese (UI) | English (Internal/Meaning) | Context |
| :--- | :--- | :--- |
| **背景透明度** | Phase Opacity | Slider in toolbar to adjust background transparency. |
| **横纵比** | Aspect Ratio (X) / Zoom X | Horizontal zoom controls. |
| **纵横比** | Aspect Ratio (Y) / Zoom Y | Vertical height controls. |
| **全病程** | Full Course / Reset | Button to reset X-axis zoom to show all data. |
| **自适应** | Auto Fit | Button to reset Y-axis height to default. |
| **周期** | Cycle | Toggle for showing/hiding cycle phases. |
| **项目** | Item / Event | Toggle for showing/hiding medical events. |
| **方案** | Scheme | Toggle for showing/hiding treatment schemes. |
| **显示数值** | Show Values | Button to show numeric labels on data points. |
| **隐藏数值** | Hide Values | Button to hide numeric labels on data points. |

### 9.2. Common Data Keys

| Chinese (Data) | English (Medical/System) | Notes |
| :--- | :--- | :--- |
| **体重** | Weight | Default active metric. |
| **握力** | Grip Strength | |
| **白细胞** | White Blood Cells (WBC) | |
| **血小板** | Platelets (PLT) | |
| **中性粒细胞** | Neutrophils (NEUT) | |
| **谷草转氨酶** | AST | |
| **谷丙转氨酶** | ALT | |
| **新辅助** | Neoadjuvant | Treatment phase type. |
| **辅助** | Adjuvant | Treatment phase type. |
| **术** | Surgery | Suffix indicating surgery (e.g., 胃癌根治术). |

---
*Documentation generated by Assistant based on project codebase version `2025-11-24`.*
