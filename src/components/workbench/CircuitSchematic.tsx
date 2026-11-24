import React, { useState } from 'react';
import { SubCircuitConfig } from '../../experiments/types';
import { IC_CATALOG } from '../../simulator/ics/definitions';

interface CircuitSchematicProps {
  subCircuit: SubCircuitConfig;
}

const InputTag: React.FC<{ x: number; y: number; label: string; color?: string }> = ({
  x,
  y,
  label,
  color = '#38bdf8',
}) => (
  <g>
    <rect
      x={x - 22}
      y={y - 9}
      width={24}
      height={18}
      rx={4}
      fill="#0f172a"
      stroke={color}
      strokeWidth={1.3}
    />
    <text
      x={x - 10}
      y={y + 3.5}
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="800"
      fill={color}
      fontFamily="ui-monospace, monospace"
    >
      {label}
    </text>
  </g>
);

const OutLED: React.FC<{
  x: number;
  y: number;
  label: string;
  color?: string;
  withResistor?: boolean;
}> = ({ x, y, label, color = 'red', withResistor = true }) => {
  const fill = color === 'green' ? '#22c55e' : color === 'amber' ? '#f59e0b' : '#ef4444';
  const startX = x;
  const ledX = withResistor ? x + 36 : x + 12;

  return (
    <g>
      {withResistor ? (
        <>
          <line x1={startX} y1={y} x2={startX + 6} y2={y} stroke="#94a3b8" strokeWidth={1.6} />
          <path
            d={`M ${startX + 6} ${y} l 3 -4 l 4 8 l 4 -8 l 4 8 l 3 -4`}
            fill="none"
            stroke="#eab308"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          <text
            x={startX + 15}
            y={y - 7}
            textAnchor="middle"
            fontSize="6.5"
            fill="#fbbf24"
            fontFamily="ui-monospace, monospace"
          >
            330Ω
          </text>
          <line x1={startX + 24} y1={y} x2={ledX} y2={y} stroke="#94a3b8" strokeWidth={1.6} />
        </>
      ) : (
        <line x1={startX} y1={y} x2={ledX} y2={y} stroke="#94a3b8" strokeWidth={1.6} />
      )}
      {/* LED Diode Symbol */}
      <polygon
        points={`${ledX},${y - 6} ${ledX},${y + 6} ${ledX + 10},${y}`}
        fill={fill}
        stroke="#e2e8f0"
        strokeWidth={1}
      />
      <line x1={ledX + 10} y1={y - 6} x2={ledX + 10} y2={y + 6} stroke="#e2e8f0" strokeWidth={1.5} />
      <line x1={ledX + 10} y1={y} x2={ledX + 16} y2={y} stroke="#60a5fa" strokeWidth={1.5} />
      {/* Ground bars */}
      <line x1={ledX + 16} y1={y} x2={ledX + 16} y2={y + 6} stroke="#60a5fa" strokeWidth={1.4} />
      <line x1={ledX + 12} y1={y + 6} x2={ledX + 20} y2={y + 6} stroke="#60a5fa" strokeWidth={1.4} />
      <line x1={ledX + 14} y1={y + 8.5} x2={ledX + 18} y2={y + 8.5} stroke="#60a5fa" strokeWidth={1.2} />
      {/* Output Label */}
      <text
        x={ledX + 21}
        y={y + 3}
        fontSize="8.5"
        fontWeight="800"
        fill="#4ade80"
        fontFamily="ui-monospace, monospace"
      >
        {label}
      </text>
    </g>
  );
};

const PinBadge: React.FC<{ x: number; y: number; pin: string | number; color?: string }> = ({
  x,
  y,
  pin,
  color = '#fbbf24',
}) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    fontSize="7"
    fontWeight="800"
    fill={color}
    fontFamily="ui-monospace, monospace"
  >
    {pin}
  </text>
);

type GateKind = 'NOT' | 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR';

const LogicGateSymbol: React.FC<{
  kind: GateKind;
  x: number;
  y: number;
  icLabel?: string;
  inPins?: (string | number)[];
  outPin?: string | number;
  width?: number;
}> = ({ kind, x, y, icLabel, inPins = [], outPin, width = 34 }) => {
  const h = 28;
  const topY = y - h / 2;
  const botY = y + h / 2;
  const hasBubble = kind === 'NOT' || kind === 'NAND' || kind === 'NOR';
  const bodyEnd = hasBubble ? x + width - 6 : x + width;

  let path = '';
  if (kind === 'NOT') {
    path = `M ${x} ${topY + 2} L ${bodyEnd} ${y} L ${x} ${botY - 2} Z`;
  } else if (kind === 'AND' || kind === 'NAND') {
    const midX = x + width * 0.45;
    path = `M ${x} ${topY} L ${midX} ${topY} A ${width * 0.42} ${h / 2} 0 0 1 ${midX} ${botY} L ${x} ${botY} Z`;
  } else if (kind === 'OR' || kind === 'NOR') {
    path = `M ${x} ${topY} Q ${x + 8} ${y} ${x} ${botY} Q ${x + width * 0.55} ${botY} ${bodyEnd} ${y} Q ${x + width * 0.55} ${topY} ${x} ${topY} Z`;
  } else {
    // XOR
    path = `M ${x + 5} ${topY} Q ${x + 12} ${y} ${x + 5} ${botY} Q ${x + width * 0.6} ${botY} ${bodyEnd} ${y} Q ${x + width * 0.6} ${topY} ${x + 5} ${topY} Z`;
  }

  return (
    <g>
      {kind === 'XOR' && (
        <path
          d={`M ${x} ${topY} Q ${x + 7} ${y} ${x} ${botY}`}
          fill="none"
          stroke="#94a3b8"
          strokeWidth={1.8}
        />
      )}
      <path d={path} fill="#1e293b" stroke="#cbd5e1" strokeWidth={1.8} strokeLinejoin="round" />
      {hasBubble && (
        <circle cx={bodyEnd + 3} cy={y} r={3} fill="#0f172a" stroke="#cbd5e1" strokeWidth={1.6} />
      )}
      {icLabel && (
        <text
          x={x + width / 2 - (kind === 'NOT' ? 4 : 1)}
          y={y + 3}
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="800"
          fill="#94a3b8"
          fontFamily="ui-monospace, monospace"
        >
          {icLabel}
        </text>
      )}
      {/* Input pin badges */}
      {inPins.length === 1 && (
        <PinBadge x={x - 7} y={y - 4} pin={inPins[0]} />
      )}
      {inPins.length === 2 && (
        <>
          <PinBadge x={x - 7} y={y - 10} pin={inPins[0]} />
          <PinBadge x={x - 7} y={y + 13} pin={inPins[1]} />
        </>
      )}
      {inPins.length === 3 && (
        <>
          <PinBadge x={x - 7} y={y - 11} pin={inPins[0]} />
          <PinBadge x={x - 7} y={y - 1} pin={inPins[1]} />
          <PinBadge x={x - 7} y={y + 13} pin={inPins[2]} />
        </>
      )}
      {/* Output pin badge */}
      {outPin !== undefined && (
        <PinBadge x={x + width + 7} y={y - 5} pin={outPin} color="#4ade80" />
      )}
    </g>
  );
};

