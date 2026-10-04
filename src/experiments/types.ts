import { DigitalSignal } from '../simulator/engine/types';

export interface ComponentItem {
  name: string;
  quantity: number;
  spec?: string;
  category: 'IC' | 'PASSIVE' | 'INPUT' | 'OUTPUT' | 'POWER';
}

export interface TruthTableRow {
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  label?: string;
}

export interface ExplanationStep {
  step: number;
  title: string;
  description: string;
  formulaSnippet?: string;
  highlightComponentId?: string;
  highlightGateId?: string;
  highlightPins?: number[];
  highlightWires?: string[];
  activeInputs?: Record<string, DigitalSignal>;
}

export interface VivaQuestion {
  id: string;
  category: 'Basic' | 'Intermediate' | 'Advanced';
  question: string;
  answer: string;
  hint?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'MCQ' | 'OUTPUT_PREDICTION' | 'PIN_IDENTIFICATION';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  inputs?: Record<string, DigitalSignal>;
}

export interface CommonMistake {
  title: string;
  mistake: string;
  remedy: string;
  impact: string;
}

export interface SubCircuitConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  ics: {
    instanceId: string;
    partNumber: string;
    label: string;
    rowStart: number;
  }[];
  inputs: {
    id: string;
    label: string;
    defaultState: DigitalSignal;
    boardConnection: { row: number; col: string };
  }[];
  outputs: {
    id: string;
    label: string;
    color: 'red' | 'green' | 'amber' | 'blue';
    boardConnection: { row: number; col: string };
  }[];
  wires: {
    id: string;
    from: { row: number; col: string };
    to: { row: number; col: string };
    color?: string;
    label?: string;
    fromPinId?: string;
    toPinId?: string;
  }[];
  truthTable: TruthTableRow[];
  booleanExpression: {
    primary: string;
    intermediate?: string[];
  };
  explanationSteps: ExplanationStep[];
}

export interface Experiment {
  id: string;
  experimentNumber: number;
  title: string;
  aim: string;
  theory: {
    summary: string;
    detailed: string;
    keyPoints: string[];
  };
  components: ComponentItem[];
  subCircuits: SubCircuitConfig[];
  procedure: {
    stepNumber: number;
    instruction: string;
  }[];
  conclusion: string;
  vivaQuestions: VivaQuestion[];
  quizQuestions: QuizQuestion[];
  commonMistakes: CommonMistake[];
}
