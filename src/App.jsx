import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   COLOUR PALETTE
   ═══════════════════════════════════════════════════════════════ */
const C = {
  bg: "#08090d", surface: "#0f1018", surfaceAlt: "#131420",
  border: "#1e2030", borderLight: "#282a3a",
  gold: "#e8b84b", goldDim: "#7a5e1a", goldBg: "rgba(232,184,75,0.06)",
  text: "#ddd8cc", muted: "#6b6655", mutedLight: "#8a8470",
  correct: "#4caf72", wrong: "#e05252",
  correctBg: "#0d2018", wrongBg: "#200d0d",
  vci: "#7eccf0", pri: "#c06af0", wmi: "#e8b84b", psi: "#4caf72",
};

/* ═══════════════════════════════════════════════════════════════
   INDEX DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */
const INDICES = {
  VCI: { name: "Verbal Comprehension", abbr: "VCI", color: C.vci, icon: "◈", subtests: ["similarities","vocabulary","information"] },
  PRI: { name: "Perceptual Reasoning", abbr: "PRI", color: C.pri, icon: "◆", subtests: ["blockDesign","matrixReasoning","visualPuzzles"] },
  WMI: { name: "Working Memory", abbr: "WMI", color: C.wmi, icon: "◉", subtests: ["digitSpan","arithmetic"] },
  PSI: { name: "Processing Speed", abbr: "PSI", color: C.psi, icon: "⚡", subtests: ["symbolSearch","coding"] },
};

/* ═══════════════════════════════════════════════════════════════
   AGE BRACKETS
   ═══════════════════════════════════════════════════════════════ */
const AGE_BRACKETS = [
  { label: "16–17", min: 16, max: 17 }, { label: "18–19", min: 18, max: 19 },
  { label: "20–24", min: 20, max: 24 }, { label: "25–29", min: 25, max: 29 },
  { label: "30–34", min: 30, max: 34 }, { label: "35–44", min: 35, max: 44 },
  { label: "45–54", min: 45, max: 54 }, { label: "55–64", min: 55, max: 64 },
  { label: "65–69", min: 65, max: 69 }, { label: "70–74", min: 70, max: 74 },
  { label: "75+",   min: 75, max: 120 },
];
function getAgeBracketIndex(age) {
  return AGE_BRACKETS.findIndex(b => age >= b.min && age <= b.max);
}

/* ═══════════════════════════════════════════════════════════════
   ABSTRACT SYMBOLS (for Symbol Search & Coding)
   ═══════════════════════════════════════════════════════════════ */
function SymbolIcon({ id, size = 28, color }) {
  const s = size, m = s / 2, sw = Math.max(1.5, s / 16);
  const cl = color || C.text;
  const render = () => {
    switch (id) {
      case 0: return (<g stroke={cl} strokeWidth={sw} fill="none"><circle cx={m} cy={m} r={m*0.65}/><line x1={m} y1={m*0.4} x2={m} y2={m*1.6}/><line x1={m*0.4} y1={m} x2={m*1.6} y2={m}/></g>);
      case 1: return <polygon points={`${m},${s*0.1} ${s*0.88},${s*0.85} ${s*0.12},${s*0.85}`} fill="none" stroke={cl} strokeWidth={sw}/>;
      case 2: return <polygon points={`${m},${s*0.1} ${s*0.9},${m} ${m},${s*0.9} ${s*0.1},${m}`} fill="none" stroke={cl} strokeWidth={sw}/>;
      case 3: { const pts = Array.from({length:10},(_,i)=>{const a=Math.PI/5*i-Math.PI/2;const r=i%2===0?m*0.72:m*0.32;return`${m+Math.cos(a)*r},${m+Math.sin(a)*r}`;}).join(" "); return <polygon points={pts} fill="none" stroke={cl} strokeWidth={sw}/>; }
      case 4: { const pts = Array.from({length:6},(_,i)=>{const a=Math.PI/3*i-Math.PI/6;return`${m+Math.cos(a)*m*0.7},${m+Math.sin(a)*m*0.7}`;}).join(" "); return <polygon points={pts} fill="none" stroke={cl} strokeWidth={sw}/>; }
      case 5: return (<g stroke={cl} strokeWidth={sw} fill="none"><circle cx={m} cy={m} r={m*0.65}/><line x1={m*0.38} y1={m*0.38} x2={m*1.62} y2={m*1.62}/><line x1={m*1.62} y1={m*0.38} x2={m*0.38} y2={m*1.62}/></g>);
      case 6: return (<g stroke={cl} strokeWidth={sw} fill="none"><rect x={s*0.12} y={s*0.12} width={s*0.76} height={s*0.76}/><line x1={m} y1={s*0.12} x2={m} y2={s*0.88}/><line x1={s*0.12} y1={m} x2={s*0.88} y2={m}/></g>);
      case 7: return (<g stroke={cl} strokeWidth={sw}><path d={`M${m+m*0.65},${m} A${m*0.65},${m*0.65} 0 1,0 ${m-m*0.65},${m}`} fill={cl}/><path d={`M${m-m*0.65},${m} A${m*0.65},${m*0.65} 0 1,0 ${m+m*0.65},${m}`} fill="none"/></g>);
      case 8: return <polygon points={`${s*0.12},${s*0.15} ${s*0.88},${s*0.15} ${m},${s*0.85}`} fill="none" stroke={cl} strokeWidth={sw}/>;
      default: return <circle cx={m} cy={m} r={m*0.5} fill="none" stroke={cl} strokeWidth={sw}/>;
    }
  };
  return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>{render()}</svg>;
}
const SYMBOL_NAMES = ["⊕","△","◇","☆","⬡","⊗","⊞","◐","▽"];

/* ═══════════════════════════════════════════════════════════════
   SVG SHAPE HELPERS
   ═══════════════════════════════════════════════════════════════ */
const Shapes = {
  circle: (cx, cy, r, fill, stroke = "none", sw = 0) => <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />,
  rect: (x, y, w, h, fill, stroke = "none", sw = 0, rx = 0) => <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={sw} rx={rx} />,
  tri: (cx, cy, size, fill, rot = 0) => { const pts = [[cx,cy-size],[cx-size*0.866,cy+size*0.5],[cx+size*0.866,cy+size*0.5]].map(p=>p.join(",")).join(" "); return <polygon points={pts} fill={fill} transform={`rotate(${rot},${cx},${cy})`}/>; },
  diamond: (cx, cy, size, fill) => { const pts = [[cx,cy-size],[cx+size,cy],[cx,cy+size],[cx-size,cy]].map(p=>p.join(",")).join(" "); return <polygon points={pts} fill={fill}/>; },
  cross: (cx, cy, size, fill) => (<g><rect x={cx-size/4} y={cy-size} width={size/2} height={size*2} fill={fill}/><rect x={cx-size} y={cy-size/4} width={size*2} height={size/2} fill={fill}/></g>),
  star: (cx, cy, r, fill) => { const pts = Array.from({length:10},(_,i)=>{const a=Math.PI/5*i-Math.PI/2;const rad=i%2===0?r:r*0.45;return[cx+Math.cos(a)*rad,cy+Math.sin(a)*rad].join(",");}).join(" "); return <polygon points={pts} fill={fill}/>; },
  hex: (cx, cy, r, fill) => { const pts = Array.from({length:6},(_,i)=>{const a=Math.PI/3*i-Math.PI/6;return[cx+Math.cos(a)*r,cy+Math.sin(a)*r].join(",");}).join(" "); return <polygon points={pts} fill={fill}/>; },
};

/* ═══════════════════════════════════════════════════════════════
   SCORING & AGE NORMS
   ═══════════════════════════════════════════════════════════════ */
const MAX_RAW = { blockDesign:8, similarities:5, digitSpan:8, matrixReasoning:4, vocabulary:5, arithmetic:4, symbolSearch:40, visualPuzzles:4, information:4, coding:60 };

// Reference raw scores for scaled=10 at each age bracket index (0=youngest, 10=oldest)
// Fluid subtests decrease with age; crystallized stay stable
const REF_RAW = {
  blockDesign:      [6,6,6,5,5,5,4,4,3,3,2],
  similarities:     [3,3,3,3,3,3,3,3,3,3,3],
  digitSpan:        [6,6,6,6,5,5,5,4,4,4,3],
  matrixReasoning:  [3,3,3,3,3,2,2,2,2,1,1],
  vocabulary:       [3,3,3,3,3,3,3,3,3,4,4],
  arithmetic:       [3,3,3,3,3,2,2,2,2,2,2],
  symbolSearch:     [25,25,25,22,22,20,18,16,14,12,10],
  visualPuzzles:    [3,3,3,3,3,2,2,2,2,1,1],
  information:      [3,3,3,3,3,3,3,3,3,3,3],
  coding:           [40,40,40,35,35,30,25,22,18,15,12],
};

function rawToScaled(raw, subtestId, bracketIdx) {
  const ref = REF_RAW[subtestId]?.[bracketIdx] ?? 3;
  const max = MAX_RAW[subtestId] ?? 5;
  const clamped = Math.max(0, Math.min(max, raw));
  let scaled;
  if (clamped >= ref) {
    const p = max > ref ? (clamped - ref) / (max - ref) : 1;
    scaled = Math.round(10 + p * 9);
  } else {
    const p = ref > 0 ? clamped / ref : 0;
    scaled = Math.round(1 + p * 9);
  }
  return Math.max(1, Math.min(19, scaled));
}

