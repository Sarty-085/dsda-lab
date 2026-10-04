import { Experiment } from './types';
import { EXP1_LOGIC_GATES } from './data/exp1';
import { EXP2_UNIVERSAL_GATES } from './data/exp2';
import { EXP3_ADDERS } from './data/exp3';
import { EXP4_SUBTRACTORS } from './data/exp4';
import { EXP5_CODE_CONVERTERS } from './data/exp5';
import { EXP6_BCD_ADDER } from './data/exp6';

export const EXPERIMENTS: Experiment[] = [
  EXP1_LOGIC_GATES,
  EXP2_UNIVERSAL_GATES,
  EXP3_ADDERS,
  EXP4_SUBTRACTORS,
  EXP5_CODE_CONVERTERS,
  EXP6_BCD_ADDER,
];

export function getAllExperiments(): Experiment[] {
  return EXPERIMENTS;
}

export function getExperimentById(id: string): Experiment | undefined {
  return EXPERIMENTS.find(e => e.id === id);
}

export function getExperimentByNumber(num: number): Experiment | undefined {
  return EXPERIMENTS.find(e => e.experimentNumber === num);
}

export interface SearchResult {
  experimentId: string;
  experimentTitle: string;
  subCircuitId?: string;
  subCircuitName?: string;
  matchType: 'Experiment' | 'IC' | 'Gate' | 'Topic';
  matchedText: string;
}

export function searchExperiments(query: string): SearchResult[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const exp of EXPERIMENTS) {
    if (exp.title.toLowerCase().includes(q) || exp.aim.toLowerCase().includes(q)) {
      results.push({
        experimentId: exp.id,
        experimentTitle: exp.title,
        matchType: 'Experiment',
        matchedText: exp.title,
      });
    }

    for (const comp of exp.components) {
      if (comp.name.toLowerCase().includes(q) || (comp.spec && comp.spec.toLowerCase().includes(q))) {
        results.push({
          experimentId: exp.id,
          experimentTitle: exp.title,
          matchType: 'IC',
          matchedText: `${comp.name} in Experiment ${exp.experimentNumber}`,
        });
      }
    }

    for (const sub of exp.subCircuits) {
      if (sub.name.toLowerCase().includes(q) || sub.description.toLowerCase().includes(q)) {
        results.push({
          experimentId: exp.id,
          experimentTitle: exp.title,
          subCircuitId: sub.id,
          subCircuitName: sub.name,
          matchType: 'Gate',
          matchedText: `${sub.name} (${exp.title})`,
        });
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return results.filter(r => {
    const key = `${r.experimentId}-${r.subCircuitId || ''}-${r.matchedText}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
