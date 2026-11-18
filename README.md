# Digital Electronics Interactive Lab Simulator

> **Interactive Digital System Design & Analysis Laboratory**

An interactive, accurate, and responsive web-based Digital Electronics Laboratory Simulator built according to standard university laboratory coursework manuals.

## 🚀 Key Features

- **10 Complete Experiments**:
  1. **Exp 1**: Truth Table Verification of Various Logic Gates (7404 NOT, 7408 AND, 7432 OR, 7400 NAND, 7402 NOR, 7486 XOR, XNOR).
  2. **Exp 2**: Universal Gates (NAND 7400 & NOR 7402 realizations of NOT, AND, OR, NOR/NAND).
  3. **Exp 3**: Construction of Half Adder and Full Adder (7486, 7408, 7432).
  4. **Exp 4**: Construction of Half Subtractor and Full Subtractor (7486, 7404, 7408, 7432).
  5. **Exp 5**: Construct Code Converters (4-bit Binary to Gray and Gray to Binary using 7486).
  6. **Exp 6**: Realization of BCD Adder (2× 7483 4-bit Adders, 7408 AND, 7432 OR).
  7. **Exp 7**: Construction and Implementation of Parity Bit Generator/Checker (Even & Odd Parity Generators and Checkers using 7486 & 7404).
  8. **Exp 8**: Multiplexer and Demultiplexer (4:1 MUX and 1:4 DEMUX using logic gates: 7404, 2× 7411, 7432).
  9. **Exp 9**: Verify the Truth Table of JK and D Flip-Flops (5-NAND D Flip-Flop using 2× 7400; JK Flip-Flop using 7410 & 7400).
  10. **Exp 10**: Design SISO, SIPO Shift Register (2× 7474 Dual D Flip-Flop SISO/SIPO and IC 7495 4-Bit Shift Register).
- **Interactive Virtual Breadboard**:
  - Realistic breadboard graphics with power rails (+5V / GND), tie-point columns (A–E, F–J), and DIP IC sockets.
  - Signal visualization: Distinct HIGH (Red / +5V) and LOW (Blue / 0V) color-coded wires and indicators.
  - Accurate physical modeling including dual-terminal LEDs (Anode & Cathode) requiring complete forward-bias closed circuits to illuminate.
- **Circuit Simulation Modes**:
  - **Learn & Observe Mode**: Toggle inputs to see live wire signal propagation, animated flow, and dynamic truth-table row highlighting.
  - **Interactive Circuit Build Mode**: Step-by-step guided wiring challenge with interactive wire placement, click-to-connect terminals, and real-time connection validation.
- **Educational Personal Tutor**:
  - Theory, procedure, pinouts, and Boolean equations for every experiment.
  - Step-by-step circuit explanation and animated walkthrough.
  - Comprehensive Viva Voce practice questions with interactive answers.
- **Responsive Design**: Clean UI optimized for desktop, tablet, and mobile screens.

---

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Bundler & Tooling**: Vite
- **Styling**: Tailwind CSS, Lucide React icons
- **Testing**: Vitest with React Testing Library

---

## 📦 Installation & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sarty-085/dsda-lab.git
   cd dsda-lab
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Run Unit & Simulation Tests**:
   ```bash
   npm test
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🌐 Deploy to Vercel

### Option 1: Via Vercel Web Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** → **"Project"**.
3. Under **Import Git Repository**, select `dsda-lab` (or search for `Sarty-085/dsda-lab`).
4. In the Project Configuration:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Your lab simulator will be live in ~30 seconds with a free `.vercel.app` URL!

### Option 2: Using Vercel CLI

```bash
npm install -g vercel
vercel
```
Follow the interactive CLI prompts to deploy.