function sumToIndex(sum, numSubtests) {
  const mean = numSubtests * 10;
  const sd = Math.sqrt(numSubtests) * 3;
  const z = sd > 0 ? (sum - mean) / sd : 0;
  return Math.max(40, Math.min(160, Math.round(100 + z * 15)));
}

function computeFSIQ(scaledScores) {
  const sum = Object.values(scaledScores).reduce((a, b) => a + b, 0);
  const n = Object.keys(scaledScores).length || 10;
  return sumToIndex(sum, n);
}

function iqToPercentile(iq) {
  const z = (iq - 100) / 15;
  const p = 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (z + 0.044715 * z * z * z)));
  return Math.max(1, Math.min(99, Math.round(p * 100)));
}

function iqToClassification(iq) {
  if (iq >= 130) return "Very Superior";
  if (iq >= 120) return "Superior";
  if (iq >= 110) return "High Average";
  if (iq >= 90) return "Average";
  if (iq >= 80) return "Low Average";
  if (iq >= 70) return "Borderline";
  return "Extremely Low";
}

/* ═══════════════════════════════════════════════════════════════
   SUBTEST DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */
const SUBTESTS = [
  /* 0 — Block Design (PRI) */
  {
    id: "blockDesign", name: "Block Design", indexId: "PRI", type: "block-design",
    icon: "⊞", isFluid: true,
    briefing: "Replicate the geometric pattern shown using the interactive grid. Click each cell to cycle through white, red, and diagonal patterns. Submit when your pattern matches the target.",
    items: [
      { gridSize: 2, target: [[1,0],[0,1]], timeLimit: 30, bonusTime: 15 },
      { gridSize: 2, target: [[2,3],[3,2]], timeLimit: 30, bonusTime: 15 },
      { gridSize: 3, target: [[1,0,1],[0,1,0],[1,0,1]], timeLimit: 45, bonusTime: 25 },
      { gridSize: 3, target: [[2,1,3],[0,2,0],[3,1,2]], timeLimit: 60, bonusTime: 35 },
    ],
  },
  /* 1 — Similarities (VCI) */
  {
    id: "similarities", name: "Similarities", indexId: "VCI", type: "mcq",
    icon: "≈", isFluid: false,
    briefing: "You will be given two words. Determine how they are alike by choosing the answer that identifies their most abstract or fundamental similarity.",
    items: [
      { prompt: "How are a DOG and a CAT alike?", options: ["Both are domesticated animals","Both have four legs","Both eat meat","Dogs chase cats"], answer: 0, explanation: "The best answer identifies the abstract category — both are domesticated animals." },
      { prompt: "How are a PIANO and a DRUM alike?", options: ["Both are played with hands","Both are musical instruments","Both are loud","Both are found in orchestras"], answer: 1, explanation: "Both belong to the abstract category of musical instruments." },
      { prompt: "How are ANGER and JOY alike?", options: ["They are opposites","Both are emotions","Both affect behaviour","Both make you cry"], answer: 1, explanation: "The abstract link is that both are emotions — a shared category." },
      { prompt: "How are a POEM and a STATUE alike?", options: ["Both can be beautiful","Both express ideas","Both are works of art","Both are created by hand"], answer: 2, explanation: "At the highest level of abstraction, both are forms of artistic expression — works of art." },
      { prompt: "How are LIBERTY and JUSTICE alike?", options: ["Both are written on buildings","Both involve rules","Both are abstract principles of governance","Both are important values"], answer: 2, explanation: "The most abstract similarity: both are fundamental principles underlying democratic governance." },
    ],
  },
  /* 2 — Digit Span (WMI) */
  {
    id: "digitSpan", name: "Digit Span", indexId: "WMI", type: "digit-span",
    icon: "⊙", isFluid: true,
    briefing: "Digits will flash on screen one at a time. After the sequence ends, type the digits back — first in the same order (Forward), then in reverse order (Backward).",
    items: [
      { digits: [7,2,8,5], direction: "forward" },
      { digits: [3,9,1,7,4], direction: "forward" },
      { digits: [6,1,8,3,5,9], direction: "forward" },
      { digits: [4,7,2,9,3,1,6], direction: "forward" },
      { digits: [5,8,2], direction: "backward" },
      { digits: [7,1,9,4], direction: "backward" },
      { digits: [3,6,2,8,1], direction: "backward" },
      { digits: [9,4,7,1,5,3], direction: "backward" },
    ],
  },
  /* 3 — Matrix Reasoning (PRI) */
  {
    id: "matrixReasoning", name: "Matrix Reasoning", indexId: "PRI", type: "matrix",
    icon: "⊞", isFluid: true,
    briefing: "Examine the 3×3 pattern matrix. One tile is missing. Select the option that best completes the logical pattern.",
    items: [
      {
        grid: [[{shape:"circle",fill:C.gold,sz:18},{shape:"circle",fill:C.gold,sz:18,count:2},{shape:"circle",fill:C.gold,sz:18,count:3}],[{shape:"rect",fill:"#5588ee",sz:16},{shape:"rect",fill:"#5588ee",sz:16,count:2},{shape:"rect",fill:"#5588ee",sz:16,count:3}],[{shape:"tri",fill:"#ee6655",sz:18},{shape:"tri",fill:"#ee6655",sz:18,count:2},null]],
        options: [{shape:"tri",fill:"#ee6655",sz:18,count:3},{shape:"tri",fill:"#ee6655",sz:18,count:2},{shape:"tri",fill:C.gold,sz:18,count:3},{shape:"rect",fill:"#ee6655",sz:16,count:3}],
        answer: 0, explanation: "Each row uses the same shape in increasing counts (1→2→3). Row 3 needs 3 triangles."
      },
      {
        grid: [[{shape:"diamond",fill:"#60d0a0",sz:10},{shape:"diamond",fill:"#60d0a0",sz:16},{shape:"diamond",fill:"#60d0a0",sz:22}],[{shape:"circle",fill:"#e07a40",sz:10},{shape:"circle",fill:"#e07a40",sz:16},{shape:"circle",fill:"#e07a40",sz:22}],[{shape:"hex",fill:"#8888ee",sz:10},{shape:"hex",fill:"#8888ee",sz:16},null]],
        options: [{shape:"hex",fill:"#8888ee",sz:22},{shape:"hex",fill:"#8888ee",sz:16},{shape:"circle",fill:"#8888ee",sz:22},{shape:"hex",fill:"#60d0a0",sz:22}],
        answer: 0, explanation: "Each row has the same shape growing in size (S→M→L). Row 3 = large hex."
      },
      {
        grid: [[{shape:"circle",fill:C.gold,sz:20,hasDot:false},{shape:"circle",fill:C.gold,sz:20,hasDot:true},{shape:"circle",fill:C.gold,sz:20,hasDot:false}],[{shape:"circle",fill:C.gold,sz:20,hasDot:true},{shape:"circle",fill:C.gold,sz:20,hasDot:false},{shape:"circle",fill:C.gold,sz:20,hasDot:true}],[{shape:"circle",fill:C.gold,sz:20,hasDot:false},{shape:"circle",fill:C.gold,sz:20,hasDot:true},null]],
        options: [{shape:"circle",fill:C.gold,sz:20,hasDot:false},{shape:"circle",fill:C.gold,sz:20,hasDot:true},{shape:"rect",fill:C.gold,sz:18,hasDot:false},{shape:"circle",fill:"#5588ee",sz:20,hasDot:false}],
        answer: 0, explanation: "Checkerboard pattern of dots — the missing cell is a no-dot position."
      },
      {
        grid: [[{shape:"star",fill:"#e8b84b",sz:16},{shape:"star",fill:"#7eccf0",sz:16},{shape:"star",fill:"#c06af0",sz:16}],[{shape:"star",fill:"#7eccf0",sz:16},{shape:"star",fill:"#c06af0",sz:16},{shape:"star",fill:"#e8b84b",sz:16}],[{shape:"star",fill:"#c06af0",sz:16},{shape:"star",fill:"#e8b84b",sz:16},null]],
        options: [{shape:"star",fill:"#7eccf0",sz:16},{shape:"star",fill:"#c06af0",sz:16},{shape:"star",fill:"#e8b84b",sz:16},{shape:"hex",fill:"#7eccf0",sz:16}],
        answer: 0, explanation: "Each colour appears exactly once per row and column (Latin square). The missing cell is blue."
      },
    ],
  },
  /* 4 — Vocabulary (VCI) */
  {
    id: "vocabulary", name: "Vocabulary", indexId: "VCI", type: "mcq",
    icon: "Aa", isFluid: false,
    briefing: "Select the definition that best matches the meaning of each word presented.",
    items: [
      { prompt: "What does REPAIR mean?", options: ["To fix or restore something","To repeat an action","To prepare again","To move backwards"], answer: 0, explanation: "Repair means to fix or restore something to good condition." },
      { prompt: "What does CONSUME mean?", options: ["To think deeply","To eat, drink, or use up","To build something new","To count carefully"], answer: 1, explanation: "Consume means to eat, drink, or use up a resource." },
      { prompt: "What does RELUCTANT mean?", options: ["Eager and willing","Unwilling or hesitant","Very fast","Extremely loud"], answer: 1, explanation: "Reluctant means unwilling or hesitant to do something." },
      { prompt: "What does PRAGMATIC mean?", options: ["Overly emotional","Related to language","Dealing with things in a practical way","Extremely precise"], answer: 2, explanation: "Pragmatic means practical, focused on results rather than theory." },
      { prompt: "What does ACQUIESCE mean?", options: ["To acquire new things","To accept reluctantly without protest","To question authority","To leave in a hurry"], answer: 1, explanation: "Acquiesce means to accept or comply passively without protest." },
    ],
  },
  /* 5 — Arithmetic (WMI) */
  {
    id: "arithmetic", name: "Arithmetic", indexId: "WMI", type: "arithmetic",
    icon: "Σ", isFluid: false,
    briefing: "Solve each mental math word problem within the time limit. Type your numeric answer and press Submit. No calculators — this tests working memory.",
    items: [
      { problem: "If you have 8 apples, give away 3, then buy 5 more — how many do you have?", answer: 10, timeLimit: 30 },
      { problem: "A shirt costs $45 and is 20% off. What is the sale price in dollars?", answer: 36, timeLimit: 30 },
      { problem: "If 3 workers build a wall in 12 hours, how many hours would 6 workers take?", answer: 6, timeLimit: 30 },
      { problem: "A car travels 150 miles in 2.5 hours. What is the average speed in mph?", answer: 60, timeLimit: 30 },
    ],
  },
  /* 6 — Symbol Search (PSI) */
  {
    id: "symbolSearch", name: "Symbol Search", indexId: "PSI", type: "symbol-search",
    icon: "⊘", isFluid: true,
    briefing: "You will see two target symbols on the left and five symbols on the right. Determine whether EITHER target symbol appears in the row. Click YES or NO as fast and accurately as possible. You have 90 seconds.",
    items: null, sessionTime: 90,
  },
  /* 7 — Visual Puzzles (PRI) */
  {
    id: "visualPuzzles", name: "Visual Puzzles", indexId: "PRI", type: "visual-puzzles",
    icon: "◫", isFluid: true,
    briefing: "A completed shape is shown at the top. Select exactly 3 of the 6 pieces below that, when combined, would reconstruct the target shape.",
    items: [
      {
        targetPath: "M0,0 L100,0 L100,30 L65,30 L65,80 L35,80 L35,30 L0,30 Z",
        targetVB: "0 0 100 80", label: "T-Shape",
        pieces: [
          { path: "M0,0 L100,0 L100,30 L0,30 Z", vb: "0 0 100 30" },
          { path: "M0,0 L50,0 L0,50 Z", vb: "0 0 50 50" },
          { path: "M35,30 L65,30 L65,55 L35,55 Z", vb: "35 30 30 25" },
          { path: "M0,0 L25,0 L25,40 L0,40 Z", vb: "0 0 25 40" },
          { path: "M35,55 L65,55 L65,80 L35,80 Z", vb: "35 55 30 25" },
          { path: "M10,0 L50,0 L40,30 L0,30 Z", vb: "0 0 50 30" },
        ],
        correct: [0, 2, 4],
      },
      {
        targetPath: "M35,0 L65,0 L65,35 L100,35 L100,65 L65,65 L65,100 L35,100 L35,65 L0,65 L0,35 L35,35 Z",
        targetVB: "0 0 100 100", label: "Cross",
        pieces: [
          { path: "M50,10 L90,50 L50,90 L10,50 Z", vb: "10 10 80 80" },
          { path: "M0,35 L100,35 L100,65 L0,65 Z", vb: "0 35 100 30" },
          { path: "M35,0 L65,0 L65,35 L35,35 Z", vb: "35 0 30 35" },
          { path: "M0,0 L100,0 L50,100 Z", vb: "0 0 100 100" },
          { path: "M35,65 L65,65 L65,100 L35,100 Z", vb: "35 65 30 35" },
          { path: "M20,20 L80,20 L80,80 L20,80 Z", vb: "20 20 60 60" },
        ],
        correct: [1, 2, 4],
      },
      {
        targetPath: "M50,0 L100,35 L75,35 L75,80 L25,80 L25,35 L0,35 Z",
        targetVB: "0 0 100 80", label: "Arrow",
        pieces: [
          { path: "M50,0 L100,35 L0,35 Z", vb: "0 0 100 35" },
          { path: "M0,0 L40,0 L40,40 L0,40 Z", vb: "0 0 40 40" },
          { path: "M25,35 L50,35 L50,80 L25,80 Z", vb: "25 35 25 45" },
          { path: "M20,0 L80,0 L80,60 L20,60 Z", vb: "20 0 60 60" },
          { path: "M50,35 L75,35 L75,80 L50,80 Z", vb: "50 35 25 45" },
          { path: "M25,0 L75,0 L50,40 Z", vb: "25 0 50 40" },
        ],
        correct: [0, 2, 4],
      },
      {
        targetPath: "M50,0 L100,40 L100,100 L0,100 L0,40 Z",
        targetVB: "0 0 100 100", label: "House",
        pieces: [
          { path: "M0,0 L40,0 L20,30 Z", vb: "0 0 40 30" },
          { path: "M50,0 L100,40 L0,40 Z", vb: "0 0 100 40" },
          { path: "M50,20 L80,50 L50,80 L20,50 Z", vb: "20 20 60 60" },
          { path: "M0,40 L50,40 L50,100 L0,100 Z", vb: "0 40 50 60" },
          { path: "M30,0 L60,0 L60,100 L30,100 Z", vb: "30 0 30 100" },
          { path: "M50,40 L100,40 L100,100 L50,100 Z", vb: "50 40 50 60" },
        ],
        correct: [1, 3, 5],
      },
    ],
  },
  /* 8 — Information (VCI) */
  {
    id: "information", name: "Information", indexId: "VCI", type: "mcq",
    icon: "ℹ", isFluid: false,
    briefing: "Answer each general knowledge question by selecting the correct option.",
    items: [
      { prompt: "What is the boiling point of water at sea level in degrees Celsius?", options: ["90°C","100°C","110°C","120°C"], answer: 1, explanation: "Water boils at 100°C (212°F) at sea level." },
      { prompt: "Who wrote the play 'Romeo and Juliet'?", options: ["Charles Dickens","William Shakespeare","Jane Austen","Oscar Wilde"], answer: 1, explanation: "William Shakespeare wrote Romeo and Juliet around 1595." },
      { prompt: "What is the largest organ in the human body?", options: ["Liver","Brain","Skin","Heart"], answer: 2, explanation: "The skin is the largest organ, covering about 20 sq ft in adults." },
      { prompt: "In what year did World War II end?", options: ["1943","1944","1945","1946"], answer: 2, explanation: "WWII ended in 1945 with the surrender of Japan on September 2." },
    ],
  },
  /* 9 — Coding (PSI) */
  {
    id: "coding", name: "Coding", indexId: "PSI", type: "coding",
    icon: "⟳", isFluid: true,
    briefing: "A key showing 9 number-symbol pairs is displayed at the top. For each number that appears, click the matching symbol as quickly and accurately as possible. You have 120 seconds.",
    items: null, sessionTime: 120,
  },
];

