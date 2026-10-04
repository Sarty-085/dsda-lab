# Digital Electronics Interactive Lab Simulator

> **Interactive Digital System Design & Analysis Laboratory**

An interactive, accurate, and responsive web-based Digital Electronics Laboratory Simulator built according to standard university laboratory coursework manuals.

## 🚀 Key Features

- **6 Complete Experiments**:
  1. **Exp 1**: Realization of Logic Gates using TTL ICs (7408 AND, 7432 OR, 7404 NOT, 7400 NAND, 7402 NOR, 7486 XOR).
  2. **Exp 2**: Verification of Universal Gates (NAND & NOR implementations of NOT, AND, OR).
  3. **Exp 3**: Design and Implementation of Half Adder & Full Adder using Logic Gates.
  4. **Exp 4**: Design and Implementation of Half Subtractor & Full Subtractor using Logic Gates.
  5. **Exp 5**: Design and Implementation of 3-bit Binary to Gray Code Converter & Gray to Binary Converter.
  6. **Exp 6**: Verification of Truth Table of 4:1 Multiplexer (74153) and 1:4 Demultiplexer (74139).
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