const renderSchematicContent = (sub: SubCircuitConfig): { width: number; height: number; body: React.ReactNode } => {
  const out = (i: number) => sub.outputs[i] || { label: 'Y', color: 'red' };

  switch (sub.id) {
    // ---------------- EXP 1 ----------------
    case 'not':
      return {
        width: 310,
        height: 110,
        body: (
          <g>
            <InputTag x={42} y={54} label="A" />
            <line x1={44} y1={54} x2={106} y2={54} stroke="#38bdf8" strokeWidth={1.8} />
            <LogicGateSymbol kind="NOT" x={106} y={54} icLabel="7404" inPins={[1]} outPin={2} />
            <line x1={140} y1={54} x2={170} y2={54} stroke="#4ade80" strokeWidth={1.8} />
            <OutLED x={170} y={54} label={out(0).label} color={out(0).color} />
          </g>
        ),
      };

    case 'and':
    case 'or':
    case 'nand':
    case 'nor':
    case 'xor': {
      const kindMap: Record<string, GateKind> = {
        and: 'AND',
        or: 'OR',
        nand: 'NAND',
        nor: 'NOR',
        xor: 'XOR',
      };
      const icMap: Record<string, string> = {
        and: '7408',
        or: '7432',
        nand: '7400',
        nor: '7402',
        xor: '7486',
      };
      const is7402 = sub.id === 'nor';
      return {
        width: 310,
        height: 120,
        body: (
          <g>
            <InputTag x={42} y={42} label="A" />
            <InputTag x={42} y={76} label="B" color="#10b981" />
            <polyline points="44,42 84,42 84,51 108,51" fill="none" stroke="#38bdf8" strokeWidth={1.8} />
            <polyline points="44,76 84,76 84,67 108,67" fill="none" stroke="#10b981" strokeWidth={1.8} />
            <LogicGateSymbol
              kind={kindMap[sub.id]}
              x={108}
              y={59}
              icLabel={icMap[sub.id]}
              inPins={is7402 ? [2, 3] : [1, 2]}
              outPin={is7402 ? 1 : 3}
            />
            <line x1={142} y1={59} x2={172} y2={59} stroke="#4ade80" strokeWidth={1.8} />
            <OutLED x={172} y={59} label={out(0).label} color={out(0).color} />
          </g>
        ),
      };
    }

    // ---------------- EXP 2 ----------------
    case 'nand_as_not':
    case 'nor_as_not': {
      const isNor = sub.id === 'nor_as_not';
      return {
        width: 320,
        height: 115,
        body: (
          <g>
            <InputTag x={42} y={58} label="A" />
            <line x1={44} y1={58} x2={78} y2={58} stroke="#38bdf8" strokeWidth={1.8} />
            <circle cx={78} cy={58} r={2.5} fill="#38bdf8" />
            <polyline points="78,58 78,50 108,50" fill="none" stroke="#38bdf8" strokeWidth={1.8} />
            <polyline points="78,58 78,66 108,66" fill="none" stroke="#38bdf8" strokeWidth={1.8} />
            <LogicGateSymbol
              kind={isNor ? 'NOR' : 'NAND'}
              x={108}
              y={58}
              icLabel={isNor ? '7402' : '7400'}
              inPins={isNor ? [2, 3] : [1, 2]}
              outPin={isNor ? 1 : 3}
            />
            <line x1={142} y1={58} x2={175} y2={58} stroke="#4ade80" strokeWidth={1.8} />
            <OutLED x={175} y={58} label={out(0).label} color={out(0).color} />
          </g>
        ),
      };
    }

    case 'nand_as_and':
    case 'nor_as_or': {
      const isNor = sub.id === 'nor_as_or';
      return {
        width: 350,
        height: 120,
        body: (
          <g>
            <InputTag x={36} y={42} label="A" />
            <InputTag x={36} y={76} label="B" color="#10b981" />
            <polyline points="38,42 66,42 66,51 88,51" fill="none" stroke="#38bdf8" strokeWidth={1.8} />
            <polyline points="38,76 66,76 66,67 88,67" fill="none" stroke="#10b981" strokeWidth={1.8} />
            <LogicGateSymbol
              kind={isNor ? 'NOR' : 'NAND'}
              x={88}
              y={59}
              icLabel="G1"
              inPins={isNor ? [2, 3] : [1, 2]}
              outPin={isNor ? 1 : 3}
            />
            <line x1={122} y1={59} x2={152} y2={59} stroke="#a855f7" strokeWidth={1.8} />
            <circle cx={152} cy={59} r={2.5} fill="#a855f7" />
            <polyline points="152,59 152,51 174,51" fill="none" stroke="#a855f7" strokeWidth={1.8} />
            <polyline points="152,59 152,67 174,67" fill="none" stroke="#a855f7" strokeWidth={1.8} />
            <LogicGateSymbol
              kind={isNor ? 'NOR' : 'NAND'}
              x={174}
              y={59}
              icLabel="G2"
              inPins={isNor ? [5, 6] : [4, 5]}
              outPin={isNor ? 4 : 6}
            />
            <line x1={208} y1={59} x2={236} y2={59} stroke="#4ade80" strokeWidth={1.8} />
            <OutLED x={236} y={59} label={out(0).label} color={out(0).color} />
          </g>
        ),
      };
    }

    case 'nand_as_or':
    case 'nor_as_and': {
      const isNor = sub.id === 'nor_as_and';
      const kind: GateKind = isNor ? 'NOR' : 'NAND';
      return {
        width: 350,
        height: 150,
        body: (
          <g>
            <InputTag x={36} y={42} label="A" />
            <InputTag x={36} y={104} label="B" color="#10b981" />
            <circle cx={62} cy={42} r={2.2} fill="#38bdf8" />
            <polyline points="38,42 62,42 62,34 86,34" fill="none" stroke="#38bdf8" strokeWidth={1.7} />
            <polyline points="62,42 62,50 86,50" fill="none" stroke="#38bdf8" strokeWidth={1.7} />
            <LogicGateSymbol kind={kind} x={86} y={42} icLabel="G1" inPins={isNor ? [2, 3] : [1, 2]} outPin={isNor ? 1 : 3} />

            <circle cx={62} cy={104} r={2.2} fill="#10b981" />
            <polyline points="38,104 62,104 62,96 86,96" fill="none" stroke="#10b981" strokeWidth={1.7} />
            <polyline points="62,104 62,112 86,112" fill="none" stroke="#10b981" strokeWidth={1.7} />
            <LogicGateSymbol kind={kind} x={86} y={104} icLabel="G2" inPins={isNor ? [5, 6] : [4, 5]} outPin={isNor ? 4 : 6} />

            <polyline points="120,42 150,42 150,65 174,65" fill="none" stroke="#a855f7" strokeWidth={1.7} />
            <polyline points="120,104 150,104 150,81 174,81" fill="none" stroke="#ec4899" strokeWidth={1.7} />
            <LogicGateSymbol kind={kind} x={174} y={73} icLabel="G3" inPins={isNor ? [8, 9] : [9, 10]} outPin={isNor ? 10 : 8} />
            <line x1={208} y1={73} x2={238} y2={73} stroke="#4ade80" strokeWidth={1.8} />
            <OutLED x={238} y={73} label={out(0).label} color={out(0).color} />
          </g>
        ),
      };
    }

    // ---------------- EXP 3 ----------------
    case 'half_adder':
      return {
        width: 340,
        height: 150,
        body: (
          <g>
            <InputTag x={36} y={40} label="A" />
            <InputTag x={36} y={106} label="B" color="#10b981" />
            {/* Bus lines */}
            <line x1={38} y1={40} x2={108} y2={40} stroke="#38bdf8" strokeWidth={1.7} />
            <circle cx={66} cy={40} r={2.3} fill="#38bdf8" />
            <polyline points="66,40 66,98 108,98" fill="none" stroke="#38bdf8" strokeWidth={1.7} />

            <line x1={38} y1={106} x2={108} y2={106} stroke="#10b981" strokeWidth={1.7} />
            <circle cx={78} cy={106} r={2.3} fill="#10b981" />
            <polyline points="78,106 78,56 108,56" fill="none" stroke="#10b981" strokeWidth={1.7} />

            <LogicGateSymbol kind="XOR" x={108} y={48} icLabel="7486" inPins={[1, 2]} outPin={3} />
            <LogicGateSymbol kind="AND" x={108} y={104} icLabel="7408" inPins={[1, 2]} outPin={3} />

            <line x1={142} y1={48} x2={198} y2={48} stroke="#4ade80" strokeWidth={1.8} />
            <OutLED x={198} y={48} label="Sum" color="green" />

            <line x1={142} y1={104} x2={198} y2={104} stroke="#f87171" strokeWidth={1.8} />
            <OutLED x={198} y={104} label="Carry" color="red" />
          </g>
        ),
      };

    case 'full_adder':
      return {
        width: 380,
        height: 185,
        body: (
          <g>
            <InputTag x={34} y={34} label="A" />
            <InputTag x={34} y={62} label="B" color="#10b981" />
            <InputTag x={34} y={108} label="Cin" color="#f59e0b" />

            {/* XOR1 */}
            <line x1={36} y1={34} x2={86} y2={34} stroke="#38bdf8" strokeWidth={1.5} />
            <circle cx={52} cy={34} r={2} fill="#38bdf8" />
            <polyline points="52,34 52,140 162,140" fill="none" stroke="#38bdf8" strokeWidth={1.3} opacity={0.85} />

            <line x1={36} y1={62} x2={86} y2={62} stroke="#10b981" strokeWidth={1.5} />
            <circle cx={60} cy={62} r={2} fill="#10b981" />
            <polyline points="60,62 60,156 162,156" fill="none" stroke="#10b981" strokeWidth={1.3} opacity={0.85} />

            <LogicGateSymbol kind="XOR" x={86} y={48} icLabel="7486" inPins={[1, 2]} outPin={3} />

            {/* XOR1 out -> XOR2 (pin 4) & AND1 (pin 1) */}
            <polyline points="120,48 162,48" fill="none" stroke="#a855f7" strokeWidth={1.6} />
            <circle cx={136} cy={48} r={2.2} fill="#a855f7" />
            <polyline points="136,48 136,102 162,102" fill="none" stroke="#a855f7" strokeWidth={1.5} />

            {/* Cin -> XOR2 (pin 5) & AND1 (pin 2) */}
            <polyline points="36,108 148,108 148,64 162,64" fill="none" stroke="#f59e0b" strokeWidth={1.5} />
            <circle cx={148} cy={108} r={2.2} fill="#f59e0b" />
            <polyline points="148,108 148,118 162,118" fill="none" stroke="#f59e0b" strokeWidth={1.5} />

            <LogicGateSymbol kind="XOR" x={162} y={56} icLabel="7486" inPins={[4, 5]} outPin={6} />
            <line x1={196} y1={56} x2={258} y2={56} stroke="#4ade80" strokeWidth={1.8} />
            <OutLED x={258} y={56} label="Sum" color="green" />

            <LogicGateSymbol kind="AND" x={162} y={110} icLabel="7408" inPins={[1, 2]} outPin={3} />
            <LogicGateSymbol kind="AND" x={162} y={148} icLabel="7408" inPins={[4, 5]} outPin={6} />

            <polyline points="196,110 218,110 218,121 232,121" fill="none" stroke="#06b6d4" strokeWidth={1.5} />
            <polyline points="196,148 218,148 218,137 232,137" fill="none" stroke="#a855f7" strokeWidth={1.5} />

            <LogicGateSymbol kind="OR" x={232} y={129} icLabel="7432" inPins={[1, 2]} outPin={3} />
            <line x1={266} y1={129} x2={280} y2={129} stroke="#ef4444" strokeWidth={1.8} />
            <OutLED x={280} y={129} label="Cout" color="red" />
          </g>
        ),
      };

    // ---------------- EXP 4 ----------------
    case 'half_subtractor':
      return {
        width: 350,
        height: 155,
        body: (
          <g>
            <InputTag x={36} y={40} label="A" />
            <InputTag x={36} y={112} label="B" color="#10b981" />

            <line x1={38} y1={40} x2={126} y2={40} stroke="#38bdf8" strokeWidth={1.7} />
            <circle cx={60} cy={40} r={2.2} fill="#38bdf8" />
            <polyline points="60,40 60,96 76,96" fill="none" stroke="#38bdf8" strokeWidth={1.6} />

            <LogicGateSymbol kind="NOT" x={76} y={96} icLabel="7404" inPins={[1]} outPin={2} width={28} />
            <line x1={104} y1={96} x2={126} y2={96} stroke="#ec4899" strokeWidth={1.6} />

            <line x1={38} y1={112} x2={126} y2={112} stroke="#10b981" strokeWidth={1.7} />
            <circle cx={68} cy={112} r={2.2} fill="#10b981" />
            <polyline points="68,112 68,56 126,56" fill="none" stroke="#10b981" strokeWidth={1.6} />

            <LogicGateSymbol kind="XOR" x={126} y={48} icLabel="7486" inPins={[1, 2]} outPin={3} />
            <LogicGateSymbol kind="AND" x={126} y={104} icLabel="7408" inPins={[1, 2]} outPin={3} />

            <line x1={160} y1={48} x2={208} y2={48} stroke="#f59e0b" strokeWidth={1.8} />
            <OutLED x={208} y={48} label="Diff" color="amber" />

            <line x1={160} y1={104} x2={208} y2={104} stroke="#ef4444" strokeWidth={1.8} />
            <OutLED x={208} y={104} label="Borr" color="red" />
          </g>
        ),
      };

    case 'full_subtractor':
      return {
        width: 390,
        height: 195,
        body: (
          <g>
            <InputTag x={32} y={34} label="A" />
            <InputTag x={32} y={62} label="B" color="#10b981" />
            <InputTag x={32} y={114} label="Bin" color="#f59e0b" />

            <line x1={34} y1={34} x2={78} y2={34} stroke="#38bdf8" strokeWidth={1.5} />
            <line x1={34} y1={62} x2={78} y2={62} stroke="#10b981" strokeWidth={1.5} />
            <LogicGateSymbol kind="XOR" x={78} y={48} icLabel="7486" inPins={[1, 2]} outPin={3} />

            {/* NOT2(A) for Borrow2 */}
            <circle cx={46} cy={34} r={2} fill="#38bdf8" />
            <polyline points="46,34 46,154 78,154" fill="none" stroke="#38bdf8" strokeWidth={1.3} />
            <LogicGateSymbol kind="NOT" x={78} y={154} icLabel="7404" inPins={[3]} outPin={4} width={28} />

            {/* NOT1(A⊕B) for Borrow1 */}
            <line x1={112} y1={48} x2={166} y2={48} stroke="#a855f7" strokeWidth={1.5} />
            <circle cx={126} cy={48} r={2} fill="#a855f7" />
            <polyline points="126,48 126,104 140,104" fill="none" stroke="#a855f7" strokeWidth={1.4} />
            <LogicGateSymbol kind="NOT" x={140} y={104} icLabel="7404" inPins={[1]} outPin={2} width={26} />
            <line x1={166} y1={104} x2={182} y2={104} stroke="#ec4899" strokeWidth={1.4} />

            {/* XOR2 Diff */}
            <polyline points="34,114 148,114 148,64 166,64" fill="none" stroke="#f59e0b" strokeWidth={1.4} />
            <circle cx={148} cy={114} r={2} fill="#f59e0b" />
            <polyline points="148,114 148,120 182,120" fill="none" stroke="#f59e0b" strokeWidth={1.4} />
            <LogicGateSymbol kind="XOR" x={166} y={56} icLabel="7486" inPins={[4, 5]} outPin={6} />
            <line x1={200} y1={56} x2={270} y2={56} stroke="#f59e0b" strokeWidth={1.7} />
            <OutLED x={270} y={56} label="Diff" color="amber" />

            {/* AND1 & AND2 */}
            <LogicGateSymbol kind="AND" x={182} y={112} icLabel="7408" inPins={[1, 2]} outPin={3} />
            <line x1={106} y1={154} x2={182} y2={154} stroke="#06b6d4" strokeWidth={1.4} />
            <circle cx={56} cy={62} r={2} fill="#10b981" />
            <polyline points="56,62 56,170 182,170" fill="none" stroke="#10b981" strokeWidth={1.3} />
            <LogicGateSymbol kind="AND" x={182} y={162} icLabel="7408" inPins={[4, 5]} outPin={6} />

            {/* OR Borrow */}
            <polyline points="216,112 232,112 232,128 244,128" fill="none" stroke="#6366f1" strokeWidth={1.5} />
            <polyline points="216,162 232,162 232,144 244,144" fill="none" stroke="#8b5cf6" strokeWidth={1.5} />
            <LogicGateSymbol kind="OR" x={244} y={136} icLabel="7432" inPins={[1, 2]} outPin={3} />
            <line x1={278} y1={136} x2={292} y2={136} stroke="#ef4444" strokeWidth={1.7} />
            <OutLED x={292} y={136} label="Borr" color="red" />
          </g>
        ),
      };

    // ---------------- EXP 5 ----------------
    case 'bin_to_gray':
      return {
        width: 340,
        height: 195,
        body: (
          <g>
            {['B3', 'B2', 'B1', 'B0'].map((lbl, i) => (
              <InputTag
                key={lbl}
                x={36}
                y={28 + i * 44}
                label={lbl}
                color={['#38bdf8', '#10b981', '#f59e0b', '#ec4899'][i]}
              />
            ))}
            {/* B3 -> G3 direct */}
            <line x1={38} y1={28} x2={208} y2={28} stroke="#38bdf8" strokeWidth={1.7} />
            <circle cx={68} cy={28} r={2.2} fill="#38bdf8" />
            <polyline points="68,28 68,62 114,62" fill="none" stroke="#38bdf8" strokeWidth={1.5} />
            <OutLED x={208} y={28} label="G3" color="green" />

            {/* XOR1: B3^B2 -> G2 */}
            <line x1={38} y1={72} x2={114} y2={78} stroke="#10b981" strokeWidth={1.5} />
            <circle cx={62} cy={74} r={2.2} fill="#10b981" />
            <polyline points="62,74 62,106 114,106" fill="none" stroke="#10b981" strokeWidth={1.5} />
            <LogicGateSymbol kind="XOR" x={114} y={70} icLabel="7486" inPins={[1, 2]} outPin={3} />
            <line x1={148} y1={70} x2={208} y2={70} stroke="#22c55e" strokeWidth={1.6} />
            <OutLED x={208} y={70} label="G2" color="green" />

            {/* XOR2: B2^B1 -> G1 */}
            <line x1={38} y1={116} x2={114} y2={122} stroke="#f59e0b" strokeWidth={1.5} />
            <circle cx={72} cy={118} r={2.2} fill="#f59e0b" />
            <polyline points="72,118 72,150 114,150" fill="none" stroke="#f59e0b" strokeWidth={1.5} />
            <LogicGateSymbol kind="XOR" x={114} y={114} icLabel="7486" inPins={[4, 5]} outPin={6} />
            <line x1={148} y1={114} x2={208} y2={114} stroke="#22c55e" strokeWidth={1.6} />
            <OutLED x={208} y={114} label="G1" color="green" />

            {/* XOR3: B1^B0 -> G0 */}
            <line x1={38} y1={160} x2={114} y2={166} stroke="#ec4899" strokeWidth={1.5} />
            <LogicGateSymbol kind="XOR" x={114} y={158} icLabel="7486" inPins={[9, 10]} outPin={8} />
            <line x1={148} y1={158} x2={208} y2={158} stroke="#22c55e" strokeWidth={1.6} />
            <OutLED x={208} y={158} label="G0" color="green" />
          </g>
        ),
      };

    case 'gray_to_bin':
      return {
        width: 340,
        height: 195,
        body: (
          <g>
            {['G3', 'G2', 'G1', 'G0'].map((lbl, i) => (
              <InputTag
                key={lbl}
                x={36}
                y={28 + i * 44}
                label={lbl}
                color={['#38bdf8', '#10b981', '#f59e0b', '#ec4899'][i]}
              />
            ))}
            {/* G3 -> B3 */}
            <line x1={38} y1={28} x2={208} y2={28} stroke="#38bdf8" strokeWidth={1.7} />
            <circle cx={68} cy={28} r={2.2} fill="#38bdf8" />
            <polyline points="68,28 68,62 114,62" fill="none" stroke="#38bdf8" strokeWidth={1.5} />
            <OutLED x={208} y={28} label="B3" color="green" />

            {/* XOR1: B3^G2 -> B2 (Pin 3) */}
            <line x1={38} y1={72} x2={114} y2={78} stroke="#10b981" strokeWidth={1.5} />
            <LogicGateSymbol kind="XOR" x={114} y={70} icLabel="7486" inPins={[1, 2]} outPin={3} />
            <line x1={148} y1={70} x2={208} y2={70} stroke="#22c55e" strokeWidth={1.6} />
            <circle cx={158} cy={70} r={2.2} fill="#22c55e" />
            <polyline points="158,70 158,90 96,90 96,106 114,106" fill="none" stroke="#22c55e" strokeWidth={1.3} />
            <OutLED x={208} y={70} label="B2" color="green" />

            {/* XOR2: B2^G1 -> B1 (Pin 6) */}
            <line x1={38} y1={116} x2={114} y2={122} stroke="#f59e0b" strokeWidth={1.5} />
            <LogicGateSymbol kind="XOR" x={114} y={114} icLabel="7486" inPins={[4, 5]} outPin={6} />
            <line x1={148} y1={114} x2={208} y2={114} stroke="#22c55e" strokeWidth={1.6} />
            <circle cx={158} cy={114} r={2.2} fill="#22c55e" />
            <polyline points="158,114 158,134 96,134 96,150 114,150" fill="none" stroke="#22c55e" strokeWidth={1.3} />
            <OutLED x={208} y={114} label="B1" color="green" />

            {/* XOR3: B1^G0 -> B0 (Pin 8) */}
            <line x1={38} y1={160} x2={114} y2={166} stroke="#ec4899" strokeWidth={1.5} />
            <LogicGateSymbol kind="XOR" x={114} y={158} icLabel="7486" inPins={[9, 10]} outPin={8} />
            <line x1={148} y1={158} x2={208} y2={158} stroke="#22c55e" strokeWidth={1.6} />
            <OutLED x={208} y={158} label="B0" color="green" />
          </g>
        ),
      };

    // ---------------- EXP 6 ----------------
    case 'bcd_adder':
      return {
        width: 410,
        height: 215,
        body: (
          <g fontFamily="ui-monospace, monospace">
            {/* Adder 1 Box */}
            <rect x={24} y={18} width={118} height={86} rx={6} fill="#1e293b" stroke="#38bdf8" strokeWidth={1.5} />
            <text x={83} y={35} textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#38bdf8">IC 7483 #1 (Adder 1)</text>
            <text x={32} y={50} fontSize="7" fill="#cbd5e1">A3..A0: P1,3,8,10</text>
            <text x={32} y={63} fontSize="7" fill="#10b981">B3..B0: P16,4,7,11</text>
            <text x={32} y={76} fontSize="7" fill="#94a3b8">C0(P13)→GND | C4:P14</text>
            <text x={32} y={91} fontSize="7" fill="#f59e0b">S3..S0: P15,2,6,9</text>

            {/* Bus from Adder 1 to Adder 2 */}
            <polyline points="83,104 83,124" fill="none" stroke="#8b5cf6" strokeWidth={1.8} />
            <text x={87} y={117} fontSize="6.8" fill="#c4b5fd">S3..S0 → A3..A0</text>

            {/* Adder 2 Box */}
            <rect x={24} y={124} width={118} height={74} rx={6} fill="#1e293b" stroke="#22c55e" strokeWidth={1.5} />
            <text x={83} y={140} textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#4ade80">IC 7483 #2 (+6)</text>
            <text x={32} y={154} fontSize="7" fill="#cbd5e1">B3(16)=0, B0(11)=0</text>
            <text x={32} y={167} fontSize="7" fill="#f87171">B2(4), B1(7) ← C&apos;</text>
            <text x={32} y={184} fontSize="7" fill="#4ade80">S&apos;3..S&apos;0 → LEDs (15,2,6,9)</text>

            {/* Correction Logic */}
            <line x1={142} y1={48} x2={196} y2={48} stroke="#f59e0b" strokeWidth={1.4} />
            <text x={169} y={43} textAnchor="middle" fontSize="6.5" fill="#fbbf24">S2(2),S1(6)</text>
            <LogicGateSymbol kind="OR" x={196} y={50} icLabel="7432" inPins={[1, 2]} outPin={3} />

            <polyline points="142,74 236,74" fill="none" stroke="#ec4899" strokeWidth={1.4} />
            <text x={175} y={70} textAnchor="middle" fontSize="6.5" fill="#f472b6">S3(P15)</text>
            <polyline points="230,50 242,50 242,60 256,60" fill="none" stroke="#f59e0b" strokeWidth={1.4} />
            <polyline points="236,74 256,74" fill="none" stroke="#ec4899" strokeWidth={1.4} />
            <LogicGateSymbol kind="AND" x={256} y={67} icLabel="7408" inPins={[2, 1]} outPin={3} />

            <polyline points="290,67 306,67 306,88 320,88" fill="none" stroke="#f472b6" strokeWidth={1.5} />
            <polyline points="142,96 296,96 296,104 320,104" fill="none" stroke="#ef4444" strokeWidth={1.5} />
            <text x={225} y={92} fontSize="6.5" fill="#f87171">C4 (Pin 14)</text>

            <LogicGateSymbol kind="OR" x={320} y={96} icLabel="7432" inPins={[4, 5]} outPin={6} />
            {/* C' output & feedback */}
            <circle cx={366} cy={96} r={2.3} fill="#ef4444" />
            <line x1={354} y1={96} x2={366} y2={96} stroke="#ef4444" strokeWidth={1.8} />
            <polyline points="366,96 366,162 142,162" fill="none" stroke="#ef4444" strokeWidth={1.4} strokeDasharray="3 2" />
            <text x={254} y={157} textAnchor="middle" fontSize="6.8" fontWeight="700" fill="#fca5a5">C&apos; = C4 + S3(S2+S1) → Cout LED</text>
          </g>
        ),
      };

    // ---------------- EXP 7 ----------------
    case 'even_parity_gen':
    case 'odd_parity_gen': {
      const isOdd = sub.id === 'odd_parity_gen';
      return {
        width: 390,
        height: 155,
        body: (
          <g>
            <InputTag x={34} y={32} label="A" />
            <InputTag x={34} y={60} label="B" color="#10b981" />
            <InputTag x={34} y={92} label="C" color="#f59e0b" />
            <InputTag x={34} y={122} label="D" color="#ec4899" />

            <line x1={36} y1={32} x2={84} y2={38} stroke="#38bdf8" strokeWidth={1.5} />
            <line x1={36} y1={60} x2={84} y2={54} stroke="#10b981" strokeWidth={1.5} />
            <LogicGateSymbol kind="XOR" x={84} y={46} icLabel="7486" inPins={[1, 2]} outPin={3} />

            <polyline points="118,46 138,46 138,70 156,70" fill="none" stroke="#f59e0b" strokeWidth={1.5} />
            <polyline points="36,92 128,92 128,86 156,86" fill="none" stroke="#ec4899" strokeWidth={1.5} />
            <LogicGateSymbol kind="XOR" x={156} y={78} icLabel="7486" inPins={[4, 5]} outPin={6} />

            <polyline points="190,78 210,78 210,100 228,100" fill="none" stroke="#8b5cf6" strokeWidth={1.5} />
            <polyline points="36,122 200,122 200,116 228,116" fill="none" stroke="#ec4899" strokeWidth={1.5} />
            <LogicGateSymbol kind="XOR" x={228} y={108} icLabel="7486" inPins={[9, 10]} outPin={8} />

            {isOdd ? (
              <>
                <line x1={262} y1={108} x2={280} y2={108} stroke="#a855f7" strokeWidth={1.6} />
                <LogicGateSymbol kind="NOT" x={280} y={108} icLabel="7404" inPins={[1]} outPin={2} width={28} />
                <line x1={308} y1={108} x2={322} y2={108} stroke="#f59e0b" strokeWidth={1.6} />
                <OutLED x={322} y={108} label="f" color="amber" />
              </>
            ) : (
              <>
                <line x1={262} y1={108} x2={292} y2={108} stroke="#4ade80" strokeWidth={1.7} />
                <OutLED x={292} y={108} label="f" color="green" />
              </>
            )}
          </g>
        ),
      };
    }

    case 'even_parity_check':
    case 'odd_parity_check': {
      const isOdd = sub.id === 'odd_parity_check';
      return {
        width: 400,
        height: 175,
        body: (
          <g>
            <InputTag x={32} y={24} label="A" />
            <InputTag x={32} y={50} label="B" color="#10b981" />
            <InputTag x={32} y={80} label="C" color="#f59e0b" />
            <InputTag x={32} y={110} label="D" color="#ec4899" />
            <InputTag x={32} y={142} label="P" color="#eab308" />

            <line x1={34} y1={24} x2={76} y2={29} stroke="#38bdf8" strokeWidth={1.5} />
            <line x1={34} y1={50} x2={76} y2={45} stroke="#10b981" strokeWidth={1.5} />
            <LogicGateSymbol kind="XOR" x={76} y={37} icLabel="G1" inPins={[1, 2]} outPin={3} />

            <polyline points="110,37 128,37 128,58 142,58" fill="none" stroke="#f59e0b" strokeWidth={1.4} />
            <polyline points="34,80 120,80 120,74 142,74" fill="none" stroke="#ec4899" strokeWidth={1.4} />
            <LogicGateSymbol kind="XOR" x={142} y={66} icLabel="G2" inPins={[4, 5]} outPin={6} />

            <polyline points="176,66 194,66 194,88 208,88" fill="none" stroke="#8b5cf6" strokeWidth={1.4} />
            <polyline points="34,110 186,110 186,104 208,104" fill="none" stroke="#ec4899" strokeWidth={1.4} />
            <LogicGateSymbol kind="XOR" x={208} y={96} icLabel="G3" inPins={[9, 10]} outPin={8} />

            <polyline points="242,96 258,96 258,118 272,118" fill="none" stroke="#a855f7" strokeWidth={1.4} />
            <polyline points="34,142 250,142 250,134 272,134" fill="none" stroke="#eab308" strokeWidth={1.4} />
            <LogicGateSymbol kind="XOR" x={272} y={126} icLabel="G4" inPins={[12, 13]} outPin={11} />

            <line x1={306} y1={126} x2={322} y2={126} stroke={isOdd ? '#22c55e' : '#ef4444'} strokeWidth={1.7} />
            <OutLED x={322} y={126} label="f" color={isOdd ? 'green' : 'red'} />
          </g>
        ),
      };
    }

    // ---------------- EXP 8 ----------------
    case 'mux_4to1':
      return {
        width: 390,
        height: 205,
        body: (
          <g>
            <InputTag x={30} y={24} label="S1" />
            <InputTag x={30} y={48} label="S0" color="#06b6d4" />
            <LogicGateSymbol kind="NOT" x={66} y={24} icLabel="7404" inPins={[1]} outPin={2} width={24} />
            <LogicGateSymbol kind="NOT" x={66} y={48} icLabel="7404" inPins={[3]} outPin={4} width={24} />
            <line x1={32} y1={24} x2={66} y2={24} stroke="#38bdf8" strokeWidth={1.3} />
            <line x1={32} y1={48} x2={66} y2={48} stroke="#06b6d4" strokeWidth={1.3} />

            {/* 4 3-input AND gates from 2x 7411 */}
            {[
              { y: 78, d: 'D0', ic: '7411#1', pins: [1, 2, 13], out: 12, sels: "S1',S0'" },
              { y: 112, d: 'D1', ic: '7411#1', pins: [3, 4, 5], out: 6, sels: "S1',S0" },
              { y: 146, d: 'D2', ic: '7411#1', pins: [9, 10, 11], out: 8, sels: "S1,S0'" },
              { y: 180, d: 'D3', ic: '7411#2', pins: [1, 2, 13], out: 12, sels: 'S1,S0' },
            ].map(row => (
              <g key={row.d}>
                <InputTag x={30} y={row.y} label={row.d} color="#22c55e" />
                <text x={82} y={row.y + 3} fontSize="6.5" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">
                  +{row.sels}
                </text>
                <line x1={32} y1={row.y} x2={126} y2={row.y} stroke="#22c55e" strokeWidth={1.3} />
                <LogicGateSymbol kind="AND" x={126} y={row.y} icLabel={row.ic} inPins={row.pins} outPin={row.out} width={34} />
              </g>
            ))}

            {/* 3 OR gates (7432) */}
            <polyline points="160,78 192,78 192,88 206,88" fill="none" stroke="#f59e0b" strokeWidth={1.3} />
            <polyline points="160,112 192,112 192,102 206,102" fill="none" stroke="#f59e0b" strokeWidth={1.3} />
            <LogicGateSymbol kind="OR" x={206} y={95} icLabel="7432" inPins={[1, 2]} outPin={3} />

            <polyline points="160,146 192,146 192,155 206,155" fill="none" stroke="#ec4899" strokeWidth={1.3} />
            <polyline points="160,180 192,180 192,171 206,171" fill="none" stroke="#ec4899" strokeWidth={1.3} />
            <LogicGateSymbol kind="OR" x={206} y={163} icLabel="7432" inPins={[4, 5]} outPin={6} />

            <polyline points="240,95 258,95 258,121 272,121" fill="none" stroke="#10b981" strokeWidth={1.4} />
            <polyline points="240,163 258,163 258,137 272,137" fill="none" stroke="#10b981" strokeWidth={1.4} />
            <LogicGateSymbol kind="OR" x={272} y={129} icLabel="7432" inPins={[9, 10]} outPin={8} />

            <line x1={306} y1={129} x2={318} y2={129} stroke="#22c55e" strokeWidth={1.7} />
            <OutLED x={318} y={129} label="Z" color="green" />
          </g>
        ),
      };

    case 'demux_1to4':
      return {
        width: 340,
        height: 195,
        body: (
          <g>
            <InputTag x={30} y={24} label="S1" />
            <InputTag x={30} y={48} label="S0" color="#06b6d4" />
            <LogicGateSymbol kind="NOT" x={66} y={24} icLabel="7404" inPins={[1]} outPin={2} width={24} />
            <LogicGateSymbol kind="NOT" x={66} y={48} icLabel="7404" inPins={[3]} outPin={4} width={24} />
            <line x1={32} y1={24} x2={66} y2={24} stroke="#38bdf8" strokeWidth={1.3} />
            <line x1={32} y1={48} x2={66} y2={48} stroke="#06b6d4" strokeWidth={1.3} />

            <InputTag x={30} y={128} label="D" color="#22c55e" />

            {[
              { y: 78, outLbl: 'O0', ic: '7411#1', pins: [1, 2, 13], out: 12, sels: "S1',S0'" },
              { y: 110, outLbl: 'O1', ic: '7411#1', pins: [3, 4, 5], out: 6, sels: "S1',S0" },
              { y: 142, outLbl: 'O2', ic: '7411#1', pins: [9, 10, 11], out: 8, sels: "S1,S0'" },
              { y: 174, outLbl: 'O3', ic: '7411#2', pins: [1, 2, 13], out: 12, sels: 'S1,S0' },
            ].map(row => (
              <g key={row.outLbl}>
                <polyline points={`32,128 52,128 52,${row.y} 138,${row.y}`} fill="none" stroke="#22c55e" strokeWidth={1.2} />
                <text x={96} y={row.y - 3} fontSize="6" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">
                  {row.sels}
                </text>
                <LogicGateSymbol kind="AND" x={138} y={row.y} icLabel={row.ic} inPins={row.pins} outPin={row.out} width={34} />
                <line x1={172} y1={row.y} x2={220} y2={row.y} stroke="#4ade80" strokeWidth={1.5} />
                <OutLED x={220} y={row.y} label={row.outLbl} color="green" />
              </g>
            ))}
          </g>
        ),
      };

    // ---------------- EXP 9 ----------------
    case 'd_flipflop':
      return {
        width: 390,
        height: 160,
        body: (
          <g>
            <InputTag x={32} y={40} label="D" />
            <InputTag x={32} y={82} label="CLK" color="#f59e0b" />

            {/* D Inverter (7400 #2: 1,2->3) */}
            <polyline points="34,40 132,40" fill="none" stroke="#38bdf8" strokeWidth={1.6} />
            <circle cx={48} cy={40} r={2} fill="#38bdf8" />
            <polyline points="48,40 48,120 70,120" fill="none" stroke="#38bdf8" strokeWidth={1.5} />
            <LogicGateSymbol kind="NAND" x={70} y={120} icLabel="7400#2" inPins={[1, 2]} outPin={3} width={32} />

            {/* Steering NANDs (7400 #1) */}
            <polyline points="34,82 114,82 114,56 132,56" fill="none" stroke="#f59e0b" strokeWidth={1.5} />
            <circle cx={114} cy={82} r={2} fill="#f59e0b" />
            <polyline points="114,82 114,104 132,104" fill="none" stroke="#f59e0b" strokeWidth={1.5} />
            <polyline points="102,120 132,120" fill="none" stroke="#a855f7" strokeWidth={1.5} />

            <LogicGateSymbol kind="NAND" x={132} y={48} icLabel="G1" inPins={[1, 2]} outPin={3} />
            <LogicGateSymbol kind="NAND" x={132} y={112} icLabel="G2" inPins={[4, 5]} outPin={6} />

            {/* SR Cross-coupled Latch */}
            <line x1={166} y1={48} x2={220} y2={48} stroke="#10b981" strokeWidth={1.6} />
            <line x1={166} y1={112} x2={220} y2={112} stroke="#ec4899" strokeWidth={1.6} />

            <LogicGateSymbol kind="NAND" x={220} y={54} icLabel="G4" inPins={[12, 13]} outPin={11} />
            <LogicGateSymbol kind="NAND" x={220} y={108} icLabel="G3" inPins={[9, 10]} outPin={8} />

            {/* Cross-coupled wires */}
            <polyline points="264,54 274,54 274,76 206,96 220,96" fill="none" stroke="#22c55e" strokeWidth={1.2} />
            <polyline points="264,108 270,108 270,86 206,64 220,64" fill="none" stroke="#ef4444" strokeWidth={1.2} />

            <line x1={254} y1={54} x2={292} y2={54} stroke="#22c55e" strokeWidth={1.7} />
            <line x1={254} y1={108} x2={292} y2={108} stroke="#ef4444" strokeWidth={1.7} />
            <OutLED x={292} y={54} label="Q" color="green" />
            <OutLED x={292} y={108} label="Q'" color="red" />
          </g>
        ),
      };

    case 'jk_flipflop':
      return {
        width: 390,
        height: 165,
        body: (
          <g>
            <InputTag x={32} y={40} label="J" />
            <InputTag x={32} y={82} label="CLK" color="#f59e0b" />
            <InputTag x={32} y={124} label="K" color="#06b6d4" />

            <line x1={34} y1={40} x2={102} y2={40} stroke="#38bdf8" strokeWidth={1.5} />
            <polyline points="34,82 88,82 88,52 102,52" fill="none" stroke="#f59e0b" strokeWidth={1.5} />
            <polyline points="88,82 88,112 102,112" fill="none" stroke="#f59e0b" strokeWidth={1.5} />
            <line x1={34} y1={124} x2={102} y2={124} stroke="#06b6d4" strokeWidth={1.5} />

            {/* 3-input Steering NANDs (7410) */}
            <LogicGateSymbol kind="NAND" x={102} y={52} icLabel="7410" inPins={[1, 2, 13]} outPin={12} />
            <LogicGateSymbol kind="NAND" x={102} y={114} icLabel="7410" inPins={[3, 4, 5]} outPin={6} />

            {/* To SR Latch (7400) */}
            <line x1={136} y1={52} x2={196} y2={52} stroke="#10b981" strokeWidth={1.6} />
            <line x1={136} y1={114} x2={196} y2={114} stroke="#ec4899" strokeWidth={1.6} />

            <LogicGateSymbol kind="NAND" x={196} y={58} icLabel="7400" inPins={[4, 5]} outPin={6} />
            <LogicGateSymbol kind="NAND" x={196} y={110} icLabel="7400" inPins={[1, 2]} outPin={3} />

            {/* Feedback lines Q -> 7410 P5, Q' -> 7410 P13 */}
            <polyline points="244,58 244,148 92,148 92,132 102,132" fill="none" stroke="#22c55e" strokeWidth={1.1} strokeDasharray="3 2" />
            <polyline points="248,110 248,18 92,18 92,66 102,66" fill="none" stroke="#ef4444" strokeWidth={1.1} strokeDasharray="3 2" />
            <text x={165} y={16} fontSize="6" fill="#f87171" fontFamily="monospace">Q&apos; fb → P13</text>
            <text x={165} y={156} fontSize="6" fill="#4ade80" fontFamily="monospace">Q fb → P5</text>

            {/* Cross-couple inside 7400 */}
            <polyline points="236,58 242,74 184,96 196,96" fill="none" stroke="#22c55e" strokeWidth={1.2} />
            <polyline points="236,110 242,92 184,70 196,70" fill="none" stroke="#ef4444" strokeWidth={1.2} />

            <line x1={230} y1={58} x2={278} y2={58} stroke="#22c55e" strokeWidth={1.7} />
            <line x1={230} y1={110} x2={278} y2={110} stroke="#ef4444" strokeWidth={1.7} />
            <OutLED x={278} y={58} label="Q" color="green" />
            <OutLED x={278} y={110} label="Q'" color="red" />
          </g>
        ),
      };

    // ---------------- EXP 10 ----------------
    case 'siso_7474': {
      const stages = [
        { lbl: 'FF1 (7474#1)', dPin: 2, clkPin: 3, clrPin: 1, prPin: 4, qPin: 5, qLbl: 'Q1' },
        { lbl: 'FF2 (7474#1)', dPin: 12, clkPin: 11, clrPin: 13, prPin: 10, qPin: 9, qLbl: 'Q2' },
        { lbl: 'FF3 (7474#2)', dPin: 2, clkPin: 3, clrPin: 1, prPin: 4, qPin: 5, qLbl: 'Q3' },
        { lbl: 'FF4 (7474#2)', dPin: 12, clkPin: 11, clrPin: 13, prPin: 10, qPin: 9, qLbl: 'Sout' },
      ];
      return {
        width: 410,
        height: 155,
        body: (
          <g fontFamily="ui-monospace, monospace">
            <InputTag x={28} y={42} label="Din" />
            <InputTag x={28} y={96} label="CLK" color="#f59e0b" />
            <InputTag x={28} y={122} label="CLR'" color="#ec4899" />

            <line x1={30} y1={42} x2={60} y2={42} stroke="#38bdf8" strokeWidth={1.7} />
            <line x1={30} y1={96} x2={346} y2={96} stroke="#f59e0b" strokeWidth={1.3} />
            <line x1={30} y1={122} x2={346} y2={122} stroke="#ec4899" strokeWidth={1.3} />
            <text x={205} y={142} textAnchor="middle" fontSize="6.5" fill="#f87171">
              Tie all PR&apos; pins (P4, P10 on both 7474 ICs) → +5V (+ rail)
            </text>

            {stages.map((st, idx) => {
              const bx = 60 + idx * 80;
              return (
                <g key={st.qLbl}>
                  <rect x={bx} y={24} width={60} height={54} rx={4} fill="#1e293b" stroke="#94a3b8" strokeWidth={1.4} />
                  <text x={bx + 30} y={36} textAnchor="middle" fontSize="6.2" fontWeight="800" fill="#cbd5e1">{st.lbl}</text>
                  <text x={bx + 4} y={49} fontSize="6.8" fill="#7dd3fc">D({st.dPin})</text>
                  <text x={bx + 56} y={49} textAnchor="end" fontSize="6.8" fill="#4ade80">Q({st.qPin})</text>
                  <text x={bx + 30} y={71} textAnchor="middle" fontSize="6" fill="#fbbf24">
                    CK:{st.clkPin} CLR:{st.clrPin}
                  </text>
                  <line x1={bx + 18} y1={78} x2={bx + 18} y2={96} stroke="#f59e0b" strokeWidth={1.2} />
                  <line x1={bx + 42} y1={78} x2={bx + 42} y2={122} stroke="#ec4899" strokeWidth={1.2} />
                  {idx < 3 && (
                    <line x1={bx + 60} y1={42} x2={bx + 80} y2={42} stroke="#8b5cf6" strokeWidth={1.6} />
                  )}
                  {idx === 3 && (
                    <>
                      <line x1={bx + 60} y1={42} x2={bx + 68} y2={12} stroke="#22c55e" strokeWidth={1.2} />
                      <text x={bx + 68} y={10} textAnchor="middle" fontSize="7" fontWeight="800" fill="#4ade80">
                        LED {st.qLbl}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        ),
      };
    }

    case 'sipo_7495':
      return {
        width: 360,
        height: 175,
        body: (
          <g fontFamily="ui-monospace, monospace">
            <rect x={115} y={18} width={118} height={134} rx={6} fill="#1e293b" stroke="#38bdf8" strokeWidth={1.6} />
            <text x={174} y={35} textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#f8fafc">IC 7495</text>
            <text x={174} y={47} textAnchor="middle" fontSize="7" fill="#94a3b8">4-Bit SIPO Shift Reg</text>

            {/* Left Inputs */}
            <InputTag x={44} y={56} label="Din" />
            <line x1={46} y1={56} x2={115} y2={56} stroke="#38bdf8" strokeWidth={1.6} />
            <text x={120} y={59} fontSize="7" fill="#7dd3fc">DS (P1)</text>

            <InputTag x={44} y={84} label="M" color="#ec4899" />
            <line x1={46} y1={84} x2={115} y2={84} stroke="#ec4899" strokeWidth={1.6} />
            <text x={120} y={87} fontSize="7" fill="#f472b6">Mode (P6)</text>

            <InputTag x={44} y={114} label="CLK" color="#f59e0b" />
            <polyline points="46,114 96,114 96,108 115,108" fill="none" stroke="#f59e0b" strokeWidth={1.4} />
            <polyline points="96,114 96,124 115,124" fill="none" stroke="#f59e0b" strokeWidth={1.4} />
            <text x={120} y={111} fontSize="6.8" fill="#fbbf24">CK1 (P9)</text>
            <text x={120} y={127} fontSize="6.8" fill="#fbbf24">CK2 (P8)</text>

            <text x={120} y={145} fontSize="6.5" fill="#94a3b8">A..D (P2..5) → GND</text>

            {/* Right Outputs */}
            {[
              { y: 58, lbl: 'QA', pin: 13 },
              { y: 84, lbl: 'QB', pin: 12 },
              { y: 110, lbl: 'QC', pin: 11 },
              { y: 136, lbl: 'QD', pin: 10 },
            ].map(o => (
              <g key={o.lbl}>
                <text x={228} y={o.y + 3} textAnchor="end" fontSize="7" fill="#86efac">{o.lbl} (P{o.pin})</text>
                <line x1={233} y1={o.y} x2={252} y2={o.y} stroke="#4ade80" strokeWidth={1.6} />
                <OutLED x={252} y={o.y} label={o.lbl} color="green" />
              </g>
            ))}
          </g>
        ),
      };

    default:
      return {
        width: 320,
        height: 110,
        body: (
          <g>
            <rect x={20} y={20} width={280} height={70} rx={8} fill="#1e293b" stroke="#475569" />
            <text x={160} y={52} textAnchor="middle" fontSize="10" fill="#e2e8f0" fontWeight="bold">
              {sub.name}
            </text>
            <text x={160} y={70} textAnchor="middle" fontSize="8" fill="#94a3b8">
              Inputs: {sub.inputs.map(i => i.label).join(', ')} → Outputs: {sub.outputs.map(o => o.label).join(', ')}
            </text>
          </g>
        ),
      };
  }
};

export const CircuitSchematic: React.FC<CircuitSchematicProps> = ({ subCircuit }) => {
  const [zoomModal, setZoomModal] = useState(false);
  const diagram = renderSchematicContent(subCircuit);

  const uniqueICTypes = Array.from(new Set(subCircuit.ics.map(ic => ic.partNumber)));
  const powerFooter = uniqueICTypes
    .map(part => {
      const def = IC_CATALOG[part];
      if (!def) return '';
      return `IC ${part}: VCC=P${def.vccPin}, GND=P${def.gndPin}`;
    })
    .filter(Boolean)
    .join('  ·  ');

  const renderSvg = (large = false) => (
    <svg
      viewBox={`0 0 ${diagram.width} ${diagram.height}`}
      className={`w-full h-auto rounded-lg bg-slate-950 border border-slate-800 ${large ? 'max-h-[75vh]' : ''}`}
    >
      {diagram.body}
    </svg>
  );

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10.5px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
          <span>📐</span>
          <span>Circuit Diagram (with IC Pins)</span>
        </div>
        <button
          onClick={() => setZoomModal(true)}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300"
          title="Open large circuit schematic"
        >
          ⛶ Enlarge
        </button>
      </div>

      {renderSvg(false)}

      {powerFooter && (
        <div className="text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2 py-1 rounded border border-slate-800 flex flex-wrap gap-x-2">
          <span className="text-red-400 font-bold">Power:</span>
          <span>{powerFooter}</span>
        </div>
      )}

      {zoomModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setZoomModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-4 sm:p-5 space-y-3 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-100">
                  {subCircuit.name} — Circuit Diagram
                </h3>
                <p className="text-[11px] text-slate-400">{subCircuit.subtitle}</p>
              </div>
              <button
                onClick={() => setZoomModal(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                ✕ Close
              </button>
            </div>
            {renderSvg(true)}
            {powerFooter && (
              <div className="text-xs font-mono text-slate-300 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                ⚡ IC Supply Rails: {powerFooter}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