/* ═══════════════════════════════════════════════════════════════
   MATRIX CELL (from original — reused for Matrix Reasoning)
   ═══════════════════════════════════════════════════════════════ */
function MatrixCell({ cell, size = 70, empty = false, ghost = false }) {
  const s = size, mid = s / 2;
  if (empty) return (<svg width={s} height={s}><rect width={s} height={s} fill={C.surface} rx={4}/><text x={mid} y={mid+6} textAnchor="middle" fill={C.muted} fontSize={22} fontFamily="serif">?</text></svg>);
  const { shape, fill, sz = 20, hasDot, hasRing, rot = 0, count = 1 } = cell;
  const renderShape = (cx, cy, f) => {
    switch (shape) {
      case "circle": return Shapes.circle(cx,cy,sz,f);
      case "rect": return Shapes.rect(cx-sz,cy-sz,sz*2,sz*2,f,"none",0,4);
      case "tri": return Shapes.tri(cx,cy,sz,f,rot);
      case "diamond": return Shapes.diamond(cx,cy,sz,f);
      case "cross": return Shapes.cross(cx,cy,sz,f);
      case "star": return Shapes.star(cx,cy,sz,f);
      case "hex": return Shapes.hex(cx,cy,sz,f);
      default: return Shapes.circle(cx,cy,sz,f);
    }
  };
  const positions = count===1?[[mid,mid]]:count===2?[[mid-14,mid],[mid+14,mid]]:count===3?[[mid-16,mid],[mid,mid-10],[mid+16,mid]]:[[mid-14,mid-10],[mid+14,mid-10],[mid-14,mid+10],[mid+14,mid+10]];
  return (<svg width={s} height={s}><rect width={s} height={s} fill={ghost?"rgba(232,184,75,0.06)":C.surface} rx={4} stroke={ghost?C.gold:"none"} strokeWidth={ghost?1.5:0}/>{positions.map(([cx,cy],i)=>(<g key={i}>{renderShape(cx,cy,fill)}{hasRing&&Shapes.circle(cx,cy,sz+6,"none",fill,1.5)}{hasDot&&Shapes.circle(cx,cy,4,C.bg)}</g>))}</svg>);
}

