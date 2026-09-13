import React, { useState, useRef, useEffect } from "react";
import { generateOverthinkLines } from "./groq";
import {
  Phone,
  Camera,
  MessageCircleHeart,
  BookHeart,
  Flame,
  Sparkles,
  Send,
  Upload,
  RotateCcw,
  Copy,
  Check,
  Skull,
  Ghost,
} from "lucide-react";

/* =========================================================================
   OVERTHINK-O-METER
   A satirical overthinking simulator. Everything is generated client-side
   from template banks (no backend needed) so it demos instantly.
   ========================================================================= */

const COLORS = {
  cream: "#FBF3EA",
  ink: "#241C33",
  inkSoft: "#4A3F63",
  mint: "#AEE8D0",
  mintDeep: "#6FCBA6",
  lavender: "#E4D9FA",
  lavenderDeep: "#C6AEF2",
  hotpink: "#FF5FA0",
  flame: "#FF4747",
  sunshine: "#FFD84D",
  paper: "#FFFDF8",
};

/* ---------------------------- template banks ---------------------------- */

const SCENARIO_TIERS = [
  {
    label: "mild spiral",
    color: COLORS.mintDeep,
    lines: (s) => [
      `Okay realistically? ${s} probably means nothing. They're busy. People are busy sometimes. This is fine.`,
      `Statistically speaking, "${s}" has a boring explanation 90% of the time. You are in the 90%. Probably.`,
    ],
  },
  {
    label: "main character spiral",
    color: COLORS.hotpink,
    lines: (s) => [
      `But WHAT IF "${s}" is actually a sign? What if this is the universe telling you something and you're just choosing to ignore it??`,
      `Okay but replay the last 3 conversations. Slowly. Word by word. Did the punctuation change? Because punctuation NEVER changes for no reason.`,
      `You should probably analyze their last 12 messages for tone shifts. This is basic due diligence.`,
    ],
  },
  {
    label: "unhinged tier",
    color: COLORS.flame,
    lines: (s) => [
      `"${s}" is clearly the beginning of the end. You already know how this ends. You've seen this movie. You ARE this movie.`,
      `Time to write the group chat essay. Full timeline. Screenshots. Font size 14, Calibri, single-spaced, footnotes optional but recommended.`,
      `Honestly at this point you should just assume the worst, prepare a speech, and also maybe move to a different country. Just in case.`,
    ],
  },
  {
    label: "conspiracy tier",
    color: "#8B2CF5",
    lines: (s) => [
      `Connect the string to the corkboard. "${s}" is not isolated. This goes back to March. Maybe further. We need a timeline wall.`,
      `Everyone is in on it. Your friends know. Their friends know. The barista definitely knows. You are the last to find out, as always.`,
      `This has stopped being about "${s}" and started being about the fundamental nature of trust, fate, and whether Mercury is in retrograde (it is. it's always retrograde when it matters).`,
    ],
  },
];

const CALL_TIERS = [
  { severity: 1, label: "mundane", color: COLORS.mintDeep, reasons: [
    "asking if you're free this weekend",
    "wants to know if you still have their charger",
    "butt-dialed you, no actual reason",
    "reminding you about something you already know about",
  ]},
  { severity: 2, label: "mildly suspicious", color: COLORS.sunshine, reasons: [
    "calling instead of texting, which is ALREADY weird",
    "wants to \"talk about something\" — no further context given, rude",
    "asking where you were last night in a tone",
  ]},
  { severity: 3, label: "code red", color: COLORS.hotpink, reasons: [
    "someone told them something and now they're calling YOU about it",
    "\"we need to talk\" energy radiating through the phone screen itself",
    "calling at an unusual hour, which means it's Serious",
  ]},
  { severity: 4, label: "prepare a will", color: COLORS.flame, reasons: [
    "this is The Call. You've been expecting this call your whole life.",
    "they found the group chat screenshots",
    "it's about to be a whole thing and you don't even know what the thing is yet",
  ]},
];

