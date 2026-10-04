# ARCHITECTURE SPECIFICATION
## Digital Electronics Interactive Lab Simulator

### 1. Architectural Principles
- **Single Source of Truth**: The deterministic digital simulation engine computes all digital logic states. The SVG breadboard, truth tables, signal traces, explanation engine, quiz validation, and practical mode all query and reflect the simulation state.
- **Data-Driven Experiments**: Experiments are declared as modular data structures conforming to TypeScript interfaces, including IC configurations, circuit wiring graphs, Boolean formulas, procedural checklists, and viva questions.
- **Physical Realism & SVG Vector Fidelity**: The virtual breadboard replicates physical lab hardware as referenced in `2D_Circuit-Blink-Build-Instructions-Step-7-345x500.png`.

---

### 2. Directory Layout
```
src/
  ├── simulator/
  │   ├── engine/
  │   │   ├── types.ts          # DigitalSignal, Pin, Wire, Component, SimulationState
  │   │   ├── logic.ts          # Core gate logic (NOT, AND, OR, NAND, NOR, XOR, XNOR)
  │   │   ├── Circuit.ts        # Graph container, netlist resolution, and propagation
  │   │   └── trace.ts          # Upstream dependency resolution (Signal Tracer)
  │   ├── ics/
  │   │   ├── definitions.ts    # Reusable definitions for 7404, 7408, 7432, 7400, 7402, 7486, 7483
  │   │   └── pinouts.ts        # Physical pin mapping, directionality, and internal gate topology
  │   └── components/
  │       ├── DIP_IC.ts         # Dual In-line Package component model
  │       ├── Switch.ts         # Logic input source
  │       ├── LED.ts            # Indicator with threshold & resistor drop
  │       └── Resistor.ts       # 330 ohm pull-down / current-limiting
  ├── experiments/
  │   ├── types.ts              # Experiment schema, VivaQuestion, ProcedureItem, StepExplanation
  │   ├── registry.ts           # Central registry of experiments 1 to 6
  │   ├── exp1_logic_gates/     # Exp 1: 7404, 7408, 7432, 7400, 7402, 7486
  │   ├── exp2_universal_gates/ # Exp 2: NAND/NOR realizations of NOT, AND, OR, NAND/NOR
  │   ├── exp3_adders/          # Exp 3: Half & Full Adder
  │   ├── exp4_subtractors/     # Exp 4: Half & Full Subtractor
  │   ├── exp5_code_converters/ # Exp 5: Binary to Gray & Gray to Binary
  │   └── exp6_bcd_adder/       # Exp 6: 4-bit BCD Adder with correction logic
  ├── components/
  │   ├── breadboard/
  │   │   ├── BreadboardView.tsx    # SVG Top-Down Breadboard with holes, rails, and DIP chips
  │   │   ├── SVGWires.tsx          # Orthogonal / curved jumper wires with live signal coloring
  │   │   ├── SVGIC.tsx             # DIP package with pin notch and pin labels
  │   │   ├── SVGLED.tsx            # Glowing LED indicator
  │   │   ├── SVGSwitch.tsx         # Toggle switch bank
  │   │   └── SVGResistor.tsx       # Resistor with 330-ohm bands
  │   ├── inspector/
  │   │   ├── ComponentInspector.tsx# Interactive inspection of ICs, pins, and wires
  │   │   └── SignalTraceModal.tsx  # Upstream causal graph display
  │   ├── explanation/
  │   │   ├── ExplainCircuit.tsx    # Step-by-step logic walkthrough with gate highlights
  │   │   └── AutoPlayer.tsx        # Animation playback controls (speed, pause, loop)
  │   ├── truthTable/
  │   │   └── TruthTableView.tsx    # Interactive bidirectional table with active-row highlight
  │   ├── practical/
  │   │   └── BuildMode.tsx         # Wire-it-yourself canvas with 4-level progressive hints
  │   ├── viva/
  │   │   └── VivaSection.tsx       # Flashcard & self-test viva cards
  │   ├── quiz/
  │   │   └── QuizSection.tsx       # Simulation-grounded interactive assessment
  │   └── layout/
  │       ├── Header.tsx            # Lab title, theme switcher, search bar
  │       ├── NavigationTabs.tsx    # Mode switcher (Learn, Simulation, Explain, Build, Viva, Exam)
  │       └── Dashboard.tsx         # Experiment grid with progress indicators
  ├── tests/
  │   ├── logic.test.ts         # Gate-level and digital signal logic tests
  │   ├── ic.test.ts            # IC pinout and pin direction tests
  │   └── experiments.test.ts   # Automated truth table verification for all 6 experiments
  ├── App.tsx                   # Main state container & router
  ├── main.tsx                  # React entry point
  └── index.css                 # Tailwind CSS & custom breadboard styling
```

---

### 3. Simulation Engine Specification
- **DigitalSignal**:
  - `LOW` ($0$ / GND / $0\text{V}$)
  - `HIGH` ($1$ / VCC / $+5\text{V}$)
  - `FLOATING` ($2$ / High-Z / Disconnected)
- **Circuit Graph**:
  - Vertices: `Pin` (Input, Output, Power, Ground, Passive)
  - Edges: `Wire` connecting pin pairs or breadboard buses
  - Components: `IC`, `Switch`, `LED`, `Resistor`
- **Evaluation Loop**:
  1. Input switch toggles state $\to$ pin driving wire receives new signal.
  2. Wire propagates signal to connected IC input pins.
  3. IC evaluates internal gates whose inputs changed.
  4. Gate outputs update respective IC output pins.
  5. If output pin drives subsequent wires/gates, propagate recursively with loop-guard until convergence.
  6. Final output pins update connected LEDs and active measurement probes.
  7. Active state is published to React via a lightweight custom hook (`useCircuitSimulation`).

---

### 4. Visual Breadboard Design Specification
- Standard standard full-size breadboard dimensions (30 rows, columns A-E, trough, columns F-J, left & right +/- power rails).
- High visual fidelity matching `2D_Circuit-Blink-Build-Instructions-Step-7-345x500.png`.
- Wire routing: Clean orthogonal and bezier routed paths with distinct colors per signal net (Red = VCC, Black = GND, Orange/Yellow/Green/Blue for logic signals).
- When a wire is `HIGH`, it renders with an inner vibrant glow (`#ef4444` / `#f59e0b` glow) and state badge (1).
- When a wire is `LOW`, it renders with a deep cool tone (`#1e293b` / `#3b82f6` cool tone) and state badge (0).
