import React, { useState, useMemo, useEffect, useRef } from 'react';
import { EXPERIMENTS, getExperimentById } from './experiments/registry';
import { buildCircuitFromConfig } from './simulator/circuitFactory';
import { DigitalSignal } from './simulator/engine/types';
import { createEmptySeqMemory } from './workbench/workbenchEngine';
import { WorkbenchSessionData } from './workbench/workbenchTypes';

import { AppSection, Header } from './components/layout/Header';
import { LandingPage } from './components/layout/LandingPage';
import { BreadboardSVG } from './components/breadboard/BreadboardSVG';
import { TruthTable } from './components/panels/TruthTable';
import { CircuitExplainer } from './components/panels/CircuitExplainer';
import { ComponentInspector } from './components/panels/ComponentInspector';
import { VivaVoce } from './components/panels/VivaVoce';
import { PracticeQuiz } from './components/panels/PracticeQuiz';
import { ObservationTable } from './components/panels/ObservationTable';
import { TheoryPanel } from './components/panels/TheoryPanel';
import {
  CustomWorkbench,
  loadSavedWorkbenchSession,
  saveWorkbenchSession,
} from './components/workbench/CustomWorkbench';

type ActiveTab = 'SIMULATOR' | 'THEORY' | 'OBSERVATIONS' | 'VIVA' | 'QUIZ';