const TOXIC_PERSONAS = [
  {
    id: "mom",
    name: "Disappointed Mom",
    emoji: "🧿",
    style: (situation) => [
      `You're asking ME? After everything I've sacrificed? About "${situation}"? I just think it's interesting, that's all. I'm not saying anything. I just think it's interesting.`,
      `Well when I was your age I would NEVER have let "${situation}" happen, but you know, everyone does things differently now I guess.`,
      `Fine. Do what you want. I'll just be over here. Worrying. Like always. Don't mind me.`,
    ],
  },
  {
    id: "bestie",
    name: "Unhinged Bestie",
    emoji: "💅",
    style: (situation) => [
      `Girl "${situation}"?? Absolutely not. We are cutting them off TODAY. I already typed the text. Do you want fire emoji or skull emoji.`,
      `Okay but did you consider posting a cryptic story about "${situation}" and just... letting them wonder? I'm just saying. It's an option.`,
      `I've never liked them. I said it once in 2019 and I'll say it again: "${situation}" was always going to happen. I called it.`,
    ],
  },
  {
    id: "auntie",
    name: "Nosy Auntie",
    emoji: "👀",
    style: (situation) => [
      `So "${situation}" huh. Interesting. Very interesting. Does your mother know about this? I'm just asking. For context. For the family group chat context.`,
      `Back in MY day "${situation}" would've been solved with one (1) direct conversation, but you kids like to make everything complicated with your... apps.`,
      `I'm not judging. I would just simply never. But you do you. I'll bring this up at Thanksgiving lovingly.`,
    ],
  },
  {
    id: "ex",
    name: "Situationship Ghost",
    emoji: "👻",
    style: (situation) => [
      `interesting that you're dealing with "${situation}" and thinking of ME right now. anyway. hope ur good. 🙂`,
      `wow "${situation}"... crazy how things change. anyway hope the new person treats you well. genuinely.`,
      `lol ok. anyway good luck with "${situation}", I'm sure it'll work out this time 🙂 (seen 4:47pm)`,
    ],
  },
];

const SAVAGE_TEMPLATES = [
  (m) => `"${m}"?? okay bestie I'm going to need you to gather your things and exit stage left`,
  (m) => `respectfully... this ain't it. try again in 3-5 business days`,
  (m) => `the audacity to say "${m}" and think it wasn't going in my notes app`,
  (m) => `sir this is a Wendy's. anyway no.`,
  (m) => `I read "${m}" and immediately aged four years`,
  (m) => `bold of you to assume I'd respond to that with anything other than silence and a slow blink`,
  (m) => `not you saying "${m}" like that was ever going to work 💀`,
  (m) => `girl what. genuinely what. try that again but this time think first`,
];

const CAPTION_MOODS = [
  { id: "heartbreak", label: "Heartbreak Era", emoji: "🖤", captions: [
    "some people are just chapters, not the whole book. still annoying though.",
    "closed the chat, opened the wound. new personality dropping soon.",
    "not healed but the eyeliner is sharp so we move.",
  ]},
  { id: "delulu", label: "Delulu Era", emoji: "✨", captions: [
    "manifesting a plot twist. the universe owes me one (1) miracle.",
    "delulu is the solulu and I do not make the rules.",
    "we are so back (this is not based on any evidence).",
  ]},
  { id: "chaotic-single", label: "Chaotic Single Era", emoji: "💃", captions: [
    "single and thriving, mostly the second one, working on the first",
    "my situationship count is a war crime at this point and I regret nothing",
    "in my villain era but the wifi is bad so it's more of an inconvenience era",
  ]},
  { id: "3am", label: "3am Existential", emoji: "🌙", captions: [
    "3am thoughts hit different when you're staring at a ceiling that has never let you down",
    "not to be dramatic but the ceiling and I have an understanding",
    "does anyone actually sleep or do we just lie there reviewing 2016",
  ]},
];

const JOURNAL_ROASTS = [
  "babe you wrote four paragraphs about a text that said \"k\". we need to talk. lovingly.",
  "this entry has more plot twists than a soap opera and the plot is: they replied slower than usual.",
  "you've officially written a Pulitzer-worthy essay about something that will not matter in nine days.",
  "the detective energy in this entry is unmatched. Sherlock Holmes could not crack this case, but you tried, on a Tuesday, over nothing.",
  "reading this back, be honest — would you believe you if a friend told you this? exactly. but we still love you.",
];
const JOURNAL_SOFT_LANDING = [
  "also, genuinely — you're allowed to feel this. just maybe also drink some water.",
  "real talk though: you're doing better than this entry makes it sound.",
  "jokes aside, that sounds like a lot to carry. be a little gentle with yourself today.",
];