/* ═══════════════════════════════════════════════════════════════
   TIMER COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function TimerRing({ seconds, max = 30 }) {
  const r = 22, circ = 2 * Math.PI * r, dash = circ * (seconds / max);
  const urgent = seconds <= 10;
  return (<svg width={56} height={56}><circle cx={28} cy={28} r={r} fill="none" stroke={C.border} strokeWidth={3}/><circle cx={28} cy={28} r={r} fill="none" stroke={urgent?C.wrong:C.gold} strokeWidth={3} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 28 28)" style={{transition:"stroke-dasharray 1s linear,stroke 0.3s"}}/><text x={28} y={33} textAnchor="middle" fill={urgent?C.wrong:C.gold} fontSize={14} fontFamily="Georgia,serif">{seconds}</text></svg>);
}

function TimerBar({ seconds, max, color = C.gold }) {
  const pct = max > 0 ? (seconds / max) * 100 : 0;
  const urgent = seconds <= 10;
  return (<div style={{height:3,background:C.border,borderRadius:2,marginBottom:16}}><div style={{height:"100%",width:`${pct}%`,background:urgent?C.wrong:color,borderRadius:2,transition:"width 1s linear"}}/></div>);
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK DESIGN CELL
   ═══════════════════════════════════════════════════════════════ */
function BlockCell({ state, size, onClick, disabled }) {
  const s = size;
  return (
    <svg width={s} height={s} onClick={disabled ? undefined : onClick} style={{ cursor: disabled ? "default" : "pointer", border: `1px solid ${C.border}` }}>
      <rect width={s} height={s} fill="#e8e4dc" />
      {state === 1 && <rect width={s} height={s} fill="#d42426" />}
      {state === 2 && <polygon points={`0,0 ${s},0 0,${s}`} fill="#d42426" />}
      {state === 3 && <polygon points={`${s},0 ${s},${s} 0,${s}`} fill="#d42426" />}
    </svg>
  );
}

