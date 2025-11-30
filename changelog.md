# Changelog - Patient Journey Visualizer

## v0.6.2 (2025-11-30)

- **Print Layout Optimization**:
  - **Maximized Extension**: The chart now extends to fill the entire A4 Landscape page (0mm margins, 100% height).
  - **Zoom Preservation**: The printed chart now respects the current "Aspect Ratio" (Zoom Level) seen on screen, ensuring the visible time range is preserved.
  - **Legend Visibility**: Restored the "Active" legend in print mode while keeping other UI controls (Zoom, Opacity) hidden.
- **Bug Fixes**:
  - Fixed a critical issue where the chart would disappear due to missing initialization code.
  - Resolved syntax errors in `AppState` and `initChart` definitions.

### Data Automation

- **Update Script**: Created `update_data.sh` and `update_data.py` to automate the process of loading new datasets into the HTML application.
- **Dataset Update**: Loaded `dataset251130_2.xlsx` into `oncotracker v0.6.2.html`.

## v0.6.1 (2025-11-27)

### Major Feature: Settings Persistence

- **Feature**: Implemented `localStorage` support to automatically save and restore all user customizations (metrics scaling, colors, view toggles, opacity) across browser sessions.
- **Bug Fix & Resolution**:
  - *Issue*: Initially, default metric settings (e.g., auto-enabling "Weight") were overwriting user preferences upon reload, causing users to lose their active metric selections.
  - *Fix*: Refactored the initialization logic to check for saved settings *first*. Default metrics are now only activated if **no saved settings exist**. This ensures user choices are always respected.
  - *Safety*: Added a `try-catch` block around storage access to prevent application crashes in private browsing modes or environments where `localStorage` is disabled.
- **Recovery**: Added a **"Reset"** button in the header (next to Print) to manually clear corrupted or unwanted settings and restore the application to its factory default state.

### Data Updates

- **Dataset Integration**: Updated patient data with `dataset_update.xlsx`.
- **Abbreviation Mapping**: Implemented `library.md` to automatically map long treatment names to standardized abbreviations (e.g., "Nab-Paclitaxel" -> "nab-PTX").
- **Data Correction**: Fixed a date typo in the source dataset (2024-05-10 -> 2025-05-10) that caused incorrect phase ordering.

### Phase & Cycle Logic

- **Label Refinement**: Simplified phase labels to display only the cycle number (e.g., "C1" instead of "C1Dx") and centered them in the header.
- **Cycle Merging**: Improved phase creation logic to merge multiple data points within the same cycle (e.g., C0D1, C0D8) into a single continuous phase block.
- **Phase Continuity**: Prevented intermediate non-cycle rows (except surgeries) from splitting active cycle phases.

### Visual Improvements

- **Event Label Positioning**: Added a 4-pixel offset to event labels to prevent text from overlapping with the vertical dotted lines.

### Bug Fixes

- **Chart Visibility**: Resolved a syntax error in the `drawChart` function that prevented the chart from rendering.

---

## [v0.5.7] - 2025-11-27

### Added

- **Enhanced Year Axis**: Implemented a custom x-axis for years with bracket-style indicators (`<--- 2024 --->`) and vertical tick marks at year boundaries (Jan 1st) for better temporal distinction.
- **In-Chart Event Labels**: Moved event labels inside the chart area to resolve header overlap issues. Labels are now vertical (top-to-bottom), transparent (no background), and styled to match Scheme labels (7.5px, Slate-600).
- **Data Clipping**: Enforced strict data clipping at y=100 to prevent chart lines and points from drawing over the header area.

## [v0.5.6] - 2025-11-245

- **Event Exclusion**: Fixed logic to prevent events (e.g., "腹腔镜探查") from being incorrectly rendered as phases, while ensuring phases with valid cycles (e.g., "C0") are still displayed.
- **Layering**: Optimized chart rendering order to ensure data points (dots) and value labels are always drawn on top of data lines.

### UI/UX Improvements

- **Header Layout**:
  - Added a visual separator line between the header and chart body.
  - Moved Cycle Name, Duration, and Scheme labels into the dedicated header area.
  - Adjusted top margin to 85px to accommodate the new layout.