const SCORE_TITLES = [
  { min: 0, title: "Casually Concerned" },
  { min: 4, title: "Certified Overthinker" },
  { min: 9, title: "Spiral Specialist" },
  { min: 15, title: "Unhinged Icon" },
  { min: 22, title: "Conspiracy Board Owner" },
];

function scoreTitle(score) {
  return [...SCORE_TITLES].reverse().find((t) => score >= t.min).title;
}

/* ------------------------------ small bits ------------------------------ */

function Doodle({ className, style, d, color }) {
  return (
    <svg
      className={className}
      style={{ position: "absolute", opacity: 0.16, pointerEvents: "none", ...style }}
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
    >
      <path d={d} stroke={color || COLORS.ink} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const DOODLE_PATHS = [
  "M5 30 Q 15 5, 30 30 T 55 30", // squiggle
  "M30 5 L35 22 L52 22 L38 33 L43 50 L30 39 L17 50 L22 33 L8 22 L25 22 Z", // star
  "M10 50 C 10 20, 50 20, 50 50", // arc
  "M8 8 L52 52 M52 8 L8 52", // x scribble
];

function DoodleField() {
  const positions = [
    { top: "6%", left: "4%", rot: -12 },
    { top: "18%", right: "6%", rot: 10 },
    { top: "42%", left: "1%", rot: 6 },
    { bottom: "10%", right: "3%", rot: -8 },
    { bottom: "22%", left: "8%", rot: 14 },
    { top: "70%", right: "12%", rot: -4 },
  ];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {positions.map((p, i) => (
        <Doodle
          key={i}
          d={DOODLE_PATHS[i % DOODLE_PATHS.length]}
          color={i % 2 ? COLORS.lavenderDeep : COLORS.hotpink}
          style={{ ...p, transform: `rotate(${p.rot}deg)` }}
        />
      ))}
    </div>
  );
}

function Sticker({ text, tone = "pink", show }) {
  if (!show) return null;
  const bg = tone === "flame" ? COLORS.flame : tone === "sunshine" ? COLORS.sunshine : COLORS.hotpink;
  const fg = tone === "sunshine" ? COLORS.ink : "#fff";
  return (
    <div
      className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-md animate-[pop_0.35s_ease-out]"
      style={{ backgroundColor: bg, color: fg, transform: "rotate(-4deg)", fontFamily: "'Baloo 2', sans-serif" }}
    >
      {text}
    </div>
  );
}

function SpiralMeter({ value, label, color }) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: COLORS.inkSoft }}>
          spiral meter
        </span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: color, color: "#fff" }}
        >
          {label}
        </span>
      </div>
      <div className="h-3 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#ffffff88" }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function SectionCard({ children, shape = "chat", className = "" }) {
  // varies the container shape per-feature so nothing feels like a repeated card kit
  const base = "relative p-5 sm:p-6";
  const shapes = {
    chat: "rounded-[28px] rounded-tl-md",
    phone: "rounded-[36px]",
    torn: "rounded-md",
    polaroid: "rounded-sm pb-10",
    sticky: "rounded-sm",
  };
  return (
    <div
      className={`${base} ${shapes[shape]} ${className}`}
      style={{ backgroundColor: COLORS.paper, boxShadow: "0 6px 0 #241C3314, 0 2px 18px #241C331a" }}
    >
      {children}
    </div>
  );
}

/* --------------------------------- tabs ---------------------------------- */

const TABS = [
  { id: "scenario", label: "Overthink It", icon: Sparkles },
  { id: "call", label: "Incoming Call", icon: Phone },
  { id: "screenshot", label: "Screenshot Spiral", icon: Camera },
  { id: "toxic", label: "Toxic Advice", icon: Ghost },
  { id: "savage", label: "Savage Replies", icon: Flame },
  { id: "journal", label: "Journal + Roast", icon: BookHeart },
  { id: "captions", label: "Story Captions", icon: MessageCircleHeart },
];