function BlockTarget({ target, cellSize }) {
  const gridSize = target.length;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridSize},${cellSize}px)`, gap: 1, background: C.border, padding: 1, borderRadius: 4 }}>
      {target.flat().map((state, i) => <BlockCell key={i} state={state} size={cellSize} disabled />)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GOLD BUTTON HELPER
   ═══════════════════════════════════════════════════════════════ */
function GoldButton({ children, onClick, disabled, style: extraStyle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered && !disabled ? C.gold : "transparent", border: `1.5px solid ${C.gold}`, color: hovered && !disabled ? C.bg : C.gold, padding: "12px 40px", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", borderRadius: 3, cursor: disabled ? "default" : "pointer", fontFamily: "Georgia,serif", transition: "all 0.2s", opacity: disabled ? 0.4 : 1, ...extraStyle }}>
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MCQ SUBTEST (Similarities, Vocabulary, Information)
   ═══════════════════════════════════════════════════════════════ */
function MCQSubtest({ subtest, onComplete }) {
  const [itemIdx, setItemIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const timerRef = useRef(null);
  const item = subtest.items[itemIdx];

  useEffect(() => {
    setTimer(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); setRevealed(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [itemIdx]);

  function handleAnswer(i) {
    if (revealed) return;
    clearInterval(timerRef.current);
    setUserAnswer(i);
    setRevealed(true);
    if (i === item.answer) setScore(s => s + 1);
  }

  function handleNext() {
    if (itemIdx < subtest.items.length - 1) {
      setItemIdx(i => i + 1); setUserAnswer(null); setRevealed(false);
    } else {
      onComplete(score + (userAnswer === item.answer ? 0 : 0)); // score already updated
      // Actually score was already incremented in handleAnswer; pass it
    }
  }

  // Fix: need to track score correctly through closure
  const finalScore = useRef(0);
  useEffect(() => { finalScore.current = score; }, [score]);
  function handleNextFinal() {
    if (itemIdx < subtest.items.length - 1) {
      setItemIdx(i => i + 1); setUserAnswer(null); setRevealed(false);
    } else {
      onComplete(finalScore.current);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.muted }}>Item {itemIdx + 1} of {subtest.items.length}</div>
        <TimerRing seconds={timer} max={30} />
      </div>
      <p style={{ fontSize: "clamp(16px,2.2vw,19px)", lineHeight: 1.65, marginBottom: 28, fontFamily: "Georgia,serif", color: C.text }}>{item.prompt}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {item.options.map((opt, i) => {
          let border = C.border, bg = C.surface, color = C.text;
          if (revealed) {
            if (i === item.answer) { border = C.correct; bg = C.correctBg; color = C.correct; }
            else if (i === userAnswer && i !== item.answer) { border = C.wrong; bg = C.wrongBg; color = C.wrong; }
            else { color = C.muted; }
          } else if (userAnswer === i) { border = C.gold; }
          return (
            <button key={i} disabled={revealed} onClick={() => handleAnswer(i)}
              style={{ background: bg, border: `1.5px solid ${border}`, color, borderRadius: 6, padding: "13px 18px", cursor: revealed ? "default" : "pointer", textAlign: "left", fontSize: 15, fontFamily: "Georgia,serif", display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s" }}
              onMouseEnter={e => { if (!revealed) { e.currentTarget.style.transform = "translateX(5px)"; e.currentTarget.style.borderColor = C.goldDim; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; if (userAnswer !== i) e.currentTarget.style.borderColor = C.border; }}>
              <span style={{ fontSize: 11, letterSpacing: 2, color: revealed ? color : C.muted, minWidth: 18 }}>{String.fromCharCode(65 + i)}</span>
              {opt}
              {revealed && i === item.answer && <span style={{ marginLeft: "auto" }}>✓</span>}
              {revealed && i === userAnswer && i !== item.answer && <span style={{ marginLeft: "auto" }}>✗</span>}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div style={{ animation: "fadeUp 0.3s ease", marginTop: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: C.muted, lineHeight: 1.65 }}>
            <span style={{ color: C.gold, marginRight: 8 }}>◈</span>{item.explanation}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <GoldButton onClick={handleNextFinal}>{itemIdx < subtest.items.length - 1 ? "Next →" : "Complete Subtest →"}</GoldButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK DESIGN SUBTEST
   ═══════════════════════════════════════════════════════════════ */
function BlockDesignSubtest({ subtest, onComplete }) {
  const [itemIdx, setItemIdx] = useState(0);
  const [userGrid, setUserGrid] = useState(null);
  const [timer, setTimer] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const timerRef = useRef(null);
  const item = subtest.items[itemIdx];
  const gs = item.gridSize;

  useEffect(() => {
    setUserGrid(Array.from({ length: gs }, () => Array(gs).fill(0)));
    setTimer(item.timeLimit);
    setSubmitted(false); setResult(null);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); setSubmitted(true); setResult(0); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [itemIdx]);

  function cycleCell(r, c) {
    if (submitted) return;
    setUserGrid(g => { const ng = g.map(row => [...row]); ng[r][c] = (ng[r][c] + 1) % 4; return ng; });
  }

  function handleSubmit() {
    clearInterval(timerRef.current);
    const correct = userGrid && item.target.every((row, r) => row.every((cell, c) => userGrid[r][c] === cell));
    let pts = 0;
    if (correct) { pts = timer > (item.timeLimit - item.bonusTime) ? 2 : 1; }
    setResult(pts); setSubmitted(true); setTotalScore(s => s + pts);
  }

  function handleNext() {
    if (itemIdx < subtest.items.length - 1) {
      setItemIdx(i => i + 1);
    } else {
      onComplete(totalScore);
    }
  }

  const cellSize = gs === 2 ? 60 : 44;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.muted }}>Item {itemIdx + 1} of {subtest.items.length}</div>
        <TimerRing seconds={timer} max={item.timeLimit} />
      </div>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 20, letterSpacing: 1 }}>Replicate the target pattern. Click cells to cycle through: white → red → diagonal ↘ → diagonal ↙</p>
      <div style={{ display: "flex", gap: 40, justifyContent: "center", alignItems: "flex-start", flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: C.goldDim, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>Target</div>
          <BlockTarget target={item.target} cellSize={cellSize} />
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: C.goldDim, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>Your Pattern</div>
          {userGrid && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${gs},${cellSize}px)`, gap: 1, background: C.border, padding: 1, borderRadius: 4 }}>
              {userGrid.flatMap((row, r) => row.map((state, c) => (
                <BlockCell key={`${r}-${c}`} state={state} size={cellSize} onClick={() => cycleCell(r, c)} disabled={submitted} />
              )))}
            </div>
          )}
        </div>
      </div>
      {!submitted && <div style={{ textAlign: "center" }}><GoldButton onClick={handleSubmit}>Submit Pattern</GoldButton></div>}
      {submitted && (
        <div style={{ animation: "fadeUp 0.3s ease", marginTop: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: result > 0 ? C.correct : C.wrong, textAlign: "center" }}>
            {result === 2 ? "✓ Correct — Bonus points for speed!" : result === 1 ? "✓ Correct!" : "✗ Incorrect or time expired"}
            <span style={{ color: C.muted, marginLeft: 12 }}>({result} pts)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <GoldButton onClick={handleNext}>{itemIdx < subtest.items.length - 1 ? "Next →" : "Complete Subtest →"}</GoldButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MATRIX REASONING SUBTEST
   ═══════════════════════════════════════════════════════════════ */
function MatrixReasoningSubtest({ subtest, onComplete }) {
  const [itemIdx, setItemIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const timerRef = useRef(null);
  const item = subtest.items[itemIdx];
  const scoreRef = useRef(0);

  useEffect(() => {
    setTimer(30); clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); setRevealed(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [itemIdx]);

  function handleAnswer(i) {
    if (revealed) return;
    clearInterval(timerRef.current);
    setUserAnswer(i); setRevealed(true);
    if (i === item.answer) { setScore(s => s + 1); scoreRef.current += 1; }
  }

  function handleNext() {
    if (itemIdx < subtest.items.length - 1) {
      setItemIdx(i => i + 1); setUserAnswer(null); setRevealed(false);
    } else { onComplete(scoreRef.current); }
  }

  const cellSz = 72;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.muted }}>Item {itemIdx + 1} of {subtest.items.length}</div>
        <TimerRing seconds={timer} max={30} />
      </div>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 20, letterSpacing: 1 }}>Which tile completes the 3×3 matrix?</p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(3,${cellSz}px)`, gap: 6, marginBottom: 28, justifyContent: "center" }}>
        {item.grid.flat().map((cell, i) => (
          <div key={i} style={{ borderRadius: 4, overflow: "hidden" }}>
            {cell === null ? <MatrixCell empty size={cellSz} /> : <MatrixCell cell={cell} size={cellSz} />}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {item.options.map((opt, i) => {
          let border = C.border, bg = C.surface;
          if (revealed) {
            if (i === item.answer) { border = C.correct; bg = C.correctBg; }
            else if (i === userAnswer && i !== item.answer) { border = C.wrong; bg = C.wrongBg; }
          } else if (userAnswer === i) { border = C.gold; }
          return (
            <button key={i} disabled={revealed} onClick={() => handleAnswer(i)}
              style={{ background: bg, border: `2px solid ${border}`, borderRadius: 6, padding: 8, cursor: revealed ? "default" : "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { if (!revealed) e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
              <MatrixCell cell={opt} size={62} ghost={!revealed} />
            </button>
          );
        })}
      </div>
      {revealed && (
        <div style={{ animation: "fadeUp 0.3s ease", marginTop: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: C.muted, lineHeight: 1.65 }}>
            <span style={{ color: C.gold, marginRight: 8 }}>◈</span>{item.explanation}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <GoldButton onClick={handleNext}>{itemIdx < subtest.items.length - 1 ? "Next →" : "Complete Subtest →"}</GoldButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VISUAL PUZZLES SUBTEST
   ═══════════════════════════════════════════════════════════════ */
function VisualPuzzlesSubtest({ subtest, onComplete }) {
  const [itemIdx, setItemIdx] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const item = subtest.items[itemIdx];

  function togglePiece(i) {
    if (checked) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else if (next.size < 3) next.add(i);
      return next;
    });
  }

  function handleCheck() {
    const correct = item.correct.every(c => selected.has(c)) && selected.size === 3;
    setIsCorrect(correct); setChecked(true);
    if (correct) { setScore(s => s + 1); scoreRef.current += 1; }
  }

  function handleNext() {
    if (itemIdx < subtest.items.length - 1) {
      setItemIdx(i => i + 1); setSelected(new Set()); setChecked(false); setIsCorrect(false);
    } else { onComplete(scoreRef.current); }
  }

  const pieceColor = C.pri;
  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Item {itemIdx + 1} of {subtest.items.length}</div>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 16, letterSpacing: 1 }}>Select exactly 3 pieces that combine to form the target shape</p>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: C.goldDim, textTransform: "uppercase", marginBottom: 8 }}>Target: {item.label}</div>
        <svg width={200} height={160} viewBox={item.targetVB} style={{ background: C.surface, borderRadius: 8, border: `1.5px solid ${C.border}`, padding: 16 }}>
          <path d={item.targetPath} fill={pieceColor} opacity={0.3} stroke={pieceColor} strokeWidth={1.5} />
        </svg>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {item.pieces.map((piece, i) => {
          const isSel = selected.has(i);
          let border = isSel ? C.gold : C.border;
          let bg = isSel ? C.goldBg : C.surface;
          if (checked) {
            if (item.correct.includes(i) && isSel) { border = C.correct; bg = C.correctBg; }
            else if (isSel && !item.correct.includes(i)) { border = C.wrong; bg = C.wrongBg; }
            else if (item.correct.includes(i)) { border = C.correct; bg = C.surface; }
          }
          return (
            <button key={i} onClick={() => togglePiece(i)} disabled={checked}
              style={{ background: bg, border: `2px solid ${border}`, borderRadius: 8, padding: 12, cursor: checked ? "default" : "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              onMouseEnter={e => { if (!checked) e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
              <svg width={80} height={60} viewBox={item.targetVB}>
                <path d={piece.path} fill={pieceColor} opacity={0.6} stroke={pieceColor} strokeWidth={1.5} />
              </svg>
              <span style={{ fontSize: 11, color: C.muted, letterSpacing: 2 }}>{String.fromCharCode(65 + i)}</span>
            </button>
          );
        })}
      </div>
      {!checked && selected.size === 3 && (
        <div style={{ textAlign: "center", animation: "fadeUp 0.2s ease" }}><GoldButton onClick={handleCheck}>Check Selection</GoldButton></div>
      )}
      {checked && (
        <div style={{ animation: "fadeUp 0.3s ease", marginTop: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: isCorrect ? C.correct : C.wrong, textAlign: "center" }}>
            {isCorrect ? "✓ Correct! Those 3 pieces form the target shape." : "✗ Incorrect — the highlighted pieces show the correct combination."}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <GoldButton onClick={handleNext}>{itemIdx < subtest.items.length - 1 ? "Next →" : "Complete Subtest →"}</GoldButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DIGIT SPAN SUBTEST
   ═══════════════════════════════════════════════════════════════ */
function DigitSpanSubtest({ subtest, onComplete }) {
  const [itemIdx, setItemIdx] = useState(0);
  const [phase, setPhase] = useState("ready"); // ready | showing | input | feedback
  const [digitIdx, setDigitIdx] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const inputRef = useRef(null);
  const item = subtest.items[itemIdx];
  const prevDirection = itemIdx > 0 ? subtest.items[itemIdx - 1].direction : null;
  const showDirectionChange = item.direction !== prevDirection;

  useEffect(() => {
    setPhase("ready"); setDigitIdx(0); setUserInput(""); setIsCorrect(false);
  }, [itemIdx]);

  useEffect(() => {
    if (phase === "ready") {
      const t = setTimeout(() => { setPhase("showing"); setDigitIdx(0); }, showDirectionChange ? 2500 : 1200);
      return () => clearTimeout(t);
    }
    if (phase === "showing") {
      if (digitIdx < item.digits.length) {
        const t = setTimeout(() => setDigitIdx(d => d + 1), 1000);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => { setPhase("input"); }, 500);
        return () => clearTimeout(t);
      }
    }
  }, [phase, digitIdx, itemIdx]);

  useEffect(() => {
    if (phase === "input" && inputRef.current) inputRef.current.focus();
  }, [phase]);

  function handleSubmit() {
    const expected = item.direction === "backward" ? [...item.digits].reverse().join("") : item.digits.join("");
    const correct = userInput.trim() === expected;
    setIsCorrect(correct); setPhase("feedback");
    if (correct) { setScore(s => s + 1); scoreRef.current += 1; }
  }

  function handleNext() {
    if (itemIdx < subtest.items.length - 1) { setItemIdx(i => i + 1); }
    else { onComplete(scoreRef.current); }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Sequence {itemIdx + 1} of {subtest.items.length}</div>

      {phase === "ready" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          {showDirectionChange && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 20 }}>
              <div style={{ fontSize: 16, color: C.gold, fontFamily: "Georgia,serif", marginBottom: 8 }}>
                {item.direction === "forward" ? "Forward Recall" : "Backward Recall"}
              </div>
              <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
                {item.direction === "forward"
                  ? "Type the digits in the SAME order they appear."
                  : "Now type the digits in REVERSE order."}
              </p>
            </div>
          )}
          <div style={{ fontSize: 18, color: C.muted, fontFamily: "Georgia,serif" }}>Watch carefully…</div>
          <div style={{ fontSize: 13, color: C.goldDim, marginTop: 8 }}>{item.digits.length} digits · {item.direction}</div>
        </div>
      )}

      {phase === "showing" && (
        <div style={{ animation: "fadeUp 0.15s ease" }}>
          <div style={{ fontSize: 13, color: C.goldDim, letterSpacing: 4, textTransform: "uppercase", marginBottom: 20 }}>{item.direction}</div>
          {digitIdx < item.digits.length ? (
            <div key={digitIdx} style={{ fontSize: 96, fontWeight: 300, color: C.gold, fontFamily: "Georgia,serif", animation: "fadeUp 0.2s ease", lineHeight: 1 }}>{item.digits[digitIdx]}</div>
          ) : (
            <div style={{ fontSize: 22, color: C.muted }}>…</div>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
            {item.digits.map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < digitIdx ? C.gold : C.border, transition: "background 0.3s" }} />
            ))}
          </div>
        </div>
      )}

      {phase === "input" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ fontSize: 15, color: C.text, fontFamily: "Georgia,serif", marginBottom: 20 }}>
            Type the digits {item.direction === "backward" ? "in REVERSE order" : "in order"}:
          </div>
          <input ref={inputRef} type="text" inputMode="numeric" pattern="[0-9]*" value={userInput}
            onChange={e => setUserInput(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={e => { if (e.key === "Enter" && userInput.length > 0) handleSubmit(); }}
            style={{ background: C.surface, border: `1.5px solid ${C.gold}`, color: C.gold, fontSize: 32, fontFamily: "Georgia,serif", textAlign: "center", padding: "12px 24px", borderRadius: 6, outline: "none", width: 200, letterSpacing: 8 }}
            maxLength={item.digits.length + 1} autoComplete="off" />
          <div style={{ marginTop: 20 }}><GoldButton onClick={handleSubmit} disabled={userInput.length === 0}>Submit</GoldButton></div>
        </div>
      )}

      {phase === "feedback" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{isCorrect ? "✓" : "✗"}</div>
          <div style={{ fontSize: 16, color: isCorrect ? C.correct : C.wrong, marginBottom: 8 }}>
            {isCorrect ? "Correct!" : "Incorrect"}
          </div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
            Expected: <span style={{ color: C.text, letterSpacing: 4 }}>{item.direction === "backward" ? [...item.digits].reverse().join(" ") : item.digits.join(" ")}</span>
            {!isCorrect && <> — You entered: <span style={{ color: C.wrong, letterSpacing: 4 }}>{userInput.split("").join(" ") || "—"}</span></>}
          </div>
          <GoldButton onClick={handleNext}>{itemIdx < subtest.items.length - 1 ? "Next →" : "Complete Subtest →"}</GoldButton>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ARITHMETIC SUBTEST
   ═══════════════════════════════════════════════════════════════ */
function ArithmeticSubtest({ subtest, onComplete }) {
  const [itemIdx, setItemIdx] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timer, setTimer] = useState(30);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const item = subtest.items[itemIdx];

  useEffect(() => {
    setTimer(item.timeLimit); setUserInput(""); setSubmitted(false); setIsCorrect(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); setSubmitted(true); setIsCorrect(false); return 0; } return t - 1; });
    }, 1000);
    if (inputRef.current) inputRef.current.focus();
    return () => clearInterval(timerRef.current);
  }, [itemIdx]);

  function handleSubmit() {
    clearInterval(timerRef.current);
    const answer = parseFloat(userInput);
    const correct = !isNaN(answer) && Math.abs(answer - item.answer) < 0.5;
    setIsCorrect(correct); setSubmitted(true);
    if (correct) { setScore(s => s + 1); scoreRef.current += 1; }
  }

  function handleNext() {
    if (itemIdx < subtest.items.length - 1) { setItemIdx(i => i + 1); }
    else { onComplete(scoreRef.current); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.muted }}>Problem {itemIdx + 1} of {subtest.items.length}</div>
        <TimerRing seconds={timer} max={item.timeLimit} />
      </div>
      <p style={{ fontSize: "clamp(16px,2.2vw,19px)", lineHeight: 1.65, marginBottom: 28, fontFamily: "Georgia,serif", color: C.text }}>{item.problem}</p>
      {!submitted ? (
        <div style={{ textAlign: "center" }}>
          <input ref={inputRef} type="text" inputMode="decimal" value={userInput}
            onChange={e => setUserInput(e.target.value.replace(/[^0-9.\-]/g, ""))}
            onKeyDown={e => { if (e.key === "Enter" && userInput.length > 0) handleSubmit(); }}
            placeholder="Your answer"
            style={{ background: C.surface, border: `1.5px solid ${C.gold}`, color: C.gold, fontSize: 28, fontFamily: "Georgia,serif", textAlign: "center", padding: "12px 24px", borderRadius: 6, outline: "none", width: 160 }}
            autoComplete="off" />
          <div style={{ marginTop: 20 }}><GoldButton onClick={handleSubmit} disabled={userInput.length === 0}>Submit</GoldButton></div>
        </div>
      ) : (
        <div style={{ animation: "fadeUp 0.3s ease", textAlign: "center" }}>
          <div style={{ fontSize: 16, color: isCorrect ? C.correct : C.wrong, marginBottom: 8 }}>
            {isCorrect ? "✓ Correct!" : `✗ Incorrect — the answer is ${item.answer}`}
          </div>
          <div style={{ marginTop: 20 }}><GoldButton onClick={handleNext}>{itemIdx < subtest.items.length - 1 ? "Next →" : "Complete Subtest →"}</GoldButton></div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SYMBOL SEARCH SESSION
   ═══════════════════════════════════════════════════════════════ */
function generateSSRow() {
  const all = [0,1,2,3,4,5,6,7,8];
  const shuffle = a => { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; };
  const shuffled = shuffle(all);
  const targets = [shuffled[0], shuffled[1]];
  const hasMatch = Math.random() < 0.5;
  let candidates;
  if (hasMatch) {
    const matchTarget = targets[Math.random() < 0.5 ? 0 : 1];
    const others = shuffle(all.filter(s => s !== targets[0] && s !== targets[1])).slice(0, 4);
    candidates = shuffle([matchTarget, ...others]);
  } else {
    candidates = shuffle(all.filter(s => s !== targets[0] && s !== targets[1])).slice(0, 5);
  }
  return { targets, candidates, hasMatch };
}

function SymbolSearchSubtest({ onComplete }) {
  const [timeLeft, setTimeLeft] = useState(90);
  const [rows] = useState(() => Array.from({ length: 80 }, generateSSRow));
  const [currentRow, setCurrentRow] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const [flash, setFlash] = useState(null);
  const timerRef = useRef(null);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setDone(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  function handleAnswer(yes) {
    if (done || currentRow >= rows.length) return;
    const row = rows[currentRow];
    const isCorrect = (yes && row.hasMatch) || (!yes && !row.hasMatch);
    if (isCorrect) { setCorrect(c => c + 1); correctRef.current += 1; setFlash("correct"); }
    else { setWrong(w => w + 1); wrongRef.current += 1; setFlash("wrong"); }
    setTimeout(() => setFlash(null), 200);
    setCurrentRow(r => r + 1);
  }

  if (done) {
    const rawScore = Math.max(0, correctRef.current - wrongRef.current);
    return (
      <div style={{ textAlign: "center", animation: "fadeUp 0.3s ease" }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Session Complete</div>
        <div style={{ fontSize: 64, fontWeight: 300, color: C.gold, fontFamily: "Georgia,serif" }}>{rawScore}</div>
        <div style={{ color: C.muted, fontSize: 14, marginTop: 8, marginBottom: 8 }}>Raw Score (correct − wrong)</div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>{correctRef.current} correct · {wrongRef.current} wrong · {currentRow} attempted</div>
        <GoldButton onClick={() => onComplete(rawScore)}>Complete Subtest →</GoldButton>
      </div>
    );
  }

  const row = rows[currentRow];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.muted }}>Row {currentRow + 1}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: C.correct }}>{correct}✓</span>
          <span style={{ fontSize: 13, color: C.wrong }}>{wrong}✗</span>
          <TimerRing seconds={timeLeft} max={90} />
        </div>
      </div>
      <TimerBar seconds={timeLeft} max={90} color={C.psi} />
      <div style={{ background: flash === "correct" ? C.correctBg : flash === "wrong" ? C.wrongBg : C.surface, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "20px 24px", display: "flex", alignItems: "center", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 24, transition: "background 0.15s" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 11, color: C.goldDim, letterSpacing: 2, textTransform: "uppercase", marginRight: 8 }}>Target</div>
          {row.targets.map((id, i) => (
            <div key={i} style={{ background: C.bg, borderRadius: 4, padding: 6, border: `1px solid ${C.gold}` }}>
              <SymbolIcon id={id} size={36} color={C.gold} />
            </div>
          ))}
        </div>
        <div style={{ width: 1, height: 48, background: C.border }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginRight: 8 }}>Search</div>
          {row.candidates.map((id, i) => (
            <div key={i} style={{ background: C.bg, borderRadius: 4, padding: 6, border: `1px solid ${C.border}` }}>
              <SymbolIcon id={id} size={36} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        <button onClick={() => handleAnswer(true)}
          style={{ background: C.surface, border: `1.5px solid ${C.correct}`, color: C.correct, padding: "14px 40px", fontSize: 15, fontFamily: "Georgia,serif", borderRadius: 6, cursor: "pointer", letterSpacing: 2, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = C.correctBg; }} onMouseLeave={e => { e.currentTarget.style.background = C.surface; }}>
          YES
        </button>
        <button onClick={() => handleAnswer(false)}
          style={{ background: C.surface, border: `1.5px solid ${C.wrong}`, color: C.wrong, padding: "14px 40px", fontSize: 15, fontFamily: "Georgia,serif", borderRadius: 6, cursor: "pointer", letterSpacing: 2, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = C.wrongBg; }} onMouseLeave={e => { e.currentTarget.style.background = C.surface; }}>
          NO
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CODING SESSION
   ═══════════════════════════════════════════════════════════════ */
function CodingSubtest({ onComplete }) {
  const KEY = useMemo(() => [0,1,2,3,4,5,6,7,8], []);
  const [timeLeft, setTimeLeft] = useState(120);
  const [items] = useState(() => Array.from({ length: 100 }, () => Math.floor(Math.random() * 9) + 1));
  const [currentItem, setCurrentItem] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [flash, setFlash] = useState(null);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);
  const correctRef = useRef(0);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); setDone(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  function handleSymbolClick(symbolId) {
    if (done) return;
    const expectedSymbol = KEY[items[currentItem] - 1];
    if (symbolId === expectedSymbol) {
      setCorrect(c => c + 1); correctRef.current += 1;
      setFlash("correct");
      setCurrentItem(i => i + 1);
    } else {
      setFlash("wrong");
    }
    setTimeout(() => setFlash(null), 200);
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", animation: "fadeUp 0.3s ease" }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Session Complete</div>
        <div style={{ fontSize: 64, fontWeight: 300, color: C.gold, fontFamily: "Georgia,serif" }}>{correctRef.current}</div>
        <div style={{ color: C.muted, fontSize: 14, marginTop: 8, marginBottom: 24 }}>Symbols correctly coded in 120 seconds</div>
        <GoldButton onClick={() => onComplete(correctRef.current)}>Complete Subtest →</GoldButton>
      </div>
    );
  }

  const currentNumber = items[currentItem];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.muted }}>Coded: {correct}</div>
        <TimerRing seconds={timeLeft} max={120} />
      </div>
      <TimerBar seconds={timeLeft} max={120} color={C.psi} />
      {/* Key legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {KEY.map((symId, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 8px", minWidth: 40 }}>
            <span style={{ fontSize: 14, color: C.text, fontFamily: "Georgia,serif" }}>{i + 1}</span>
            <SymbolIcon id={symId} size={22} />
          </div>
        ))}
      </div>
      {/* Current number */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: C.goldDim, textTransform: "uppercase", marginBottom: 8 }}>Match this number</div>
        <div style={{ fontSize: 72, fontWeight: 300, color: flash === "correct" ? C.correct : flash === "wrong" ? C.wrong : C.gold, fontFamily: "Georgia,serif", transition: "color 0.15s" }}>{currentNumber}</div>
      </div>
      {/* Symbol buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
        {KEY.map((symId) => (
          <button key={symId} onClick={() => handleSymbolClick(symId)}
            style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: 10, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.transform = "scale(1.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "scale(1)"; }}>
            <SymbolIcon id={symId} size={36} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUBTEST RUNNER — dispatches to correct component
   ═══════════════════════════════════════════════════════════════ */
function SubtestRunner({ subtest, onComplete }) {
  switch (subtest.type) {
    case "mcq": return <MCQSubtest subtest={subtest} onComplete={onComplete} />;
    case "block-design": return <BlockDesignSubtest subtest={subtest} onComplete={onComplete} />;
    case "matrix": return <MatrixReasoningSubtest subtest={subtest} onComplete={onComplete} />;
    case "visual-puzzles": return <VisualPuzzlesSubtest subtest={subtest} onComplete={onComplete} />;
    case "digit-span": return <DigitSpanSubtest subtest={subtest} onComplete={onComplete} />;
    case "arithmetic": return <ArithmeticSubtest subtest={subtest} onComplete={onComplete} />;
    case "symbol-search": return <SymbolSearchSubtest onComplete={onComplete} />;
    case "coding": return <CodingSubtest onComplete={onComplete} />;
    default: return <div style={{ color: C.muted }}>Unknown subtest type: {subtest.type}</div>;
  }
}

/* ═══════════════════════════════════════════════════════════════
   INTRO SCREEN
   ═══════════════════════════════════════════════════════════════ */
function IntroScreen({ onBegin }) {
  const [age, setAge] = useState(25);
  const bracketIdx = getAgeBracketIndex(age);
  const bracket = AGE_BRACKETS[bracketIdx];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Georgia,serif" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>
      <div style={{ animation: "fadeUp 0.6s ease", textAlign: "center", maxWidth: 620 }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: C.gold, marginBottom: 20, textTransform: "uppercase" }}>Cognitive Assessment Battery</div>
        <h1 style={{ fontSize: "clamp(36px,7vw,64px)", fontWeight: 400, color: C.text, margin: "0 0 8px", letterSpacing: -2, lineHeight: 1 }}>
          WAIS-IV Style<br /><em style={{ color: C.gold }}>IQ Test</em>
        </h1>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, margin: "20px 0 32px" }}>
          10 subtests · 4 cognitive indices · Age-normed scoring<br />
          Verbal Comprehension · Perceptual Reasoning · Working Memory · Processing Speed
        </p>

        {/* Cognitive Index cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 32 }}>
          {Object.entries(INDICES).map(([key, idx]) => (
            <div key={key} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 20, color: idx.color }}>{idx.icon}</span>
              <span style={{ fontSize: 11, color: idx.color, letterSpacing: 1, textAlign: "center", lineHeight: 1.3 }}>{idx.name}</span>
            </div>
          ))}
        </div>

        {/* Age input */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Your Age</div>
          <div style={{ fontSize: 48, color: C.gold, fontWeight: 300, marginBottom: 12 }}>{age}</div>
          <input type="range" min={16} max={85} value={age} onChange={e => setAge(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: C.gold, cursor: "pointer" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginTop: 4 }}>
            <span>16</span><span>85+</span>
          </div>
          {bracket && (
            <div style={{ fontSize: 13, color: C.mutedLight, marginTop: 12 }}>
              Normed against ages <span style={{ color: C.gold }}>{bracket.label}</span>
            </div>
          )}
          <p style={{ fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.6, fontStyle: "italic" }}>
            Your score is compared only to others in your age bracket — an IQ of 100 always means "average for your age."
          </p>
        </div>

        <GoldButton onClick={() => onBegin(age, bracketIdx)}>Begin Assessment →</GoldButton>

        <p style={{ fontSize: 11, color: "#2e2c28", marginTop: 24, lineHeight: 1.6 }}>
          Practice assessment only · Not a clinical diagnostic tool<br />
          Modelled on the Wechsler Adult Intelligence Scale (WAIS-IV)
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUBTEST BRIEFING SCREEN
   ═══════════════════════════════════════════════════════════════ */
function SubtestBriefing({ subtest, subtestIndex, total, onStart }) {
  const index = INDICES[subtest.indexId];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Georgia,serif" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ animation: "fadeUp 0.5s ease", textAlign: "center", maxWidth: 520 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Subtest {subtestIndex + 1} of {total}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${index.color}15`, border: `1px solid ${index.color}40`, borderRadius: 20, padding: "6px 16px", marginBottom: 20 }}>
          <span style={{ color: index.color, fontSize: 14 }}>{index.icon}</span>
          <span style={{ fontSize: 12, color: index.color, letterSpacing: 1 }}>{index.name}</span>
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 400, color: C.text, margin: "0 0 8px", letterSpacing: -1 }}>{subtest.name}</h2>
        <div style={{ fontSize: 22, color: index.color, marginBottom: 24 }}>{subtest.icon}</div>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, margin: "0 0 36px", maxWidth: 440, marginInline: "auto" }}>{subtest.briefing}</p>
        {subtest.items && <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{subtest.items.length} items</div>}
        {subtest.sessionTime && <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Timed session: {subtest.sessionTime} seconds</div>}
        <GoldButton onClick={onStart}>Begin Subtest →</GoldButton>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESULTS DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
