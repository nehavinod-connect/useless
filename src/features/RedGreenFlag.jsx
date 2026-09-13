import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  QUIZ_QUESTIONS,
  FLAG_THRESHOLDS,
  FLAG_ROASTS,
  FLAG_TRAITS,
  DELUSION_LEVELS,
} from "../data/redGreenFlagQuestions";
import { generateDelusionAnalysis } from "../groq";

/* ─────────────────────────────────────────────────────────────
   TINY SOUND UTILS  (Web Audio API, no deps)
   ───────────────────────────────────────────────────────────── */
function playTone(freq, dur, type = "sine", vol = 0.08) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
    setTimeout(() => ctx.close(), (dur + 0.1) * 1000);
  } catch (_) {}
}

const SFX = {
  click: () => playTone(660, 0.07, "sine", 0.07),
  celebrate: () => [440, 554, 659, 880].forEach((f, i) =>
    setTimeout(() => playTone(f, 0.18, "sine", 0.055), i * 80)),
  alarm: () => [500, 400, 500, 400].forEach((f, i) =>
    setTimeout(() => playTone(f, 0.1, "square", 0.04), i * 100)),
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────── */
function getThreshold(totalScore) {
  return (
    FLAG_THRESHOLDS.find((t) => totalScore <= t.max) ||
    FLAG_THRESHOLDS[FLAG_THRESHOLDS.length - 1]
  );
}

function getDelusionLevel(score) {
  return (
    DELUSION_LEVELS.find((d) => score <= d.max) ||
    DELUSION_LEVELS[DELUSION_LEVELS.length - 1]
  );
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─────────────────────────────────────────────────────────────
   CONFETTI  (pure CSS, 12 emoji tokens)
   ───────────────────────────────────────────────────────────── */
const CONFETTI_EMOJI = ["🌿", "🟢", "✨", "💚", "🍃", "⭐", "🌟", "💫"];

function Confetti({ type }) {
  if (type !== "green") return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200, overflow: "hidden" }}>
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "-10%",
            left: `${(i / 12) * 100}%`,
            fontSize: Math.random() * 10 + 14,
            animation: `confettiFall ${1.8 + Math.random() * 1.4}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.8}s`,
            opacity: 0,
          }}
        >
          {CONFETTI_EMOJI[i % CONFETTI_EMOJI.length]}
        </span>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PROGRESS BAR
   ───────────────────────────────────────────────────────────── */
