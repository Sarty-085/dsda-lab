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
