# DIGITAL ELECTRONICS INTERACTIVE LAB SIMULATOR
## Source Material Specification & Logical Blueprint

Extracted directly from the Padre Conceição College of Engineering Laboratory Manual:
Course: **CMP 203 - Digital System Design and Analysis Lab**

---

## 1. Source Reference Summary

- **Primary Educational Reference**: 18-page Laboratory Manual (`Scan documents20260811_140411.pdf` pages 1–11, and `page 12.jpeg` through `page 18.jpeg`).
- **Primary Visual Reference**: `2D_Circuit-Blink-Build-Instructions-Step-7-345x500.png` (Top-down 2D realistic breadboard with DIP IC, tie points, power rails, jumper wires, resistors, and LEDs).

---

## 2. Inventory of Supported Experiments & Truth Tables

### Experiment 1: Truth Table Verification of Various Logic Gates
- **Aim**: To study the following logic gates and verify their truth tables.
- **Components & Equipment**: Breadboard, connecting wires, 5V power supply, crocodile clips, 330Ω resistors, LEDs.
- **ICs**:
  - `IC 7404`: Hex Inverter (6 NOT gates)
    - Pinout: VCC = 14, GND = 7. Gates: 1->2, 3->4, 5->6, 9->8, 11->10, 13->12.
  - `IC 7408`: Quad 2-input AND gate (4 AND gates)
    - Pinout: VCC = 14, GND = 7. Gates: (1,2)->3, (4,5)->6, (9,10)->8, (12,13)->11.
  - `IC 7432`: Quad 2-input OR gate (4 OR gates)
    - Pinout: VCC = 14, GND = 7. Gates: (1,2)->3, (4,5)->6, (9,10)->8, (12,13)->11.
  - `IC 7400`: Quad 2-input NAND gate (4 NAND gates)
    - Pinout: VCC = 14, GND = 7. Gates: (1,2)->3, (4,5)->6, (9,10)->8, (12,13)->11.
  - `IC 7402`: Quad 2-input NOR gate (4 NOR gates)
    - **CRITICAL PINOUT DIFFERENCE**: VCC = 14, GND = 7. Outputs are on pins 1, 4, 10, 13!
    - Gates: (2,3)->1, (5,6)->4, (8,9)->10, (11,12)->13.
  - `IC 7486`: Quad 2-input XOR gate (4 XOR gates)
    - Pinout: VCC = 14, GND = 7. Gates: (1,2)->3, (4,5)->6, (9,10)->8, (12,13)->11.
  - `XNOR Gate`: Inverted XOR ($Y = \overline{A \oplus B}$).
- **Truth Tables**:
  - NOT: $0 \to 1$, $1 \to 0$
  - AND: $00 \to 0$, $01 \to 0$, $10 \to 0$, $11 \to 1$
  - OR: $00 \to 0$, $01 \to 1$, $10 \to 1$, $11 \to 1$
  - NAND: $00 \to 1$, $01 \to 1$, $10 \to 1$, $11 \to 0$
  - NOR: $00 \to 1$, $01 \to 0$, $10 \to 0$, $11 \to 0$
  - XOR: $00 \to 0$, $01 \to 1$, $10 \to 1$, $11 \to 0$
  - XNOR: $00 \to 1$, $01 \to 0$, $10 \to 0$, $11 \to 1$

---

### Experiment 2: Universal Gates
- **Aim**: To realize the basic gates using NAND and NOR gates.
- **Components & Equipment**: Breadboard, power supply, wires, crocodile clips, 330Ω resistor, LEDs, IC 7400 (NAND) and IC 7402 (NOR).
- **Sub-circuits Using NAND (IC 7400)**:
  1. **NAND as NOT**: Inputs tied together $\overline{A \cdot A} = \overline{A}$. (1 gate)
  2. **NAND as AND**: $A, B \to \text{NAND}_1 \to \overline{AB}$; then $\overline{AB}$ into $\text{NAND}_2$ (inputs tied) $\to AB$. (2 gates)
  3. **NAND as OR**: $A \to \text{NAND}_1 \to \overline{A}$; $B \to \text{NAND}_2 \to \overline{B}$; inputs $\overline{A}, \overline{B} \to \text{NAND}_3 \to \overline{\overline{A}\cdot\overline{B}} = A + B$. (3 gates)
  4. **NAND as NOR**: $A, B \to$ OR using 3 NANDs $\to A+B$; then into 4th NAND (inputs tied) $\to \overline{A+B}$. (4 gates)
- **Sub-circuits Using NOR (IC 7402)**:
  1. **NOR as NOT**: Inputs tied together $\overline{A + A} = \overline{A}$. (1 gate)
  2. **NOR as AND**: $A \to \text{NOR}_1 \to \overline{A}$; $B \to \text{NOR}_2 \to \overline{B}$; inputs $\overline{A}, \overline{B} \to \text{NOR}_3 \to \overline{\overline{A}+\overline{B}} = A \cdot B$. (3 gates)
  3. **NOR as OR**: $A, B \to \text{NOR}_1 \to \overline{A+B}$; then into $\text{NOR}_2$ (inputs tied) $\to A+B$. (2 gates)
  4. **NOR as NAND**: $A, B \to$ AND using 3 NORs $\to AB$; then into 4th NOR (inputs tied) $\to \overline{AB}$. (4 gates)

---

### Experiment 3: Construction of Half Adder and Full Adder
- **Aim**: To study half adder and full adder.
- **Components & Equipment**: Breadboard, power supply, wires, crocodile clips, 330Ω resistor, LEDs, IC 7486 (XOR), IC 7408 (AND), IC 7432 (OR).
- **Half Adder**:
  - Inputs: $A, B$
  - Outputs: $\text{Sum} = A \oplus B$, $\text{Carry} = A \cdot B$
  - Gates: 1 XOR gate, 1 AND gate.
