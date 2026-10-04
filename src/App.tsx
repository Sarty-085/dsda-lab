import React, { useState, useMemo, useEffect } from 'react';
import { EXPERIMENTS, getExperimentById } from './experiments/registry';
import { buildCircuitFromConfig } from './simulator/circuitFactory';
import { DigitalSignal } from './simulator/engine/types';

import { Header } from './components/layout/Header';
import { BreadboardSVG } from './components/breadboard/BreadboardSVG';
import { TruthTable } from './components/panels/TruthTable';
import { CircuitExplainer } from './components/panels/CircuitExplainer';
import { ComponentInspector } from './components/panels/ComponentInspector';
import { BuildModePanel } from './components/panels/BuildModePanel';
import { VivaVoce } from './components/panels/VivaVoce';
import { PracticeQuiz } from './components/panels/PracticeQuiz';
import { ObservationTable } from './components/panels/ObservationTable';
import { TheoryPanel } from './components/panels/TheoryPanel';

type ActiveTab = 'SIMULATOR' | 'THEORY' | 'BUILD' | 'OBSERVATIONS' | 'VIVA' | 'QUIZ';

export const App: React.FC = () => {
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

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('SIMULATOR');

  // Input switch toggle states
  const [switchStates, setSwitchStates] = useState<Record<string, DigitalSignal>>({});

  // Build Mode state
  const [userPlacedWireIds, setUserPlacedWireIds] = useState<string[]>([]);
  const [pendingWireStart, setPendingWireStart] = useState<{ row: number; col: string; pinId?: string } | null>(null);
  const [selectedTargetWireId, setSelectedTargetWireId] = useState<string | null>(null);
  const [buildFeedbackMessage, setBuildFeedbackMessage] = useState<string | null>(null);

  // Circuit instance & dynamic simulation revision ticker
  const [simTick, setSimTick] = useState<number>(0);
  const circuit = useMemo(() => {
    const c = activeTab === 'BUILD'
      ? buildCircuitFromConfig(currentSub, userPlacedWireIds)
      : buildCircuitFromConfig(currentSub);
    if (Object.keys(switchStates).length > 0) {
      c.setSwitches(switchStates);
    }
    return c;
  }, [currentSub, activeTab, userPlacedWireIds, switchStates]);

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

  // Reset build mode when subcircuit changes
  useEffect(() => {
    setUserPlacedWireIds([]);
    setPendingWireStart(null);
    setSelectedTargetWireId(null);
    setBuildFeedbackMessage(null);
    setActiveExplainStep(0);
    setSelectedComp(null);
    setSwitchStates({});
  }, [currentSubId]);

  // Handle Switch Toggle
  const handleToggleSwitch = (switchId: string) => {
    const currentSig = switchStates[switchId] ?? circuit.switches[switchId]?.state ?? DigitalSignal.LOW;
    const nextSignal = currentSig === DigitalSignal.HIGH ? DigitalSignal.LOW : DigitalSignal.HIGH;
    setSwitchStates(prev => ({ ...prev, [switchId]: nextSignal }));
    setSimTick(t => t + 1);
  };

  // Handle Truth Table row selection (set circuit inputs from table)
  const handleSelectRowInputs = (newInputs: Record<string, DigitalSignal>) => {
    const switchUpdates: Record<string, DigitalSignal> = {};
    for (const [inKey, sig] of Object.entries(newInputs)) {
      // Find matching input switch ID
      const matched = currentSub.inputs.find(
        i => i.label.toLowerCase() === inKey.toLowerCase() || i.id.toLowerCase().includes(inKey.toLowerCase())
      );
      if (matched) {
        switchUpdates[matched.id] = sig;
      }
    }
    setSwitchStates(prev => ({ ...prev, ...switchUpdates }));
    setSimTick(t => t + 1);
  };

  // Helper to check electrical conductivity equivalence on breadboard
  const areHolesElectricallyConnected = (
    h1: { row: number; col: string },
    h2: { row: number; col: string }
  ) => {
    const c1 = h1.col.toUpperCase();
    const c2 = h2.col.toUpperCase();
    // Identical hole
    if (h1.row === h2.row && c1 === c2) return true;

    // Power rails: all holes in same rail are connected along entire column
    if ((c1 === 'L+' && c2 === 'L+') || (c1 === 'R+' && c2 === 'R+')) return true;
    if ((c1 === 'L-' && c2 === 'L-') || (c1 === 'R-' && c2 === 'R-')) return true;

    // Terminal strips: holes in same row and same half (A-E or F-J) share spring clip
    const isLeftHalf = (c: string) => ['A', 'B', 'C', 'D', 'E'].includes(c);
    const isRightHalf = (c: string) => ['F', 'G', 'H', 'I', 'J'].includes(c);
    if (h1.row === h2.row) {
      if (isLeftHalf(c1) && isLeftHalf(c2)) return true;
      if (isRightHalf(c1) && isRightHalf(c2)) return true;
    }
    return false;
  };

  // Build Mode: Handle Hole Click for Wire Placement with electrical equivalence
  const handleHoleClick = (hole: { row: number; col: string; pinId?: string }) => {
    if (activeTab !== 'BUILD') return;

    if (!pendingWireStart) {
      // Set start point
      setPendingWireStart(hole);
      setBuildFeedbackMessage(`Anchor set at ${hole.col}${hole.row}. Now click destination hole.`);
    } else {
      const startHole = pendingWireStart;
      const endHole = hole;

      // If user clicked the exact same hole, cancel
      if (startHole.row === endHole.row && startHole.col.toUpperCase() === endHole.col.toUpperCase()) {
        setPendingWireStart(null);
        setBuildFeedbackMessage('Cancelled: Start and destination cannot be the exact same hole.');
        return;
      }

      // Check against all unplaced wires in current subcircuit
      const matchedWire = currentSub.wires.find(w => {
        if (userPlacedWireIds.includes(w.id)) return false;

        const forwardMatch =
          areHolesElectricallyConnected(w.from, startHole) &&
          areHolesElectricallyConnected(w.to, endHole);

        const reverseMatch =
          areHolesElectricallyConnected(w.from, endHole) &&
          areHolesElectricallyConnected(w.to, startHole);

        return forwardMatch || reverseMatch;
      });

      if (matchedWire) {
        setUserPlacedWireIds(prev => [...prev, matchedWire.id]);
        setPendingWireStart(null);
        setSelectedTargetWireId(null);
        setBuildFeedbackMessage(`Connected: ${matchedWire.label ?? matchedWire.id}!`);
      } else {
        if (areHolesElectricallyConnected(startHole, endHole)) {
          setBuildFeedbackMessage(`Holes ${startHole.col}${startHole.row} and ${endHole.col}${endHole.row} already share internal spring clip.`);
        } else {
          setBuildFeedbackMessage(`No circuit wire connects ${startHole.col}${startHole.row} to ${endHole.col}${endHole.row}. Check the roadmap!`);
        }
        setPendingWireStart(null);
      }
    }
  };

  // Place single wire directly (1-click connect)
  const handlePlaceSingleWire = (wireId: string) => {
    if (!userPlacedWireIds.includes(wireId)) {
      setUserPlacedWireIds(prev => [...prev, wireId]);
      setPendingWireStart(null);
      setSelectedTargetWireId(null);
      const wire = currentSub.wires.find(w => w.id === wireId);
      setBuildFeedbackMessage(`Connected: ${wire?.label ?? wireId}!`);
    }
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
        selectedExp={currentExp}
        selectedSub={currentSub}
        onSelectExp={(id) => {
          setCurrentExpId(id);
        }}
        onSelectSub={(subId) => {
          setCurrentSubId(subId);
        }}
      />

      {/* 2. Sub-Header: Subcircuit Variants & Navigation Tabs */}
      <div className="bg-slate-900/80 border-b border-slate-800 backdrop-blur sticky top-[61px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Subcircuit Variant Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {currentExp.subCircuits.map(sub => (
              <button
                key={sub.id}
                onClick={() => setCurrentSubId(sub.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  sub.id === currentSub.id
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>

          {/* Feature Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 overflow-x-auto w-full sm:w-auto text-xs">
            {[
              { id: 'SIMULATOR', label: 'Circuit Simulator', icon: '⚡' },
              { id: 'BUILD', label: 'Build Mode', icon: '🛠' },
              { id: 'THEORY', label: 'Theory & Apparatus', icon: '📖' },
              { id: 'OBSERVATIONS', label: 'Observations', icon: '📋' },
              { id: 'VIVA', label: 'Viva-Voce', icon: '🎓' },
              { id: 'QUIZ', label: 'Practice Quiz', icon: '✍' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* TAB 1: CIRCUIT SIMULATOR */}
        {activeTab === 'SIMULATOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Virtual Breadboard Canvas (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>{currentSub.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {currentSub.subtitle ?? ''}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">{currentSub.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> 5V HIGH
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> 0V LOW
                  </span>
                </div>
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

              {/* Live Signal Legend & Tip */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-sky-400 font-bold">💡 Interactive Tip:</span>
                  <span>Click switches on the left to toggle bits (0/1). Click ICs or wires to inspect internal signals.</span>
                </div>
                <button
                  onClick={() => {
                    // Reset all inputs to LOW
                    const reset: Record<string, DigitalSignal> = {};
                    for (const inp of currentSub.inputs) reset[inp.id] = DigitalSignal.LOW;
                    setSwitchStates(reset);
                    setSimTick(t => t + 1);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                >
                  Reset Inputs (All 0)
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Panels (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Bidirectional Truth Table */}
              <TruthTable
                truthTable={currentSub.truthTable}
                inputLabels={inputLabels}
                outputLabels={outputLabels}
                currentInputs={currentInputsMap}
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

        {/* TAB 2: PRACTICAL BUILD MODE */}
        {activeTab === 'BUILD' && (() => {
          const unplacedWires = currentSub.wires.filter(w => !userPlacedWireIds.includes(w.id));
          const currentTargetWire = unplacedWires.find(w => w.id === selectedTargetWireId) || unplacedWires[0] || null;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                    <span>🛠 Assembly Canvas</span>
                    <span className="text-xs font-normal text-slate-400">
                      ({userPlacedWireIds.length}/{currentSub.wires.length} wires connected)
                    </span>
                  </div>
                  {buildFeedbackMessage && (
                    <div className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-amber-500/30 text-amber-300 font-mono animate-fade-in">
                      {buildFeedbackMessage}
                    </div>
                  )}
                </div>

                <BreadboardSVG
                  config={currentSub}
                  circuit={circuit}
                  isBuildMode={true}
                  userPlacedWireIds={userPlacedWireIds}
                  pendingWireStart={pendingWireStart}
                  onHoleClick={handleHoleClick}
                  onToggleSwitch={handleToggleSwitch}
                  targetWire={currentTargetWire}
                  buildStatusMessage={buildFeedbackMessage}
                />
              </div>

              <div className="lg:col-span-5 flex flex-col gap-5">
                <BuildModePanel
                  config={currentSub}
                  userPlacedWireIds={userPlacedWireIds}
                  pendingWireStart={pendingWireStart}
                  onClearWires={() => {
                    setUserPlacedWireIds([]);
                    setPendingWireStart(null);
                    setSelectedTargetWireId(null);
                    setBuildFeedbackMessage(null);
                  }}
                  onCancelPendingWire={() => {
                    setPendingWireStart(null);
                    setBuildFeedbackMessage(null);
                  }}
                  onAutoSolve={() => {
                    setUserPlacedWireIds(currentSub.wires.map(w => w.id));
                    setPendingWireStart(null);
                    setSelectedTargetWireId(null);
                    setBuildFeedbackMessage('All wires connected! Test the circuit using the switches.');
                  }}
                  onPlaceWire={handlePlaceSingleWire}
                  selectedTargetWireId={selectedTargetWireId}
                  onSelectTargetWireId={(wireId) => {
                    setSelectedTargetWireId(wireId);
                    const wire = currentSub.wires.find(w => w.id === wireId);
                    setBuildFeedbackMessage(`Selected target wire: ${wire?.label ?? wireId}`);
                  }}
                />

                {/* Truth table to test once built */}
                <TruthTable
                  truthTable={currentSub.truthTable}
                  inputLabels={inputLabels}
                  outputLabels={outputLabels}
                  currentInputs={currentInputsMap}
                  onSelectRowInputs={handleSelectRowInputs}
                />
              </div>
            </div>
          );
        })()}

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
