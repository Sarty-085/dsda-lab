# EXPERIMENT SOURCE-OF-TRUTH MAPPING

This document traces every experiment implemented in this simulator directly to its physical origin in the Padre Conceição College of Engineering Digital Electronics Laboratory Manual (CMP 203 - Digital System Design and Analysis Lab).

---

## Experiment 1: Truth Table Verification of Various Logic Gates
- **Source Manual Pages**: Pages 1 to 5.
- **Direct Source Truth**:
  - Components: Breadboard, connecting wires, 5V power supply, crocodile clips, 330Ω resistors, LEDs.
  - Specified ICs:
    - IC 7404 (Hex Inverter)
    - IC 7408 (Quad 2-input AND)
    - IC 7432 (Quad 2-input OR)
    - IC 7400 (Quad 2-input NAND)
    - IC 7402 (Quad 2-input NOR - noting reversed pin mapping where pin 1 is Output, pins 2 & 3 are Inputs)
    - IC 7486 (Quad 2-input XOR)
  - Gates Studied: NOT, AND, OR, NAND, NOR, XOR, XNOR.
- **Implementation Decisions**:
  - Provide an interactive sub-selector to inspect and simulate each gate on its authentic IC package.
  - Visual breadboard displays the real DIP-14 package with accurate pin numbers (e.g. Pin 14 = VCC, Pin 7 = GND).
- **Additional Educational Explanations Added**:
  - Signal trace visualization showing current flowing from VCC through the IC switch transistor logic to LED anode.
  - Interactive pin probe showing pin function and logic level.

---

## Experiment 2: Universal Gates
- **Source Manual Pages**: Pages 6 to 7.
- **Direct Source Truth**:
  - Realization using NAND (IC 7400):
    1. NOT: Inputs tied together ($\overline{A \cdot A} = \overline{A}$)
    2. AND: $A, B \to$ NAND $\to$ NAND (inputs tied) $\to AB$
    3. OR: $A \to$ NAND $\to \overline{A}$, $B \to$ NAND $\to \overline{B}$, both into 3rd NAND $\to A + B$
    4. NOR: Realized OR followed by 4th NAND (inputs tied) $\to \overline{A + B}$
  - Realization using NOR (IC 7402):
    1. NOT: Inputs tied together ($\overline{A + A} = \overline{A}$)
    2. AND: $A \to$ NOR $\to \overline{A}$, $B \to$ NOR $\to \overline{B}$, both into 3rd NOR $\to AB$
    3. OR: $A, B \to$ NOR $\to \overline{A+B}$, into 2nd NOR (inputs tied) $\to A + B$
    4. NAND: Realized AND followed by 4th NOR (inputs tied) $\to \overline{AB}$
- **Implementation Decisions**:
  - Users can select between NAND-based realizations and NOR-based realizations, and toggle between NOT, AND, OR, NAND/NOR circuits.
  - Physical pins of IC 7400 and IC 7402 are wired on the breadboard matching the exact gate topologies drawn by the manual.

---

## Experiment 3: Construction of Half Adder and Full Adder
- **Source Manual Pages**: Pages 8 to 9.
- **Direct Source Truth**:
  - Components: IC 7486, 7408, 7432, 330Ω resistors, LEDs.
  - Half Adder:
    - $\text{Sum} = A \oplus B$
    - $\text{Carry} = AB$
  - Full Adder:
    - $\text{Sum} = A \oplus B \oplus C_{in}$
    - $\text{Carry} = (A \oplus B)C_{in} + AB$
    - Circuit uses 2 XOR gates, 2 AND gates, and 1 OR gate.
- **Implementation Decisions**:
  - Full breadboard layout contains all three physical ICs (7486, 7408, 7432) placed over the center divider with jumper wires connecting the inter-chip intermediate terms $(A \oplus B)$ and $AB$.

---

## Experiment 4: Construction of Half Subtractor and Full Subtractor
- **Source Manual Pages**: Pages 10 to 11.
- **Direct Source Truth**:
  - Components: IC 7486, 7408, 7404, 7432, 330Ω resistors, LEDs.
  - Half Subtractor:
    - $\text{Difference} = A \oplus B$
    - $\text{Borrow} = \overline{A}B$
  - Full Subtractor:
    - $\text{Difference} = A \oplus B \oplus C$
    - $\text{Borrow} = \overline{(A \oplus B)}C + \overline{A}B$
    - Uses XOR for $A \oplus B$, XOR for Difference, NOT for $\overline{A \oplus B}$, AND for $\overline{(A \oplus B)}C$, NOT for $\overline{A}$, AND for $\overline{A}B$, and OR for Borrow.
- **Implementation Decisions**:
  - Accurately renders the 4 DIP ICs (7486, 7404, 7408, 7432) on the breadboard with all interconnections.

---

## Experiment 5: Construct Code Converters (Binary to Gray and Gray to Binary)
- **Source Manual Pages**: Pages 12 to 15.
- **Direct Source Truth**:
  - Binary to Gray Code:
    - $G_3 = B_3$
    - $G_2 = B_3 \oplus B_2$
    - $G_1 = B_2 \oplus B_1$
    - $G_0 = B_1 \oplus B_0$
    - Uses 3 XOR gates from one IC 7486.
  - Gray to Binary Code:
    - $B_3 = G_3$
    - $B_2 = G_3 \oplus G_2 = B_3 \oplus G_2$
    - $B_1 = B_2 \oplus G_1$
    - $B_0 = B_1 \oplus G_0$
    - Uses 3 cascaded XOR gates from one IC 7486.