- **Full Adder**:
  - Inputs: $A, B, C_{in}$
  - Equations:
    - $\text{Sum} = A \oplus B \oplus C_{in}$
    - $\text{Carry} = (A \oplus B) \cdot C_{in} + A \cdot B$
  - Gates & Connection:
    - $\text{XOR}_1(A, B) \to X$
    - $\text{XOR}_2(X, C_{in}) \to \text{Sum}$
    - $\text{AND}_1(X, C_{in}) \to Y$
    - $\text{AND}_2(A, B) \to Z$
    - $\text{OR}_1(Y, Z) \to \text{Carry}$
  - Truth Table: 8 states ($A, B, C_{in} \in \{0, 1\}$).

---

### Experiment 4: Construction of Half Subtractor and Full Subtractor
- **Aim**: To study half subtractor and full subtractor.
- **Components & Equipment**: Breadboard, power supply, wires, crocodile clips, 330Ω resistor, LEDs, IC 7486, IC 7408, IC 7404, IC 7432.
- **Half Subtractor**:
  - Inputs: $A, B$
  - Outputs: $\text{Difference} = A \oplus B$, $\text{Borrow} = \overline{A} \cdot B$
  - Gates: 1 XOR gate, 1 NOT gate (inverter for $A$), 1 AND gate.
- **Full Subtractor**:
  - Inputs: $A, B, C$ (where $C = B_{in}$)
  - Equations:
    - $\text{Difference} = A \oplus B \oplus C$
    - $\text{Borrow} = \overline{(A \oplus B)} \cdot C + \overline{A} \cdot B$
  - Gates & Connection (from manual page 11):
    - $\text{XOR}_1(A, B) \to X = A \oplus B$
    - $\text{XOR}_2(X, C) \to \text{Difference}$
    - $\text{NOT}_1(X) \to \overline{X} = \overline{A \oplus B}$
    - $\text{AND}_1(\overline{X}, C) \to \overline{(A \oplus B)} \cdot C$
    - $\text{NOT}_2(A) \to \overline{A}$
    - $\text{AND}_2(\overline{A}, B) \to \overline{A} \cdot B$
    - $\text{OR}_1(\text{out}(\text{AND}_1), \text{out}(\text{AND}_2)) \to \text{Borrow}$
  - Truth Table: 8 states ($A, B, C \in \{0, 1\}$).

---

### Experiment 5: Construct Code Converters (Binary to Gray and Gray to Binary)
- **Aim**: To design and verify different code converters.
- **Components & Equipment**: Breadboard, power supply, wires, crocodile clips, 330Ω resistor, LEDs, IC 7486 (Quad XOR).
- **Sub-circuit 1: Binary to Gray Code Converter**:
  - Inputs: $B_3, B_2, B_1, B_0$ (4-bit binary)
  - Equations:
    - $G_3 = B_3$
    - $G_2 = B_3 \oplus B_2$
    - $G_1 = B_2 \oplus B_1$
    - $G_0 = B_1 \oplus B_0$
  - Gates: 3 XOR gates from 1x 7486.
  - Truth table: All 16 decimal codes 0 to 15.
- **Sub-circuit 2: Gray to Binary Code Converter**:
  - Inputs: $G_3, G_2, G_1, G_0$ (4-bit Gray code)
  - Equations:
    - $B_3 = G_3$
    - $B_2 = G_3 \oplus G_2 = B_3 \oplus G_2$
    - $B_1 = B_2 \oplus G_1$
    - $B_0 = B_1 \oplus G_0$
  - Gates: 3 cascaded XOR gates from 1x 7486.
  - Truth table: All 16 decimal codes 0 to 15.

---

### Experiment 6: Realization of BCD Adder
- **Aim**: To study the design and working of a Binary Coded Decimal (BCD) adder.
- **Components & Equipment**: Breadboard, power supply, connecting wires, ICs: 4-bit binary adder (IC 7483), logic gates (IC 7408 AND, IC 7432 OR), LEDs, resistors (330Ω).
- **Theory & Operation**:
  1. Add two 4-bit BCD numbers $A_3 A_2 A_1 A_0$ and $B_3 B_2 B_1 B_0$ using first 4-bit adder (IC 7483 Adder 1) with $C_0 = 0$.
  2. Outputs from Adder 1 are $S_3 S_2 S_1 S_0$ and $C_4$.
  3. Condition for invalid BCD (Sum > 9 or carry $C_4 = 1$):
     - $F = S_3 S_2 + S_3 S_1 = S_3(S_2 + S_1)$
     - Net Carry / Correction Trigger: $C' = C_4 + F = C_4 + S_3(S_2 + S_1)$
  4. Second 4-bit adder (Adder 2):
     - Adds original sum $S_3 S_2 S_1 S_0$ to correction value $0 C' C' 0$.
     - When $C' = 0$: adds $0000_2$ (no change).
     - When $C' = 1$: adds $0110_2$ ($+6$ correction).
     - Output BCD carry is $C'$, output BCD digits are $S'_3 S'_2 S'_1 S'_0$.

---

## 3. General Laboratory Procedure (Applicable to all experiments)
1. Insert the IC on the breadboard such that the notch faces the left/top.
2. Connect $+5\text{V}$ (VCC pin 14 or 16) and ground (GND pin 7 or 12).
3. Connect inputs to high ($+5\text{V}$) or low ($\text{GND}$) as per truth table.
4. Connect outputs through 330Ω current-limiting resistors to the anodes of LEDs. Connect LED cathodes to GND.
5. Switch on power supply and verify logic states on LEDs (ON = 1/HIGH, OFF = 0/LOW).
