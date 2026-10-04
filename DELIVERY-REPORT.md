# Digital Electronics Interactive Lab Simulator (CMP 203)
**Padre Conceição College of Engineering • Department of Computer Engineering**

---

### Executive Summary

The **Digital Electronics Lab Simulator** is an interactive, browser-based laboratory trainer designed and built directly from the uploaded 18-page college laboratory manual and the 2D vector breadboard visual reference (`2D_Circuit-Blink-Build-Instructions-Step-7-345x500.png`). 

It provides an authentic, deterministic simulation environment where the digital circuits actually simulate in real-time, backed by a custom, zero-external-dependency digital logic engine.

---

### Core Architecture & "Single Source of Truth"

All user interactions, visual representations, pedagogical walkthroughs, and assessments stem from one authoritative logic engine:

```
                          ┌────────────────────────┐
                          │ User Toggle / Netlist  │
                          └───────────┬────────────┘
                                      ▼
                      ┌─────────────────────────────────┐
                      │   Circuit Simulation Engine     │
                      │  - Topological Net Evaluation   │
                      │  - IC Pinout & Propagation Map  │
                      │  - Contention & Float Detection │
                      └───────────────┬─────────────────┘
                                      │
         ┌────────────────────────────┼───────────────────────────┐
         ▼                            ▼                           ▼
┌──────────────────┐         ┌──────────────────┐        ┌──────────────────┐
│ Breadboard SVG   │         │ Bidirectional    │        │ Step-by-Step     │
│ - 30-Row Canvas  │         │ Truth Table      │        │ Circuit Walkthru │
│ - 5V/0V Glowing  │         │ - Active Row     │        │ - Highlighting   │
│   Jumper Wires   │         │   Highlight      │        │ - Math Derivation│
│ - DIP IC Pins    │         │ - Click to Apply │        │ - Auto-Play Mode │
│ - Rocker Switches│         └──────────────────┘        └──────────────────┘
│ - Diffused LEDs  │
└──────────────────┘
```

---

### Complete Coverage of All 6 Laboratory Experiments

| Exp # | Experiment Title | ICs / Components | Variants / Subcircuits Covered |
| :---: | :--- | :--- | :--- |
| **1** | **Study of Logic Gates** | IC 7404 (Hex NOT)<br>IC 7408 (Quad AND)<br>IC 7432 (Quad OR)<br>IC 7400 (Quad NAND)<br>IC 7402 (Quad NOR)<br>IC 7486 (Quad XOR) | 6 dedicated subcircuits verifying all primary and derived gate truth tables. Includes IC 7402 inverted pinout awareness (Pin 1=Out, Pins 2 & 3=In). |
| **2** | **Realization of Gates using Universal Gates** | IC 7400 (NAND)<br>IC 7402 (NOR) | **8 complete subcircuits**: NAND as NOT, AND, OR, NOR; and NOR as NOT, AND, OR, NAND. |
| **3** | **Design & Implementation of Adders** | IC 7486 (XOR)<br>IC 7408 (AND)<br>IC 7432 (OR) | **Half Adder** ($S=A\oplus B, C=AB$) & **Full Adder** ($S=A\oplus B\oplus C_{in}$, $C_{out}=AB+C_{in}(A\oplus B)$). |
| **4** | **Design & Implementation of Subtractors** | IC 7486 (XOR)<br>IC 7404 (NOT)<br>IC 7408 (AND)<br>IC 7432 (OR) | **Half Subtractor** ($D=A\oplus B, B_o=\bar{A}B$) & **Full Subtractor** ($D=A\oplus B\oplus B_{in}$, $B_o=\bar{A}B + B_{in}(\overline{A\oplus B})$). |
| **5** | **Realization of Code Converters** | IC 7486 (Quad XOR) | **Binary to Gray Code** ($G_3=B_3, G_2=B_3\oplus B_2, G_1=B_2\oplus B_1, G_0=B_1\oplus B_0$) & **Gray to Binary** ($B_3=G_3, B_2=B_3\oplus G_2, B_1=B_2\oplus G_1, B_0=B_1\oplus G_0$). |
| **6** | **Realization of BCD Adder** | IC 7483 (Adder 1)<br>IC 7408 (AND)<br>IC 7432 (OR)<br>IC 7483 (Adder 2) | **4-Bit BCD Adder with Automatic +6 Correction**: detects $F=S_3(S_2+S_1)$, generates $C'=C_4+F$, and adds $0 C' C' 0_2$ to correct sums $>9$ and binary overflows. |

---

### Verification & Automated Test Suite

- **Engine Logic Unit Tests**: `src/tests/logic.test.ts` (7 passing tests) verifying NOT, AND, OR, NAND, NOR, XOR, and 4-Bit Adder logic.
- **Truth Table Integration Tests**: `src/tests/experiments.test.ts` (19 passing test suites, 26 total test runs) validating all 19 subcircuits and 100+ truth table states against the simulation engine.
- **Production Build**: Clean compilation with TypeScript (`tsc`) and Vite (`vite build`) producing zero bundle errors.

---

### Running the Application

To launch the simulator locally:

```bash
# 1. Install dependencies
npm install

# 2. Start the interactive development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

To create an optimized production build:
```bash
npm run build
npm run preview
```