export default function OverthinkOMeter() {
  const [active, setActive] = useState("scenario");
  const [score, setScore] = useState(0);
  const [milestoneFlash, setMilestoneFlash] = useState(null);

  function bumpScore(n = 1) {
    setScore((prev) => {
      const next = prev + n;
      const before = scoreTitle(prev);
      const after = scoreTitle(next);
      if (after !== before) {
        setMilestoneFlash(after);
        setTimeout(() => setMilestoneFlash(null), 2200);
      }
      return next;
    });
  }

  return (
    <div
      className="min-h-screen w-full relative"
      style={{ backgroundColor: COLORS.cream, fontFamily: "'Nunito', sans-serif", color: COLORS.ink }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Caveat:wght@500;700&family=Nunito:wght@400;600;700;800&display=swap');
        @keyframes pop { 0% { transform: scale(0.5) rotate(-8deg); opacity:0; } 60% { transform: scale(1.08) rotate(-4deg); opacity:1;} 100% { transform: scale(1) rotate(-4deg);} }
        @keyframes floatIn { 0% { transform: translateY(8px); opacity:0;} 100% { transform: translateY(0); opacity:1;} }
        .floatIn { animation: floatIn 0.35s ease-out; }
      `}</style>

      <DoodleField />

      {/* milestone toast */}
      {milestoneFlash && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full font-bold shadow-lg animate-[pop_0.4s_ease-out]"
          style={{ backgroundColor: COLORS.sunshine, color: COLORS.ink, fontFamily: "'Baloo 2', sans-serif" }}
        >
          ✨ new title unlocked: {milestoneFlash} ✨
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row gap-5 px-4 py-6 pb-24 lg:pb-6">
        {/* nav (desktop sidebar) */}
        <nav className="hidden lg:flex flex-col gap-2 w-56 shrink-0">
          <Header score={score} />
          {TABS.map((t) => (
            <NavButton key={t.id} tab={t} active={active === t.id} onClick={() => setActive(t.id)} />
          ))}
        </nav>

        {/* header for mobile */}
        <div className="lg:hidden">
          <Header score={score} />
        </div>

        {/* main panel */}
        <main className="flex-1 min-w-0">
          {active === "scenario" && <ScenarioPanel onScore={bumpScore} />}
          {active === "call" && <CallPanel onScore={bumpScore} />}
          {active === "screenshot" && <ScreenshotPanel onScore={bumpScore} />}
          {active === "toxic" && <ToxicPanel onScore={bumpScore} />}
          {active === "savage" && <SavagePanel onScore={bumpScore} />}
          {active === "journal" && <JournalPanel onScore={bumpScore} />}
          {active === "captions" && <CaptionsPanel onScore={bumpScore} />}
        </main>
      </div>

      {/* nav (mobile bottom bar) */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center py-2 px-1"
        style={{ backgroundColor: COLORS.paper, borderTop: `2px solid ${COLORS.lavender}` }}
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="flex flex-col items-center justify-center px-1.5 py-1 rounded-xl"
              style={{ color: isActive ? COLORS.hotpink : COLORS.inkSoft }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Header({ score }) {
  return (
    <div className="mb-4 lg:mb-6">
      <h1
        className="text-2xl sm:text-3xl leading-tight"
        style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: COLORS.ink }}
      >
        Overthink-o-Meter
      </h1>
      <p className="text-sm mt-1" style={{ color: COLORS.inkSoft }}>
        it was probably nothing. let's find out together.
      </p>
      <div
        className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-sm font-bold"
        style={{ backgroundColor: COLORS.lavender, color: COLORS.ink }}
      >
        <Skull size={15} /> {scoreTitle(score)} · {score} pts
      </div>
    </div>
  );
}

function NavButton({ tab, active, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all"
      style={{
        backgroundColor: active ? COLORS.hotpink : "transparent",
        color: active ? "#fff" : COLORS.inkSoft,
        fontFamily: "'Baloo 2', sans-serif",
      }}
    >
      <Icon size={17} />
      {tab.label}
    </button>
  );
}

/* ------------------------------- panels ---------------------------------- */

function PanelHeading({ children, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl sm:text-2xl" style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700 }}>
        {children}
      </h2>
      {sub && <p className="text-sm mt-0.5" style={{ color: COLORS.inkSoft }}>{sub}</p>}
    </div>
  );
}

// Maps tier index to the tier key used in groq.js prompts
const TIER_KEYS = ["mild", "main", "unhinged", "conspiracy"];

function ScenarioPanel({ onScore }) {
  const [input, setInput] = useState("");
  const [tierIdx, setTierIdx] = useState(-1);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const hasApiKey = Boolean(import.meta.env.VITE_GROQ_API_KEY && import.meta.env.VITE_GROQ_API_KEY !== "your_groq_api_key_here");

  async function overthink() {
    if (!input.trim() || loading) return;
    const nextTier = Math.min(tierIdx + 1, SCENARIO_TIERS.length - 1);
    const tier = SCENARIO_TIERS[nextTier];
    setTierIdx(nextTier);
    setAiError(null);

    if (hasApiKey) {
      setLoading(true);
      try {
        const aiLines = await generateOverthinkLines(input.trim(), TIER_KEYS[nextTier]);
        setLines((prev) => [...prev, ...aiLines]);
      } catch (err) {
        console.error("Groq API error:", err);
        setAiError("AI is spiraling too hard to respond. falling back to templates.");
        // Fallback to template bank
        setLines((prev) => [...prev, ...tier.lines(input.trim())]);
      } finally {
        setLoading(false);
      }
    } else {
      // No API key — use templates
      setLines((prev) => [...prev, ...tier.lines(input.trim())]);
    }
    onScore(2);
  }

  function reset() {
    setTierIdx(-1);
    setLines([]);
    setInput("");
    setAiError(null);
  }

  const tier = tierIdx >= 0 ? SCENARIO_TIERS[tierIdx] : null;
  const meterValue = tierIdx >= 0 ? ((tierIdx + 1) / SCENARIO_TIERS.length) * 100 : 6;

  return (
    <SectionCard shape="chat" className="floatIn">
      <PanelHeading sub="describe a totally normal situation. we will make it worse, together.">
        🌀 Overthink It
      </PanelHeading>

      {/* AI badge */}
      {hasApiKey && (
        <div className="flex items-center gap-1.5 mb-3">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: COLORS.mintDeep + "22", color: COLORS.mintDeep, border: `1px solid ${COLORS.mintDeep}55` }}
          >
            ✦ powered by groq AI
          </span>
        </div>
      )}

      <SpiralMeter
        value={meterValue}
        label={tier ? tier.label : "resting state"}
        color={tier ? tier.color : COLORS.mintDeep}
      />

      <div className="mt-5 space-y-3 max-h-72 overflow-y-auto pr-1">
        {lines.map((l, i) => (
          <div
            key={i}
            className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm floatIn"
            style={{ backgroundColor: COLORS.lavender, color: COLORS.ink }}
          >
            {l}
          </div>
        ))}

        {/* Loading state */}
        {loading && (
          <div
            className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm floatIn flex items-center gap-2"
            style={{ backgroundColor: COLORS.lavender, color: COLORS.inkSoft }}
          >
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            the AI is spiraling on your behalf...
          </div>
        )}

        {/* Error notice */}
        {aiError && (
          <p className="text-xs italic px-1" style={{ color: COLORS.flame }}>
            ⚠ {aiError}
          </p>
        )}

        {lines.length === 0 && !loading && (
          <p className="text-sm italic" style={{ color: COLORS.inkSoft }}>
            waiting for you to give me something to work with...
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && overthink()}
          placeholder="e.g. they took 3 hours to text back"
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none border-2"
          style={{ borderColor: COLORS.lavender, backgroundColor: loading ? "#f5f5f5" : "#fff", opacity: loading ? 0.7 : 1 }}
        />
        <div className="flex gap-2">
          <button
            onClick={overthink}
            disabled={loading}
            className="px-4 py-2.5 rounded-full text-sm font-bold flex items-center gap-1.5 shrink-0"
            style={{
              backgroundColor: loading ? COLORS.inkSoft : COLORS.hotpink,
              color: "#fff",
              fontFamily: "'Baloo 2', sans-serif",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {loading ? "thinking..." : "spiral more"}
          </button>
          {lines.length > 0 && !loading && (
            <button onClick={reset} className="px-3 py-2.5 rounded-full" style={{ color: COLORS.inkSoft }}>
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {tierIdx === SCENARIO_TIERS.length - 1 && (
        <div className="mt-4">
          <Sticker text="CONSPIRACY BOARD UNLOCKED 🧵" tone="flame" show />
        </div>
      )}
    </SectionCard>
  );
}

function CallPanel({ onScore }) {
  const [caller, setCaller] = useState("");
  const [answered, setAnswered] = useState(false);
  const [tier, setTier] = useState(null);
  const [reasons, setReasons] = useState([]);

  function answer() {
    if (!caller.trim()) return;
    const t = CALL_TIERS[Math.floor(Math.random() * CALL_TIERS.length)];
    setTier(t);
    setReasons([...t.reasons].sort(() => 0.5 - Math.random()).slice(0, 3));
    setAnswered(true);
    onScore(2);
  }

  function hangUp() {
    setAnswered(false);
    setCaller("");
    setTier(null);
  }

  return (
    <SectionCard shape="phone" className="floatIn max-w-md mx-auto lg:mx-0 text-center">
      <PanelHeading sub="who's calling, and more importantly — why.">📞 Incoming Call</PanelHeading>

      {!answered ? (
        <div className="py-6">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 animate-pulse"
            style={{ backgroundColor: COLORS.lavender }}
          >
            <Phone size={30} style={{ color: COLORS.ink }} />
          </div>
          <input
            value={caller}
            onChange={(e) => setCaller(e.target.value)}
            placeholder="who's calling..."
            className="w-full text-center px-4 py-2.5 rounded-full text-sm outline-none border-2 mb-4"
            style={{ borderColor: COLORS.lavender }}
          />
          <button
            onClick={answer}
            className="px-6 py-3 rounded-full font-bold text-sm"
            style={{ backgroundColor: COLORS.mintDeep, color: "#fff", fontFamily: "'Baloo 2', sans-serif" }}
          >
            answer (bravely)
          </button>
        </div>
      ) : (
        <div className="py-2 text-left">
          <p className="text-sm mb-3" style={{ color: COLORS.inkSoft }}>
            <b>{caller}</b> is calling. heart rate: rising. here's what this could mean —
          </p>
          <SpiralMeter value={tier.severity * 25} label={tier.label} color={tier.color} />
          <div className="mt-4 space-y-2.5">
            {reasons.map((r, i) => (
              <div key={i} className="px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: COLORS.lavender }}>
                {r}
              </div>
            ))}
          </div>
          <button
            onClick={hangUp}
            className="mt-5 px-5 py-2.5 rounded-full text-sm font-bold"
            style={{ backgroundColor: COLORS.flame, color: "#fff", fontFamily: "'Baloo 2', sans-serif" }}
          >
            decline and text instead
          </button>
        </div>
      )}
    </SectionCard>
  );
}

function ScreenshotPanel({ onScore }) {
  const [fileName, setFileName] = useState(null);
  const [report, setReport] = useState(null);
  const inputRef = useRef();

  const REPORT_BANK = [
    { phrase: "the period at the end of the message", verdict: "cold. calculated. deeply personal attack." },
    { phrase: "the delayed 'lol'", verdict: "delivered 40 minutes late — clearly reluctant, possibly under duress." },
    { phrase: "no emoji where an emoji usually goes", verdict: "this is the emoji equivalent of silence. deafening." },
    { phrase: "the word 'fine'", verdict: "never means fine. hasn't meant fine since the year 2009." },
    { phrase: "read at 2:14pm, replied at 6:48pm", verdict: "a four hour and thirty-four minute gap is not a coincidence." },
  ];

  function analyze(name) {
    setFileName(name);
    const picks = [...REPORT_BANK].sort(() => 0.5 - Math.random()).slice(0, 3);
    setReport(picks);
    onScore(3);
  }

  return (
    <SectionCard shape="torn" className="floatIn">
      <PanelHeading sub="upload the screenshot. we'll build the case file. (demo mode — vibes-based analysis, not real OCR)">
        📸 Screenshot Spiral Analyzer
      </PanelHeading>

      <div
        onClick={() => inputRef.current.click()}
        className="border-2 border-dashed rounded-2xl py-8 text-center cursor-pointer"
        style={{ borderColor: COLORS.lavenderDeep, backgroundColor: "#fff" }}
      >
        <Upload className="mx-auto mb-2" size={26} style={{ color: COLORS.inkSoft }} />
        <p className="text-sm" style={{ color: COLORS.inkSoft }}>
          {fileName ? `analyzing: ${fileName}` : "click to upload a chat screenshot"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files[0] && analyze(e.target.files[0].name)}
        />
      </div>

      {report && (
        <div className="mt-5">
          <div className="mb-2">
            <Sticker text="🚩 RED FLAG REPORT" tone="flame" show />
          </div>
          <div className="space-y-2.5">
            {report.map((r, i) => (
              <div key={i} className="p-3.5 rounded-xl" style={{ backgroundColor: COLORS.lavender }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: COLORS.inkSoft }}>
                  exhibit {i + 1}: {r.phrase}
                </p>
                <p className="text-sm mt-1">{r.verdict}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function ToxicPanel({ onScore }) {
  const [personaId, setPersonaId] = useState(TOXIC_PERSONAS[0].id);
  const [situation, setSituation] = useState("");
  const [reply, setReply] = useState(null);

  const persona = TOXIC_PERSONAS.find((p) => p.id === personaId);

  function ask() {
    if (!situation.trim()) return;
    const lines = persona.style(situation.trim());
    setReply(lines[Math.floor(Math.random() * lines.length)]);
    onScore(2);
  }

  return (
    <SectionCard shape="sticky" className="floatIn">
      <PanelHeading sub="pick your chaos consultant. describe the situation. regret it immediately.">
        😈 Toxic Advice Mode
      </PanelHeading>

      <div className="flex flex-wrap gap-2 mb-4">
        {TOXIC_PERSONAS.map((p) => (
          <button
            key={p.id}
            onClick={() => { setPersonaId(p.id); setReply(null); }}
            className="px-3.5 py-2 rounded-2xl text-sm font-bold flex items-center gap-1.5"
            style={{
              backgroundColor: personaId === p.id ? COLORS.hotpink : COLORS.lavender,
              color: personaId === p.id ? "#fff" : COLORS.ink,
              fontFamily: "'Baloo 2', sans-serif",
            }}
          >
            <span>{p.emoji}</span> {p.name}
          </button>
        ))}
      </div>

      <textarea
        value={situation}
        onChange={(e) => setSituation(e.target.value)}
        placeholder="what's going on..."
        rows={2}
        className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none border-2 resize-none"
        style={{ borderColor: COLORS.lavender }}
      />
      <button
        onClick={ask}
        className="mt-3 px-5 py-2.5 rounded-full text-sm font-bold"
        style={{ backgroundColor: COLORS.mintDeep, color: "#fff", fontFamily: "'Baloo 2', sans-serif" }}
      >
        ask {persona.name.toLowerCase()}
      </button>

      {reply && (
        <div
          className="mt-5 p-4 rounded-2xl rounded-tl-sm text-sm floatIn"
          style={{ backgroundColor: COLORS.lavender }}
        >
          <p className="text-xs font-bold mb-1" style={{ color: COLORS.inkSoft }}>
            {persona.emoji} {persona.name}
          </p>
          {reply}
        </div>
      )}
    </SectionCard>
  );
}

function SavagePanel({ onScore }) {
  const [msg, setMsg] = useState("");
  const [replies, setReplies] = useState([]);
  const [copiedIdx, setCopiedIdx] = useState(null);

  function generate() {
    if (!msg.trim()) return;
    const picks = [...SAVAGE_TEMPLATES].sort(() => 0.5 - Math.random()).slice(0, 4).map((f) => f(msg.trim()));
    setReplies(picks);
    onScore(2);
  }

  function copy(text, i) {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1200);
  }

  return (
    <SectionCard shape="chat" className="floatIn">
      <PanelHeading sub="paste what they sent. we'll write the comeback. sending it is on you.">
        🔥 Savage Reply Generator
      </PanelHeading>

      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="paste the message here..."
        rows={2}
        className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none border-2 resize-none"
        style={{ borderColor: COLORS.lavender }}
      />
      <button
        onClick={generate}
        className="mt-3 px-5 py-2.5 rounded-full text-sm font-bold"
        style={{ backgroundColor: COLORS.hotpink, color: "#fff", fontFamily: "'Baloo 2', sans-serif" }}
      >
        generate comebacks
      </button>

      <div className="mt-4 space-y-2.5">
        {replies.map((r, i) => (
          <div
            key={i}
            className="p-3.5 rounded-2xl flex items-start justify-between gap-3 floatIn"
            style={{ backgroundColor: COLORS.lavender }}
          >
            <p className="text-sm">{r}</p>
            <button onClick={() => copy(r, i)} className="shrink-0" style={{ color: COLORS.inkSoft }}>
              {copiedIdx === i ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        ))}
      </div>

      {replies.length > 0 && (
        <p className="text-xs italic mt-3" style={{ color: COLORS.inkSoft }}>
          send it / don't send it, you'll regret it — no judgment either way 🖤
        </p>
      )}
    </SectionCard>
  );
}

function JournalPanel({ onScore }) {
  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState([]);

  function submit() {
    if (!entry.trim()) return;
    const roast = JOURNAL_ROASTS[Math.floor(Math.random() * JOURNAL_ROASTS.length)];
    const soft = JOURNAL_SOFT_LANDING[Math.floor(Math.random() * JOURNAL_SOFT_LANDING.length)];
    setEntries((prev) => [{ text: entry.trim(), roast, soft }, ...prev]);
    setEntry("");
    onScore(2);
  }

  return (
    <SectionCard shape="torn" className="floatIn">
      <PanelHeading sub="write it out. we'll roast it. then we'll be nice for one sentence.">
        📔 Journal + Roast
      </PanelHeading>

      <textarea
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        placeholder="dear diary..."
        rows={4}
        className="w-full px-4 py-3 rounded-2xl text-sm outline-none border-2 resize-none"
        style={{ borderColor: COLORS.lavender, fontFamily: "'Caveat', cursive", fontSize: "1.15rem" }}
      />
      <button
        onClick={submit}
        className="mt-3 px-5 py-2.5 rounded-full text-sm font-bold"
        style={{ backgroundColor: COLORS.mintDeep, color: "#fff", fontFamily: "'Baloo 2', sans-serif" }}
      >
        submit for roasting
      </button>

      <div className="mt-5 space-y-4 max-h-96 overflow-y-auto pr-1">
        {entries.map((e, i) => (
          <div key={i} className="p-4 rounded-xl floatIn" style={{ backgroundColor: COLORS.lavender }}>
            <p className="text-sm mb-2" style={{ fontFamily: "'Caveat', cursive", fontSize: "1.15rem", color: COLORS.inkSoft }}>
              "{e.text}"
            </p>
            <p className="text-sm font-bold">{e.roast}</p>
            <p className="text-xs mt-2 italic" style={{ color: COLORS.inkSoft }}>{e.soft}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function CaptionsPanel({ onScore }) {
  const [moodId, setMoodId] = useState(CAPTION_MOODS[0].id);
  const [caption, setCaption] = useState(null);
  const mood = CAPTION_MOODS.find((m) => m.id === moodId);

  function generate() {
    const c = mood.captions[Math.floor(Math.random() * mood.captions.length)];
    setCaption(c);
    onScore(1);
  }

  return (
    <SectionCard shape="polaroid" className="floatIn max-w-md mx-auto lg:mx-0">
      <PanelHeading sub="pick a mood. get a caption ready to screenshot for your story.">
        🖤 Story Caption Generator
      </PanelHeading>

      <div className="flex flex-wrap gap-2 mb-4">
        {CAPTION_MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMoodId(m.id); setCaption(null); }}
            className="px-3.5 py-2 rounded-2xl text-sm font-bold"
            style={{
              backgroundColor: moodId === m.id ? COLORS.hotpink : COLORS.lavender,
              color: moodId === m.id ? "#fff" : COLORS.ink,
              fontFamily: "'Baloo 2', sans-serif",
            }}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      <button
        onClick={generate}
        className="px-5 py-2.5 rounded-full text-sm font-bold"
        style={{ backgroundColor: COLORS.mintDeep, color: "#fff", fontFamily: "'Baloo 2', sans-serif" }}
      >
        generate caption
      </button>

      {caption && (
        <div
          className="mt-5 p-6 rounded-xl text-center floatIn"
          style={{
            background: `linear-gradient(160deg, ${COLORS.lavender}, ${COLORS.hotpink}33)`,
            border: `2px solid ${COLORS.ink}11`,
          }}
        >
          <p className="text-2xl mb-2">{mood.emoji}</p>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: "1.6rem", lineHeight: 1.3 }}>{caption}</p>
        </div>
      )}
    </SectionCard>
  );
}