function ProgressBar({ current, total, color }) {
  const pct = (current / total) * 100;
  return (
    <div style={{ position: "relative", height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: `${pct}%`,
          background: color || "linear-gradient(90deg,#8B6DFF,#FF4F9A)",
          borderRadius: 99,
          transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
          boxShadow: `0 0 8px ${color || "#8B6DFF"}60`,
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANIMATED COUNTER
   ───────────────────────────────────────────────────────────── */
function AnimCounter({ target, duration = 1600 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(ease * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return <>{val}</>;
}

/* ─────────────────────────────────────────────────────────────
   GLASS CARD
   ───────────────────────────────────────────────────────────── */
function GlassCard({ children, style, glowColor }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${glowColor ? glowColor + "40" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 20,
        padding: "24px",
        boxShadow: glowColor
          ? `0 8px 32px rgba(0,0,0,0.4), 0 0 24px ${glowColor}20`
          : "0 8px 32px rgba(0,0,0,0.3)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   RED FLAG QUIZ
   ───────────────────────────────────────────────────────────── */
function FlagQuiz({ onScore }) {
  const [phase, setPhase]     = useState("intro");   // intro | quiz | result
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]); // { qid, score }[]
  const [selected, setSelected] = useState(null);
  const [result, setResult]   = useState(null);
  const [roast, setRoast]     = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const scored = useRef(false);

  const totalScore = answers.reduce((s, a) => s + a.score, 0);
  const q = QUIZ_QUESTIONS[current];

  function handleAnswer(idx) {
    if (selected !== null) return;
    SFX.click();
    const score = q.answers[idx].score;
    setSelected(idx);
    setTimeout(() => {
      const newAnswers = [
        ...answers.filter((a) => a.qid !== q.id),
        { qid: q.id, score },
      ];
      setAnswers(newAnswers);

      if (current < QUIZ_QUESTIONS.length - 1) {
        setCurrent(current + 1);
        setSelected(null);
      } else {
        // Done — calculate result
        const finalScore = newAnswers.reduce((s, a) => s + a.score, 0);
        const threshold = getThreshold(finalScore);
        const roastMsg = randomFrom(FLAG_ROASTS[threshold.key]);
        setResult(threshold);
        setRoast(roastMsg);
        setRevealing(true);
        setTimeout(() => {
          setPhase("result");
          setRevealing(false);
          if (threshold.key === "green") { SFX.celebrate(); setShowConfetti(true); }
          if (threshold.key === "nuclear") SFX.alarm();

          // Award Overthink-o-Meter points once per quiz completion
          if (!scored.current) {
            scored.current = true;
            onScore?.(3);
          }
        }, 800);
      }
    }, 400);
  }

  function goBack() {
    if (current === 0) return;
    const prev = current - 1;
    setCurrent(prev);
    setAnswers(answers.filter((a) => a.qid !== QUIZ_QUESTIONS[prev].id));
    setSelected(null);
  }

  function reset() {
    setCurrent(0);
    setAnswers([]);
    setSelected(null);
    setResult(null);
    setRoast("");
    setShowConfetti(false);
    scored.current = false;
    setPhase("intro");
  }

  /* ── INTRO ── */
  if (phase === "intro") {
    return (
      <GlassCard>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🚩🌿</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#F0EDFF", marginBottom: 8 }}>
            RED FLAG OR GREEN FLAG?
          </h2>
          <p style={{ color: "rgba(240,237,255,0.5)", fontSize: 14, marginBottom: 28, fontStyle: "italic" }}>
            "An extremely scientific test that is absolutely not scientific."
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
            {["25 questions", "Secretly scored", "Brutally honest", "100% not your therapist"].map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 12,
                  color: "rgba(240,237,255,0.6)",
                  background: "rgba(139,109,255,0.12)",
                  border: "1px solid rgba(139,109,255,0.25)",
                  borderRadius: 99,
                  padding: "4px 12px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <button
            onClick={() => setPhase("quiz")}
            style={{
              background: "linear-gradient(135deg,#8B6DFF,#FF4F9A)",
              color: "#fff",
              border: "none",
              borderRadius: 99,
              padding: "14px 36px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(139,109,255,0.4)",
              transition: "transform 0.15s,box-shadow 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            Start the Quiz 🚩
          </button>
        </div>
      </GlassCard>
    );
  }

  /* ── QUIZ QUESTION ── */
  if (phase === "quiz") {
    const prevAnswerIdx = q
      ? answers.find((a) => a.qid === q.id)
      : null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {revealing && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(13,11,26,0.7)",
            backdropFilter: "blur(8px)", zIndex: 150,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 48, animation: "scaleIn 0.3s ease" }}>🧠</div>
          </div>
        )}

        {/* Header */}
        <GlassCard style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,237,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Question {current + 1} / {QUIZ_QUESTIONS.length}
            </span>
            <button
              onClick={reset}
              style={{
                fontSize: 11,
                color: "rgba(240,237,255,0.4)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 8px",
              }}
            >
              ✕ exit
            </button>
          </div>
          <ProgressBar current={current + 1} total={QUIZ_QUESTIONS.length} />
        </GlassCard>

        {/* Question */}
        <GlassCard>
          <p style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#F0EDFF",
            lineHeight: 1.45,
            marginBottom: 20,
          }}>
            {q.question}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.answers.map((ans, idx) => {
              const isSelected = selected === idx;
              const wasAnswered = prevAnswerIdx?.score === ans.score;
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  style={{
                    background: isSelected
                      ? "linear-gradient(135deg,rgba(139,109,255,0.3),rgba(255,79,154,0.2))"
                      : "rgba(255,255,255,0.04)",
                    border: isSelected
                      ? "1px solid rgba(139,109,255,0.7)"
                      : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    padding: "14px 18px",
                    textAlign: "left",
                    color: isSelected ? "#F0EDFF" : "rgba(240,237,255,0.75)",
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 400,
                    cursor: selected !== null ? "default" : "pointer",
                    transition: "all 0.15s",
                    transform: isSelected ? "scale(1.01)" : "scale(1)",
                    boxShadow: isSelected ? "0 0 16px rgba(139,109,255,0.25)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (selected !== null) return;
                    e.currentTarget.style.background = "rgba(139,109,255,0.12)";
                    e.currentTarget.style.borderColor = "rgba(139,109,255,0.35)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    if (selected === idx) return;
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <span style={{ marginRight: 10, opacity: 0.5 }}>
                    {["A", "B", "C", "D"][idx]}.
                  </span>
                  {ans.text}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Back button */}
        {current > 0 && (
          <button
            onClick={goBack}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 99,
              padding: "8px 20px",
              color: "rgba(240,237,255,0.5)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ← previous question
          </button>
        )}
      </div>
    );
  }

  /* ── RESULT ── */
  const resultColor = result?.color || "#8B6DFF";
  const resultGlow  = result?.glow  || "rgba(139,109,255,0.4)";
  const traits = FLAG_TRAITS[result?.key] || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {showConfetti && <Confetti type="green" />}

      {/* Result badge */}
      <GlassCard
        glowColor={resultColor}
        style={{
          textAlign: "center",
          animation: "scaleIn 0.5s cubic-bezier(.4,0,.2,1)",
          boxShadow: `0 0 60px ${resultGlow}, 0 8px 32px rgba(0,0,0,0.4)`,
        }}
      >
        <div style={{
          fontSize: 52,
          marginBottom: 8,
          animation: result?.key === "nuclear" ? "nuclearPulse 1.5s ease-in-out infinite" : "none",
        }}>
          {result?.key === "green" ? "🌿" :
           result?.key === "yellow" ? "🟡" :
           result?.key === "red" ? "🚩" : "☠"}
        </div>

        {result?.key === "nuclear" && (
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            color: resultColor,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 6,
            animation: "blink 0.8s linear infinite",
          }}>
            THIS IS NOT A DRILL
          </div>
        )}

        <h2 style={{
          fontSize: 28,
          fontWeight: 900,
          color: resultColor,
          marginBottom: 12,
          textShadow: `0 0 30px ${resultGlow}`,
        }}>
          {result?.label}
        </h2>

        <div style={{
          fontStyle: "italic",
          color: "rgba(240,237,255,0.65)",
          fontSize: 14,
          marginBottom: 20,
          lineHeight: 1.5,
        }}>
          "{roast}"
        </div>

        {/* Traits */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 20 }}>
          {traits.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 12,
                padding: "5px 14px",
                borderRadius: 99,
                background: `${resultColor}18`,
                border: `1px solid ${resultColor}40`,
                color: resultColor,
                fontWeight: 600,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Score bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(240,237,255,0.4)", marginBottom: 6 }}>
            <span>🌿 Green</span>
            <span>Your score</span>
            <span>☠ Nuclear</span>
          </div>
          <ProgressBar current={totalScore} total={30} color={resultColor} />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 99,
              padding: "12px 24px",
              color: "rgba(240,237,255,0.8)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          >
            🔄 Take it again
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DELUSION METER
   ───────────────────────────────────────────────────────────── */
const LOADING_MSGS = [
  "Consulting professional overthinkers... 🧠",
  "Creating unnecessary drama... 🚩",
  "Reading between lines that don't exist... 👀",
  "Summoning your toxic inner voice... 👻",
  "Investigating a situation that probably isn't a situation... 🔎",
  "Calling the Delulu Department... ☎️",
  "Building a conspiracy board... 🧵",
];

function DelusionMeter({ onScore }) {
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [msgIdx, setMsgIdx]     = useState(0);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(false);
  const [visibleCases, setVisibleCases] = useState(0);
  const scored = useRef(false);
  const intervalRef = useRef(null);

  // Rotate loading message
  useEffect(() => {
    if (loading) {
      intervalRef.current = setInterval(() => {
        setMsgIdx((i) => (i + 1) % LOADING_MSGS.length);
      }, 1800);
    }
    return () => clearInterval(intervalRef.current);
  }, [loading]);

  // Stagger worst-case scenarios after result appears
  useEffect(() => {
    if (!result) return;
    setVisibleCases(0);
    const timers = result.worstCases.map((_, i) =>
      setTimeout(() => setVisibleCases(i + 1), 400 + i * 300)
    );
    return () => timers.forEach(clearTimeout);
  }, [result]);

  async function measure() {
    if (!input.trim()) return;
    setLoading(true);
    setError(false);
    setResult(null);
    setMsgIdx(0);
    try {
      const res = await generateDelusionAnalysis(input.trim());
      setResult(res);
      if (!scored.current) { scored.current = true; onScore?.(3); }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function retry() { setError(false); measure(); }

  function reset() {
    setInput("");
    setResult(null);
    setError(false);
    scored.current = false;
  }

  const delusionLevel = result ? getDelusionLevel(result.score) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Input card */}
      <GlassCard>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🧠</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#F0EDFF", marginBottom: 4 }}>
            DELUSION METER
          </h2>
          <p style={{ color: "rgba(240,237,255,0.45)", fontSize: 13 }}>
            Tell us what happened. We'll make it unnecessarily complicated.
          </p>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="My crush liked my Instagram story..."
          disabled={loading}
          rows={4}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: "14px 16px",
            color: "#F0EDFF",
            fontSize: 15,
            resize: "vertical",
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(139,109,255,0.5)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
        />

        <button
          onClick={measure}
          disabled={loading || !input.trim()}
          style={{
            marginTop: 12,
            background: loading || !input.trim()
              ? "rgba(139,109,255,0.2)"
              : "linear-gradient(135deg,#8B6DFF,#FF4F9A)",
            border: "none",
            borderRadius: 99,
            padding: "13px 28px",
            color: loading || !input.trim() ? "rgba(240,237,255,0.4)" : "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            if (!loading && input.trim()) e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {loading ? "Measuring..." : "Measure My Delusion 🧠"}
        </button>

        {/* Loading message */}
        {loading && (
          <div style={{
            marginTop: 12,
            textAlign: "center",
            color: "rgba(240,237,255,0.5)",
            fontSize: 13,
            fontStyle: "italic",
            animation: "fadeIn 0.4s ease",
          }}>
            {LOADING_MSGS[msgIdx]}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            marginTop: 12,
            background: "rgba(255,80,69,0.1)",
            border: "1px solid rgba(255,80,69,0.25)",
            borderRadius: 12,
            padding: "14px",
            textAlign: "center",
          }}>
            <p style={{ color: "#FF5045", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              The Delulu Department is currently unavailable. 😵
            </p>
            <button
              onClick={retry}
              style={{
                background: "rgba(255,80,69,0.15)",
                border: "1px solid rgba(255,80,69,0.3)",
                borderRadius: 99,
                padding: "6px 18px",
                color: "#FF5045",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        )}
      </GlassCard>

      {/* Results */}
      {result && (
        <>
          {/* Score card */}
          <GlassCard glowColor={delusionLevel?.color} style={{ textAlign: "center", animation: "slideUp 0.4s ease" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(240,237,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              🧠 Delusion Score
            </div>
            <div style={{
              fontSize: 72,
              fontWeight: 900,
              color: delusionLevel?.color || "#8B6DFF",
              lineHeight: 1,
              textShadow: `0 0 40px ${delusionLevel?.color}60`,
              marginBottom: 4,
            }}>
              <AnimCounter target={result.score} />%
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: delusionLevel?.color,
              marginBottom: 16,
            }}>
              {result.level}
            </div>
            <div style={{ position: "relative", height: 8, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{
                position: "absolute",
                inset: "0 auto 0 0",
                width: `${result.score}%`,
                background: `linear-gradient(90deg, #68D2A7, ${delusionLevel?.color})`,
                borderRadius: 99,
                transition: "width 1.6s cubic-bezier(.4,0,.2,1)",
                boxShadow: `0 0 12px ${delusionLevel?.color}70`,
              }} />
            </div>
            {result.isFallback && (
              <p style={{ fontSize: 11, color: "rgba(240,237,255,0.25)", marginTop: 10, fontStyle: "italic" }}>
                (AI offline — using local analysis)
              </p>
            )}
          </GlassCard>

          {/* Analysis card */}
          <GlassCard style={{ animation: "slideUp 0.45s ease" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(240,237,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              🧠 AI Analysis
            </div>
            <p style={{ color: "rgba(240,237,255,0.8)", fontSize: 15, lineHeight: 1.65 }}>
              {result.analysis}
            </p>
          </GlassCard>

          {/* Worst cases */}
          <GlassCard style={{ animation: "slideUp 0.5s ease" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,80,69,0.8)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              ☠ Worst Case Scenarios
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.worstCases.map((wc, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    opacity: i < visibleCases ? 1 : 0,
                    transform: i < visibleCases ? "translateX(0)" : "translateX(-12px)",
                    transition: "all 0.35s ease",
                  }}
                >
                  <span style={{ color: "#FF5045", fontSize: 13, flexShrink: 0, paddingTop: 1 }}>•</span>
                  <span style={{ color: "rgba(240,237,255,0.7)", fontSize: 14, lineHeight: 1.5 }}>{wc}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Reality Check */}
          <GlassCard
            style={{
              animation: "slideUp 0.55s ease",
              background: "rgba(104,210,167,0.06)",
              border: "1px solid rgba(104,210,167,0.2)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#68D2A7", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              🧠 Reality Check
            </div>
            <p style={{ color: "rgba(240,237,255,0.7)", fontSize: 14, lineHeight: 1.6 }}>
              There is also a very high chance you're simply overthinking.{" "}
              <span style={{ color: "#68D2A7", fontWeight: 600 }}>Just saying.</span>
            </p>
          </GlassCard>

          <button
            onClick={reset}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 99,
              padding: "12px 24px",
              color: "rgba(240,237,255,0.6)",
              fontSize: 14,
              cursor: "pointer",
              alignSelf: "center",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            🔄 Measure another situation
          </button>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMBINED: RED GREEN FLAG FEATURE
   ───────────────────────────────────────────────────────────── */
export default function RedGreenFlag({ onScore }) {
  const [mode, setMode] = useState("quiz");

  return (
    <div>
      {/* CSS for this component's animations */}
      <style>{`
        @keyframes confettiFall {
          0%   { opacity:0; transform: translateY(0) rotate(0deg); }
          10%  { opacity:1; }
          90%  { opacity:1; }
          100% { opacity:0; transform: translateY(110vh) rotate(720deg); }
        }
        @keyframes nuclearPulse {
          0%,100% { text-shadow: 0 0 20px #C44BFF80; }
          50%      { text-shadow: 0 0 60px #C44BFF, 0 0 100px #FF5045; }
        }
        @keyframes blink {
          0%,100% { opacity:1; }
          50%     { opacity:0.3; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.85); opacity:0; }
          to   { transform: scale(1);   opacity:1; }
        }
        @keyframes slideUp {
          from { transform: translateY(16px); opacity:0; }
          to   { transform: translateY(0);    opacity:1; }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
      `}</style>

      {/* Mode switcher */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 20,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 6,
      }}>
        {[
          { id: "quiz", label: "🚩 Flag Quiz" },
          { id: "delusion", label: "🧠 Delusion Meter" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 10,
              background:
                mode === m.id
                  ? "linear-gradient(135deg,rgba(139,109,255,0.4),rgba(255,79,154,0.25))"
                  : "transparent",
              color: mode === m.id ? "#F0EDFF" : "rgba(240,237,255,0.45)",
              fontSize: 14,
              fontWeight: mode === m.id ? 700 : 400,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: mode === m.id ? "0 0 12px rgba(139,109,255,0.2)" : "none",
              border: mode === m.id ? "1px solid rgba(139,109,255,0.3)" : "1px solid transparent",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "quiz"    && <FlagQuiz     onScore={onScore} />}
      {mode === "delusion" && <DelusionMeter onScore={onScore} />}
    </div>
  );
}