- **Print View**:
  - Customized print styles to hide the sidebar, opacity slider, and zoom controls.
  - Ensures only the Title, Chart, and Active Legend are visible when printing.

---

## [v0.5.5] - 2025-11-25

### Bug Fixes & Improvements

- **Metric Controls**:
  - **Centered Scaling**: Implemented centered scaling logic. Scaling now expands/contracts data around its center point rather than zero, preventing visual "shifting" when scaling high-value metrics like Weight.
  - **Expanded Shift Range**: Increased the "Shift" slider range from [-50, +50] to [-200, +200] to accommodate metrics with larger baseline offsets.
- **Event Labels**:
  - **Restored Visibility**: Moved event labels ("项目") to a new unclipped layer, ensuring they are visible in the top margin area.
  - **Positioning**: Restored the classic design with labels at the top, rotated 45 degrees.

### New Features

- **Value Labels Display**: Added individual toggle button ("显示数值/隐藏数值") in each metric's expanded control card to show/hide numeric values above data points on the chart.
- **Y-Axis Height Controls**: New "纵横比" control section in toolbar to dynamically adjust chart container height:
  - [+] / [-] buttons to increase/decrease chart area height
  - "自适应" button to reset to default height ratio
  - Visual distinction with blue background tint and vertical arrows icon (↕)

### Visual Enhancements

- **Phase Label Formatting**: Reformatted phase labels to two-line display:
  - Line 1: Cycle name (e.g., "C1") in bold 9px font
  - Line 2: Duration in English (e.g., "21 days") in smaller 8px font, matching scheme text style
- **Directional Icons**: Added horizontal arrows icon (↔) to "横纵比" controls for better visual distinction

### Layout Optimization

- **Increased Chart Area**: Reduced top margin from 65px to 45px, adding 20px more vertical space for data display
- **Improved Space Utilization**: Better use of available screen area with minimal white space at top

### Bug Fixes

- **Value Labels Cleanup**: Fixed issue where value labels weren't removed from chart when toggling off the "显示数值" feature

---

## [v0.5.4] - 2025-11-25

---

## [v0.5.3] - 2025-11-24

### Visual Enhancements

- **Rainbow Cycle Background**: Treatment phases now cycle through a rainbow color spectrum (Red, Orange, Yellow, Green, Cyan, Blue, Purple) for better visual distinction.
- **Solid Data Points**: Data points are now rendered as solid circles instead of hollow rings.
- **Strict Clipping**: Data curves are strictly clipped at the top margin to prevent overlapping with cycle labels.
- **Legend Styling**: Updated legend items to a clean "Line + Dot" style (—●—) with increased spacing and removed pill-shaped borders.

### Layout & Axis

- **Fixed Layout**: Removed the draggable split-pane. The chart is now fixed at the top (~66%) with controls at the bottom, improving stability.
- **Y-Axis Restoration**: Restored the vertical Y-axis on the left side (0-100 scale).
- **Custom Date Axis**:
  - Primary X-axis now shows Month labels (e.g., "06", "07").
  - Year labels (e.g., "2024") are displayed separately below the month axis.
  - Added intermediate tick marks (without labels) to indicate mid-month points.

### Interaction & Controls

- **Phase Opacity Control**: Added a "背景透明度" (Background Opacity) slider in the toolbar to adjust the transparency of phase backgrounds.
- **Zoom Controls**:
  - Added Chinese labels "横纵比：" to zoom buttons.
  - Renamed "Auto" button to "全病程".
- **Scroll Zoom Disabled**: Disabled mouse wheel zooming to prevent accidental view changes while scrolling the page.
- **Legend Interaction**: Simplified legend interaction to pure text clicking.
- **Shift Slider Range**: Expanded the metric "Shift" slider range to -50 to +50 for better curve adjustment.

### Data Processing

- **Cycle Naming**: Automatically removes "D1" suffix from cycle names (e.g., "C1D1" -> "C1").
- **Scheme Display**: Scheme names are now split into multiple lines and centered below the cycle label.
- **MRD Data Parsing**: Updated logic to parse all "Unnamed" columns, ensuring metrics like "aMRD" are correctly visualized.