export const App: React.FC = () => {
  // Top-level Workspace Section: Landing Page | Experiment Guides | Custom Workbench
  const [activeSection, setActiveSection] = useState<AppSection>('HOME');

  // Persistent Custom Workbench session (retained across section switches & page reloads)
  const [workbenchSession, setWorkbenchSession] = useState<WorkbenchSessionData>(
    loadSavedWorkbenchSession
  );
  const workbenchSeqMemRef = useRef(createEmptySeqMemory());

  useEffect(() => {
    saveWorkbenchSession(workbenchSession);
  }, [workbenchSession]);

  // Active Experiment & Subcircuit state
  const [currentExpId, setCurrentExpId] = useState<string>('exp1');
  const currentExp = useMemo(() => getExperimentById(currentExpId) || EXPERIMENTS[0], [currentExpId]);

  const [currentSubId, setCurrentSubId] = useState<string>(currentExp.subCircuits[0].id);
  const currentSub = useMemo(() => {
    return currentExp.subCircuits.find(s => s.id === currentSubId) || currentExp.subCircuits[0];
  }, [currentExp, currentSubId]);

  // When experiment changes, default to its first subcircuit
  useEffect(() => {
    if (!currentExp.subCircuits.some(s => s.id === currentSubId)) {
      setCurrentSubId(currentExp.subCircuits[0].id);
    }
  }, [currentExp, currentSubId]);

  // Active Tab inside Experiment Guides section
  const [activeTab, setActiveTab] = useState<ActiveTab>('SIMULATOR');

  // Input switch toggle states & sequential replay history
  const [switchStates, setSwitchStates] = useState<Record<string, DigitalSignal>>({});
  const [switchHistory, setSwitchHistory] = useState<Array<Record<string, DigitalSignal>>>([]);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  // Circuit instance & dynamic simulation revision ticker
  const [simTick, setSimTick] = useState<number>(0);
  const circuit = useMemo(() => {
    const c = buildCircuitFromConfig(currentSub);
    if (switchHistory.length > 0) {
      for (const stepStates of switchHistory) {
        c.setSwitches(stepStates);
      }
    } else if (Object.keys(switchStates).length > 0) {
      c.setSwitches(switchStates);
    }
    return c;
  }, [currentSub, switchStates, switchHistory]);

  // Explainer state
  const [activeExplainStep, setActiveExplainStep] = useState<number>(0);

  // Inspector state
  const [selectedComp, setSelectedComp] = useState<{
    type: string;
    id: string;
    label: string;
    details?: any;
  } | null>(null);

  // Observation Table readings
  const [observations, setObservations] = useState<Array<{
    id: string;
    timestamp: string;
    inputs: Record<string, number>;
    outputs: Record<string, number>;
    status: 'MATCH' | 'MISMATCH';
  }>>([]);

  // Reset experiment simulator state when subcircuit changes
  useEffect(() => {
    setActiveExplainStep(0);
    setSelectedComp(null);
    setSwitchStates({});
    setSwitchHistory([]);
    setActiveRowIndex(null);
  }, [currentSubId]);

  // Handle Switch Toggle
  const handleToggleSwitch = (switchId: string) => {
    const currentSig = switchStates[switchId] ?? circuit.switches[switchId]?.state ?? DigitalSignal.LOW;
    const nextSignal = currentSig === DigitalSignal.HIGH ? DigitalSignal.LOW : DigitalSignal.HIGH;
    const updatedStates = { ...switchStates, [switchId]: nextSignal };
    setSwitchStates(updatedStates);
    setSwitchHistory(prev => [...prev, updatedStates]);
    setActiveRowIndex(null);
    setSimTick(t => t + 1);
  };

  // Handle Truth Table row selection (set circuit inputs and replay sequence from row 0)
  const handleSelectRowInputs = (newInputs: Record<string, DigitalSignal>, rowIndex?: number) => {
    const mapRowToSwitchUpdates = (rowInputs: Record<string, number | DigitalSignal>) => {
      const mapped: Record<string, DigitalSignal> = {};
      for (const [inKey, val] of Object.entries(rowInputs)) {
        const keyLower = inKey.toLowerCase();
        const matched =
          currentSub.inputs.find(i => i.label.toLowerCase() === keyLower) ||
          currentSub.inputs.find(i => i.id.toLowerCase().includes(keyLower));
        if (matched) {
          mapped[matched.id] =
            val === 1 || val === DigitalSignal.HIGH ? DigitalSignal.HIGH : DigitalSignal.LOW;
        }
      }
      return mapped;
    };

    if (rowIndex !== undefined && currentSub.truthTable[rowIndex]) {
      const history = currentSub.truthTable
        .slice(0, rowIndex + 1)
        .map(r => mapRowToSwitchUpdates(r.inputs));
      setSwitchHistory(history);
      setActiveRowIndex(rowIndex);
      setSwitchStates(history[history.length - 1] ?? {});
    } else {
      const switchUpdates = mapRowToSwitchUpdates(newInputs);
      const updated = { ...switchStates, ...switchUpdates };
      setSwitchStates(updated);
      setSwitchHistory(prev => [...prev, updated]);
      setActiveRowIndex(null);
    }
    setSimTick(t => t + 1);
  };

  // Record live state into Observation Table
  const handleRecordObservation = () => {
    const inputsRecord: Record<string, number> = {};
    for (const inp of currentSub.inputs) {
      const sw = circuit.switches[inp.id];
      inputsRecord[inp.label] = sw?.state === DigitalSignal.HIGH ? 1 : 0;
    }

    const outputsRecord: Record<string, number> = {};
    for (const out of currentSub.outputs) {
      const led = circuit.leds[out.id];
      outputsRecord[out.label] = led?.state === DigitalSignal.HIGH ? 1 : 0;
    }

    setObservations(prev => [
      ...prev,
      {
        id: `obs_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        inputs: inputsRecord,
        outputs: outputsRecord,
        status: 'MATCH',
      },
    ]);
  };

  // Current inputs map for truth table highlighting
  const currentInputsMap = useMemo(() => {
    const map: Record<string, DigitalSignal> = {};
    for (const inp of currentSub.inputs) {
      const swState = switchStates[inp.id] ?? circuit.switches[inp.id]?.state ?? inp.defaultState ?? DigitalSignal.LOW;
      map[inp.label] = swState;
      map[inp.id] = swState;
    }
    return map;
  }, [circuit, currentSub, switchStates, simTick]);

  // Highlighted component from walkthrough
  const highlightedComponentId = currentSub.explanationSteps?.[activeExplainStep]?.highlightComponentId;

  // Input & Output labels for Truth Table
  const inputLabels = useMemo(() => currentSub.inputs.map(i => i.label), [currentSub]);
  const outputLabels = useMemo(() => currentSub.outputs.map(o => o.label), [currentSub]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Master Header */}
      <Header
        activeSection={activeSection}
        onChangeSection={(sec) => {
          setActiveSection(sec);
        }}
        selectedExp={currentExp}
        selectedSub={currentSub}
        onSelectExp={(id) => {
          setCurrentExpId(id);
        }}
        onSelectSub={(subId) => {
          setCurrentSubId(subId);
        }}
      />

      {/* SECTION 0: LANDING PAGE */}
      {activeSection === 'HOME' && (
        <main className="flex-1">
          <LandingPage
            onOpenExperiment={(expId) => {
              if (expId) setCurrentExpId(expId);
              setActiveTab('SIMULATOR');
              setActiveSection('EXPERIMENTS');
            }}
            onOpenWorkbench={(practiceExpId, practiceSubId) => {
              if (practiceExpId) {
                const exp = getExperimentById(practiceExpId);
                const subId = practiceSubId || exp?.subCircuits[0]?.id || '';
                setWorkbenchSession(prev => ({
                  ...prev,
                  practiceExpId,
                  practiceSubId: subId,
                }));
              }
              setActiveSection('WORKBENCH');
            }}
          />
        </main>
      )}

      {/* SECTION 2: CUSTOM BREADBOARD WORKBENCH */}
      {activeSection === 'WORKBENCH' && (
        <main className="flex-1">
          <CustomWorkbench
            session={workbenchSession}
            onUpdateSession={setWorkbenchSession}
            seqMem={workbenchSeqMemRef.current}
            onResetSeqMem={() => {
              workbenchSeqMemRef.current = createEmptySeqMemory();
            }}
          />
        </main>
      )}

      {/* SECTION 1: EXPERIMENT GUIDES & INTERACTIVE SIMULATOR */}
      {activeSection === 'EXPERIMENTS' && (
        <>
          {/* Sub-Header: Subcircuit Variants & Navigation Tabs */}
          <div className="bg-slate-900/90 border-b border-slate-800 backdrop-blur sticky top-[57px] sm:top-[61px] z-20 shadow-md">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              {/* Subcircuit Variant Badges */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-0.5 no-scrollbar scroll-smooth">
                {currentExp.subCircuits.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setCurrentSubId(sub.id)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                      sub.id === currentSub.id
                        ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>

              {/* Feature Navigation Tabs + Separate Link to Workbench */}
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar scroll-smooth">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-[11px] sm:text-xs shrink-0">
                  {[
                    { id: 'SIMULATOR', label: 'Simulator', icon: '⚡' },
                    { id: 'THEORY', label: 'Theory', icon: '📖' },
                    { id: 'OBSERVATIONS', label: 'Observations', icon: '📋' },
                    { id: 'VIVA', label: 'Viva', icon: '🎓' },
                    { id: 'QUIZ', label: 'Quiz', icon: '✍' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as ActiveTab)}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                        activeTab === tab.id
                          ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setWorkbenchSession(prev => ({
                      ...prev,
                      practiceExpId: currentExp.id,
                      practiceSubId: currentSub.id,
                    }));
                    setActiveSection('WORKBENCH');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 text-amber-300 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-colors shrink-0"
                >
                  🛠 Practice in Workbench →
                </button>
              </div>
            </div>
          </div>

          {/* 3. Main Workspace Area */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6">
        {/* TAB 1: CIRCUIT SIMULATOR */}
        {activeTab === 'SIMULATOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* Left Column: Virtual Breadboard Canvas (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col gap-3.5 sm:gap-4">
              {/* Circuit Header & Polarity Legend */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                    <span>{currentSub.name}</span>
                    {currentSub.subtitle && (
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {currentSub.subtitle}
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{currentSub.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span> 5V HIGH (1)
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span> 0V LOW (0)
                  </span>
                </div>
              </div>

              {/* Dedicated Mobile Quick Input Controls Bar (Direct large touch targets) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span> Input Switches:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentSub.inputs.map(inp => {
                      const sw = circuit.switches[inp.id];
                      const isHigh = (switchStates[inp.id] ?? sw?.state ?? inp.defaultState) === DigitalSignal.HIGH;
                      return (
                        <button
                          key={inp.id}
                          onClick={() => handleToggleSwitch(inp.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all active:scale-95 shadow-sm ${
                            isHigh
                              ? 'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30'
                              : 'bg-slate-950 border-slate-700 text-blue-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-slate-400">{inp.label}:</span>
                          <span className={`w-2 h-2 rounded-full ${isHigh ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                          <span>{isHigh ? '1 (HIGH)' : '0 (LOW)'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const reset: Record<string, DigitalSignal> = {};
                    for (const inp of currentSub.inputs) reset[inp.id] = DigitalSignal.LOW;
                    setSwitchStates(reset);
                    setSwitchHistory([reset]);
                    setActiveRowIndex(null);
                    setSimTick(t => t + 1);
                  }}
                  className="w-full sm:w-auto px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors shrink-0 text-center"
                >
                  Reset All to 0
                </button>
              </div>

              {/* Breadboard Visual Canvas */}
              <BreadboardSVG
                config={currentSub}
                circuit={circuit}
                highlightComponentId={highlightedComponentId}
                activeStep={currentSub.explanationSteps[activeExplainStep]}
                onToggleSwitch={handleToggleSwitch}
                onSelectComponent={(comp) => setSelectedComp(comp)}
              />

              {/* Interactive Tip */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-sky-400 font-bold shrink-0">💡 Tip:</span>
                  <span className="text-[11px] sm:text-xs">Use the quick toggle buttons above or tap on breadboard switches/ICs directly. Pinch or use +/- to zoom.</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Panels (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5">
              {/* Bidirectional Truth Table */}
              <TruthTable
                truthTable={currentSub.truthTable}
                inputLabels={inputLabels}
                outputLabels={outputLabels}
                currentInputs={currentInputsMap}
                activeRowIndex={activeRowIndex}
                onSelectRowInputs={handleSelectRowInputs}
              />

              {/* Step-by-Step Circuit Explainer */}
              <CircuitExplainer
                steps={currentSub.explanationSteps}
                primaryFormula={currentSub.booleanExpression.primary}
                intermediateFormulas={currentSub.booleanExpression.intermediate}
                activeStepIndex={activeExplainStep}
                onStepChange={(idx) => setActiveExplainStep(idx)}
              />

              {/* Live Component & Pin Inspector */}
              <ComponentInspector
                selectedComponent={selectedComp}
                circuit={circuit}
                onClose={() => setSelectedComp(null)}
              />
            </div>
          </div>
        )}

        {/* TAB 3: THEORY & APPARATUS */}
        {activeTab === 'THEORY' && (
          <div className="max-w-4xl mx-auto">
            <TheoryPanel experiment={currentExp} />
          </div>
        )}

        {/* TAB 4: OBSERVATION TABLE */}
        {activeTab === 'OBSERVATIONS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5">
              <BreadboardSVG
                config={currentSub}
                circuit={circuit}
                onToggleSwitch={handleToggleSwitch}
              />
            </div>
            <div className="lg:col-span-7">
              <ObservationTable
                config={currentSub}
                circuit={circuit}
                observations={observations}
                onRecordCurrentState={handleRecordObservation}
                onClearObservations={() => setObservations([])}
              />
            </div>
          </div>
        )}

        {/* TAB 5: VIVA-VOCE */}
        {activeTab === 'VIVA' && (
          <div className="max-w-4xl mx-auto">
            <VivaVoce questions={currentExp.vivaQuestions} />
          </div>
        )}

        {/* TAB 6: PRACTICE QUIZ */}
        {activeTab === 'QUIZ' && (
          <div className="max-w-4xl mx-auto">
            <PracticeQuiz questions={currentExp.quizQuestions} />
          </div>
        )}
          </main>
        </>
      )}

      {/* 4. Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          Digital Electronics Interactive Lab Simulator • Developed for CMP 203 Digital System Design • Single Source of Truth Logic Engine
        </p>
      </footer>
    </div>
  );
};

export default App;
