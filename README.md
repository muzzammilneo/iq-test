# Cognitive Assessment Battery — WAIS-IV Style IQ Practice Test

A premium, interactive React-based cognitive assessment application built with Vite. It features a complete rewrite modeled on the **Wechsler Adult Intelligence Scale (WAIS-IV)** clinical battery, assessing four core cognitive domains using ten specialized subtests. The application calculates age-normed scaled and index scores, displaying a comprehensive clinical-style results dashboard with discrepancy analysis, profile charts, and cognitive trajectory analysis.

## Core Cognitive Areas & Subtests

The assessment is divided into **4 Cognitive Indices** containing **10 distinct subtests** (approx. 40 total items):

### 1. Verbal Comprehension Index (VCI)
Measures the ability to understand, analyze, and apply language-based information (crystallized intelligence).
- **Similarities**: Pick the most abstract logical connection between two words.
- **Vocabulary**: Select the correct definition for advanced words.
- **Information**: Answer general factual knowledge questions.

### 2. Perceptual Reasoning Index (PRI)
Tests fluid intelligence and the ability to solve abstract, visual problems without language.
- **Block Design**: Replicate geometric red-and-white patterns using an interactive grid under a time limit (supports speed bonuses).
- **Matrix Reasoning**: Complete logical geometric pattern sequences in a 3×3 matrix.
- **Visual Puzzles**: Select exactly 3 of 6 pieces that combine to reconstruct a target shape.

### 3. Working Memory Index (WMI)
Measures the capacity to temporarily hold and manipulate information.
- **Digit Span**: Recall a sequence of flashing numbers in the same order (Forward) and in reverse order (Backward).
- **Arithmetic**: Solve timed mental math word problems without paper or calculators.

### 4. Processing Speed Index (PSI)
Tests the speed and accuracy of visual scanning and processing.
- **Symbol Search**: Timed 90-second session to verify if target symbols appear in rows of abstract shapes.
- **Coding**: Timed 120-second session pairing numbers with abstract symbols according to a legend key.

---

## Key Features

- **Age-Normed Scoring**: Correctly norms raw scores against one of 11 age brackets (from 16 to 75+). Since fluid abilities decline with age and crystallized abilities remain stable, your final score is compared only to your peers. An IQ of 100 always represents the exact average for your age.
- **Results Dashboard**:
  - **Full-Scale IQ (FSIQ)**: Displayed with a 95% confidence interval and percentile rank.
  - **Four Composite Indices**: Standalone scores (Mean = 100, SD = 15) for VCI, PRI, WMI, and PSI.
  - **Index Profile Chart**: Graphical comparison of your scores relative to the average population.
  - **Cognitive Trajectory**: Visual analysis comparing crystallized intelligence (VCI) vs. fluid intelligence (PRI + PSI) against normal age curves.
  - **Discrepancy Analysis**: Identifies statistically significant differences (>15 points) between indices and provides clinical context.
- **Premium Aesthetics**: Features a rich dark-mode theme, smooth micro-animations, progress indicators, and custom SVG shape rendering.

---

## Tech Stack

- **Core**: React, Vite
- **Styling**: Vanilla CSS (`src/index.css`) + Premium inline-styled components
- **Graphics**: Pure SVG-based shape and symbol generators

---

## Getting Started

### Prerequisites

Make sure you have Node.js installed on your system.

### Installation

1. Install package dependencies:
   ```bash
   npm install
   ```

### Development

Start the local development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

### Production Build

To compile a production build:
   ```bash
   npm run build
   ```
   This generates ready-to-deploy static assets in the `dist/` directory.