function ResultsDashboard({ subtestResults, bracketIdx, userAge, onRestart }) {
  const bracket = AGE_BRACKETS[bracketIdx];

  // Compute scaled scores
  const scaledScores = {};
  SUBTESTS.forEach(st => {
    const raw = subtestResults[st.id] ?? 0;
    scaledScores[st.id] = rawToScaled(raw, st.id, bracketIdx);
  });

  // Compute index scores
  const indexScores = {};
  Object.entries(INDICES).forEach(([key, idx]) => {
    const sum = idx.subtests.reduce((s, stId) => s + (scaledScores[stId] || 10), 0);
    indexScores[key] = sumToIndex(sum, idx.subtests.length);
  });

  // Full-Scale IQ
  const fsiq = computeFSIQ(scaledScores);
  const fsiqPercentile = iqToPercentile(fsiq);
  const fsiqClass = iqToClassification(fsiq);
  const ci95Low = Math.max(40, fsiq - 5);
  const ci95High = Math.min(160, fsiq + 5);

  // Discrepancies
  const indexKeys = Object.keys(indexScores);
  const discrepancies = [];
  for (let i = 0; i < indexKeys.length; i++) {
    for (let j = i + 1; j < indexKeys.length; j++) {
      const diff = Math.abs(indexScores[indexKeys[i]] - indexScores[indexKeys[j]]);
      if (diff > 15) {
        const higher = indexScores[indexKeys[i]] > indexScores[indexKeys[j]] ? indexKeys[i] : indexKeys[j];
        const lower = higher === indexKeys[i] ? indexKeys[j] : indexKeys[i];
        discrepancies.push({ higher, lower, diff, hScore: indexScores[higher], lScore: indexScores[lower] });
      }
    }
  }

  // Fluid vs Crystallized
  const fluidIdx = Math.round((indexScores.PRI + indexScores.PSI) / 2);
  const crystIdx = indexScores.VCI;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "40px 24px", fontFamily: "Georgia,serif" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes growWidth{from{width:0}}`}</style>
      <div style={{ maxWidth: 700, margin: "0 auto", animation: "fadeUp 0.5s ease" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.goldBg, border: `1px solid ${C.goldDim}`, borderRadius: 20, padding: "5px 14px", marginBottom: 16, fontSize: 12, color: C.gold, letterSpacing: 2 }}>
            Normed for ages {bracket?.label || "—"} (age {userAge})
          </div>
          <div style={{ fontSize: 11, letterSpacing: 6, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Full-Scale IQ</div>
          <div style={{ fontSize: "clamp(72px,14vw,120px)", fontWeight: 300, color: C.gold, lineHeight: 1, letterSpacing: -4 }}>{fsiq}</div>
          <div style={{ fontSize: 18, color: C.text, marginTop: 6, letterSpacing: 2 }}>{fsiqClass}</div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>95% CI: {ci95Low}–{ci95High} · Percentile: {fsiqPercentile}th</div>
        </div>

        {/* Index Score Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 32 }}>
          {Object.entries(INDICES).map(([key, idx]) => {
            const score = indexScores[key];
            const pct = iqToPercentile(score);
            const cls = iqToClassification(score);
            return (
              <div key={key} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 16, color: idx.color }}>{idx.icon}</span>
                  <span style={{ fontSize: 12, color: idx.color, letterSpacing: 2, textTransform: "uppercase" }}>{idx.abbr}</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 300, color: idx.color, lineHeight: 1, marginBottom: 4 }}>{score}</div>
                <div style={{ fontSize: 13, color: C.text, marginBottom: 2 }}>{cls}</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Percentile: {pct}th</div>
                {/* Per-subtest scaled scores */}
                {idx.subtests.map(stId => {
                  const st = SUBTESTS.find(s => s.id === stId);
                  const ss = scaledScores[stId] || 10;
                  const barPct = ((ss - 1) / 18) * 100;
                  return (
                    <div key={stId} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 3 }}>
                        <span>{st?.name || stId}</span>
                        <span style={{ color: idx.color }}>{ss}</span>
                      </div>
                      <div style={{ height: 3, background: C.border, borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${barPct}%`, background: idx.color, borderRadius: 2, transition: "width 1s ease 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Profile Chart */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Index Profile</div>
          {Object.entries(INDICES).map(([key, idx]) => {
            const score = indexScores[key];
            const barPct = ((score - 40) / 120) * 100;
            const meanPct = ((100 - 40) / 120) * 100;
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted, marginBottom: 4 }}>
                  <span>{idx.abbr}</span>
                  <span style={{ color: idx.color, fontWeight: 500 }}>{score}</span>
                </div>
                <div style={{ position: "relative", height: 8, background: C.border, borderRadius: 4 }}>
                  <div style={{ position: "absolute", left: `${meanPct}%`, top: -2, bottom: -2, width: 1, background: C.muted, opacity: 0.5 }} />
                  <div style={{ height: "100%", width: `${barPct}%`, background: idx.color, borderRadius: 4, transition: "width 1.2s ease 0.3s" }} />
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 8 }}>
            <span>40</span><span>70</span><span style={{ color: C.mutedLight }}>100 (mean)</span><span>130</span><span>160</span>
          </div>
        </div>

        {/* Cognitive Trajectory */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Cognitive Trajectory</div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.vci, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Crystallized</div>
              <div style={{ fontSize: 32, color: C.vci, fontWeight: 300 }}>{crystIdx}</div>
              <div style={{ fontSize: 11, color: C.muted }}>VCI</div>
            </div>
            <div style={{ width: 1, background: C.border, margin: "0 8px" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.psi, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Fluid</div>
              <div style={{ fontSize: 32, color: C.psi, fontWeight: 300 }}>{fluidIdx}</div>
              <div style={{ fontSize: 11, color: C.muted }}>PRI + PSI avg</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, textAlign: "center", margin: 0 }}>
            {crystIdx > fluidIdx + 10
              ? "Your crystallized abilities (vocabulary, knowledge) are notably stronger than fluid abilities (speed, reasoning) — a pattern that typically becomes more pronounced with age."
              : fluidIdx > crystIdx + 10
              ? "Your fluid abilities (reasoning, speed) are notably stronger than crystallized abilities — a pattern more common in younger adults."
              : "Your crystallized and fluid abilities are well-balanced, suggesting even cognitive development across domains."}
          </p>
        </div>

        {/* Discrepancy Analysis */}
        {discrepancies.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 20px", marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Discrepancy Analysis</div>
            {discrepancies.map((d, i) => (
              <div key={i} style={{ marginBottom: 12, padding: "10px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6 }}>
                <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>
                  <span style={{ color: INDICES[d.higher].color }}>{d.higher} ({d.hScore})</span>
                  <span style={{ color: C.muted }}> vs </span>
                  <span style={{ color: INDICES[d.lower].color }}>{d.lower} ({d.lScore})</span>
                  <span style={{ color: C.gold, marginLeft: 8 }}>Δ{d.diff}</span>
                </div>
                <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6 }}>
                  A difference of {d.diff} points between {INDICES[d.higher].name} and {INDICES[d.lower].name} is statistically significant ({'>'} 15 pts) and may warrant further clinical evaluation.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Restart */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <GoldButton onClick={onRestart} style={{ width: "100%" }}>Take Again →</GoldButton>
          <p style={{ fontSize: 11, color: "#2e2c28", marginTop: 20, lineHeight: 1.6 }}>
            Practice assessment only · Not a clinical diagnostic tool<br />
            Modelled on the Wechsler Adult Intelligence Scale (WAIS-IV)
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
export default function IQTest() {
  const [phase, setPhase] = useState("intro"); // intro | briefing | subtest | results
  const [userAge, setUserAge] = useState(null);
  const [bracketIdx, setBracketIdx] = useState(0);
  const [currentSubtestIdx, setCurrentSubtestIdx] = useState(0);
  const [subtestResults, setSubtestResults] = useState({});

  function handleBegin(age, bracket) {
    setUserAge(age); setBracketIdx(bracket);
    setCurrentSubtestIdx(0); setSubtestResults({});
    setPhase("briefing");
  }

  function handleStartSubtest() {
    setPhase("subtest");
  }

  function handleSubtestComplete(rawScore) {
    const st = SUBTESTS[currentSubtestIdx];
    setSubtestResults(prev => ({ ...prev, [st.id]: rawScore }));

    if (currentSubtestIdx < SUBTESTS.length - 1) {
      setCurrentSubtestIdx(i => i + 1);
      setPhase("briefing");
    } else {
      setPhase("results");
    }
  }

  function handleRestart() {
    setPhase("intro"); setCurrentSubtestIdx(0); setSubtestResults({});
    setUserAge(null); setBracketIdx(0);
  }

  const currentSubtest = SUBTESTS[currentSubtestIdx];

  if (phase === "intro") return <IntroScreen onBegin={handleBegin} />;

  if (phase === "briefing") {
    return <SubtestBriefing subtest={currentSubtest} subtestIndex={currentSubtestIdx} total={SUBTESTS.length} onStart={handleStartSubtest} />;
  }

  if (phase === "results") {
    return <ResultsDashboard subtestResults={subtestResults} bracketIdx={bracketIdx} userAge={userAge} onRestart={handleRestart} />;
  }

  // Quiz phase
  const index = INDICES[currentSubtest.indexId];
  const progress = (currentSubtestIdx / SUBTESTS.length) * 100;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "Georgia,serif" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div key={`${currentSubtestIdx}`} style={{ animation: "fadeUp 0.35s ease", width: "100%", maxWidth: 680 }}>
        {/* Subtest header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, color: index.color }}>{currentSubtest.icon}</span>
              <span style={{ fontSize: 11, letterSpacing: 4, color: index.color, textTransform: "uppercase" }}>{currentSubtest.name}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
              {index.abbr} · Subtest {currentSubtestIdx + 1} of {SUBTESTS.length}
            </div>
          </div>
        </div>
        {/* Overall progress */}
        <div style={{ height: 2, background: C.border, borderRadius: 2, marginBottom: 24 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: C.gold, borderRadius: 2, transition: "width 0.4s ease" }} />
        </div>
        {/* Subtest content */}
        <SubtestRunner subtest={currentSubtest} onComplete={handleSubtestComplete} />
      </div>
    </div>
  );
}