- **Implementation Decisions**:
  - 4-switch DIP input bank for bits 3..0.
  - 4 output LEDs for converted code bits.
  - All 16 codes (0 to 15) listed and testable via one-click truth table rows.

---

## Experiment 6: Realization of BCD Adder
- **Source Manual Pages**: Pages 16 to 18.
- **Direct Source Truth**:
  - Components: 2x 4-bit binary adder (IC 7483), IC 7408 AND, IC 7432 OR.
  - Theory:
    - Addition of two BCD digits $A$ and $B$.
    - Detection condition for invalid BCD (sum $> 9$ or carry out $C_4 = 1$):
      $$F = S_3 S_2 + S_3 S_1 = S_3 (S_2 + S_1)$$
      $$C' = C_4 + F = C_4 + S_3 (S_2 + S_1)$$
    - Correction adder: Adds $0 C' C' 0_2$ (which is $0110_2 = 6_{10}$ when $C'=1$) to the initial sum.
    - Final output: Output carry $C'$ and corrected BCD sum $S'_3 S'_2 S'_1 S'_0$.
- **Implementation Decisions**:
  - Real-time display of both stages: Initial Binary Sum stage and Final Corrected BCD stage.
  - Visual callout when sum exceeds 9 explaining why $+6$ ($0110_2$) is injected.

---

## Experiment 7: Construction and Implementation of Parity Bit Generator/Checker
- **Source Manual File**: `Exp7_Parity_generator_and_checker_1.pdf` (Pages 1 to 3, CMP-203 Lab Manual).
- **Direct Source Truth**:
  - Components: Breadboard, power supply, wires, crocodile clips, 330Ω resistors, LEDs, IC 7486 (Quad 2-input XOR), IC 7404 (Hex Inverter for odd parity generator).
  - Even Parity Generator: $f = A \oplus B \oplus C \oplus D$ (3 XOR gates of IC 7486).
  - Even Parity Checker: $f = A \oplus B \oplus C \oplus D \oplus P$ (4 XOR gates of IC 7486; `0 = no error`, `1 = error`).
  - Odd Parity Generator: $f = \overline{(A \oplus B) \oplus (C \oplus D)} = \overline{A \oplus B \oplus C \oplus D}$ (3 XOR gates + NOT gate).
  - Odd Parity Checker: $f = A \oplus B \oplus C \oplus D \oplus P$ (4 XOR gates; `0 = error`, `1 = no error`).

---

## Experiment 8: Multiplexer and Demultiplexer
- **Source Manual File**: `Expt_9_mux_demux.pdf` (Manual Experiment No: 8, Pages 22 to 23).
- **Direct Source Truth**:
  - Components: Breadboard, power supply, connecting wires, 3-input AND gates (IC 7411), 2-input OR gates (IC 7432), NOT gates (IC 7404), LEDs, 330Ω resistors.
  - 4:1 Multiplexer: $Z = D_0 \overline{S_1}\,\overline{S_0} + D_1 \overline{S_1} S_0 + D_2 S_1 \overline{S_0} + D_3 S_1 S_0$ using 2 NOTs, 4 3-input ANDs (2× IC 7411), and 3 ORs (IC 7432).
  - 1:4 Demultiplexer: $O_0 = D\overline{S_1}\,\overline{S_0}$, $O_1 = D\overline{S_1}S_0$, $O_2 = D S_1\overline{S_0}$, $O_3 = D S_1 S_0$ using 2 NOTs and 4 3-input ANDs.

---

## Experiment 9: Verify the Truth Table of JK and D Flip-Flops
- **Source Manual File**: `Expt_8_flipflops_1.pdf` (Manual Experiment No: 9, Pages 1 to 3).
- **Direct Source Truth**:
  - Components: Breadboard, power supply, function generator/clock switch, BNC cable, wires, IC 7400 (Quad 2-input NAND), IC 7410 (Triple 3-input NAND for JK steering), 330Ω resistors, LEDs.
  - D Flip-Flop: 5 NAND gates across 2× IC 7400 (input inverter + gated SR NAND latch).
  - JK Flip-Flop: Two 3-input steering NANDs (IC 7410) with cross-feedback from $Q$ and $Q'$ feeding a cross-coupled SR NAND latch (IC 7400), toggling on leading edge of clock signal.

---

## Experiment 10: Design SISO, SIPO Shift Register
- **Source Manual File**: `Expt_10.pdf` (Pages 26 to 27, CMP-203 Lab Manual).
- **Direct Source Truth**:
  - Components: Breadboard, power supply, function generator/clock switch, BNC cable, wires, IC 7474 (2× Dual D Flip-Flop with Preset and Clear), IC 7495 (4-bit Shift Register), 330Ω resistors, LEDs.
  - SISO Shift Register: 4 cascaded D flip-flops (2× IC 7474) clocked in parallel showing serial delay through $Q_1 \to Q_2 \to Q_3 \to Q_4\,(S_{\text{out}})$.
  - SIPO Shift Register (7474): 4 cascaded D flip-flops with common Clock and active-low Clear driving parallel outputs $Q_A..Q_D$.
  - 4-Bit Shift Register (7495): Mode Control $M=0$ serial right shift ($D_S \to Q_A..Q_D$) via CK1 and $M=1$ parallel load reset ($0000$) via CK2.
