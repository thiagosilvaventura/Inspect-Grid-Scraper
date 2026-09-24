# Inspect Grid Scraper

A standalone, zero-dependency browser snippet that overlays a $3 \times 3$ interactive grid over any webpage to extract text, capture screenshots, parse DOM elements, and perform reverse visual searches based on spatial coordinates.

<img width="1023" height="505" alt="image" src="https://github.com/user-attachments/assets/382c8587-164b-4b94-892e-5df738d8effd" />


## 📌 Overview

Inspect Grid Scraper executes directly within the browser's Developer Console. It renders a fixed $3 \times 3$ viewport overlay alongside a floating control panel, allowing users to map specific page regions to predefined extraction routines using color coding.

---

## 🎨 Color-Coded Action Matrix

| Color | Action Type | Output Format | Description |
| :--- | :--- | :--- | :--- |
| 🔵 **Blue** | Text Extraction | `.csv` | Collects all unique inner text from DOM elements within the selected quadrant. |
| 🟢 **Green** | Quadrant Screenshot | `.zip` (PNGs) | Captures a targeted visual snippet of the quadrant. |
| 🔴 **Red** | Full Extraction | `.zip` (PNG + TXT) | Extracts both raw text and visual screenshots from the selected region. |
| 🟡 **Yellow** | DOM Analysis | `.json` | Parses links (`<a>`), buttons (`<button>`), and raw HTML snippets. |
| 🟣 **Purple** | Search Integration | Web Tabs | Sends extracted text to Google Search and screenshots to Google Lens. |
| ⚪ **Clear** | Reset | N/A | Removes the color assignment and mapped action from the quadrant. |

---

🚀 Execution Guide
Open any target web page in your web browser.

Open Developer Tools (F12 or Ctrl+Shift+I / Cmd+Option+I).

Navigate to the Console tab.

Paste the complete inspect_grid_scraper.js source code and press Enter.

Select a quadrant in the floating window, pick an action color, and click Run Scrap.

🛡️ Compatibility & Security
CSP Compliance: Does not load external resources via script tags or remote CDNs.

Iframe & Permission Isolation: Handles sites with restricted display-capture policies via headless canvas fallbacks.

Memory Management: Cleans up previous DOM overlays and revokes ObjectURL references post-export.



## 🏗️ Technical Architecture & Methods
#### 1. DOM Instance Lifecycle & State Management
* **Instance Garbage Collection:** Upon execution, the script queries the DOM tree for pre-existing elements (`#__ig_modal`, `#__ig_fullscreen`, `#__ig_styles`) and unbinds active event listeners before removal to prevent memory leaks or dual-instance conflicts.
* **State Encapsulation:** Quadrant mappings, active color states (`quadrantColors[9]`), and event logs are maintained in private scoped memory inside the IIFE scope rather than attached to the global `window` object.

#### 2. Spatial Mapping & Coordinate Geometry (`getElementsInRect`)
* **Viewport Partitioning:** The browser viewport is dynamically mapped to a $3 \times 3$ matrix using standard CSS Grid layout ($1\text{fr}$ columns and rows), scaling synchronously with `window.innerWidth` and `window.innerHeight`.
* **Bounding Intersection Check:** To determine which elements belong to a quadrant, the engine queries DOM nodes via `document.body.querySelectorAll('*')` and evaluates spatial collision using Axis-Aligned Bounding Box (AABB) checks:

$$r_{\text{top}} < \text{rect}_{\text{bottom}} \;\land\; r_{\text{bottom}} > \text{rect}_{\text{top}} \;\land\; r_{\text{left}} < \text{rect}_{\text{right}} \;\land\; r_{\text{right}} > \text{rect}_{\text{left}}$$

```javascript
function getElementsInRect(rect) {
  const elements = [];
  const all = document.body.querySelectorAll('*');
  all.forEach(el => {
    if (modal.contains(el) || fullscreenGrid.contains(el)) return;
    const r = el.getBoundingClientRect();
    if (
      r.top < rect.bottom &&
      r.bottom > rect.top &&
      r.left < rect.right &&
      r.right > rect.left &&
      r.width > 0 &&
      r.height > 0
    ) {
      elements.push(el);
    }
  });
  return elements;
}


