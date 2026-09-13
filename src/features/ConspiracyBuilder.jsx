import React, { useState } from "react";
import { generateConspiracyTheory } from "../groq";

const C = {
  bg:      "#0D0B1A",
  s1:      "rgba(255,255,255,0.04)",
  s2:      "rgba(255,255,255,0.07)",
  border:  "rgba(255,255,255,0.08)",
  t1:      "#F0EDFF",
  t2:      "rgba(240,237,255,0.65)",
  t3:      "rgba(240,237,255,0.35)",
  flame:   "#FF5045",
  mint:    "#68D2A7",
  pink:    "#FF4F9A",
  purple:  "#8B6DFF",
  sun:     "#FFD84D",
};

const CLUES_BANK = [
  "👀 They were online 10 mins ago",
  "☕ They bought an iced coffee",
  "🐦 A crow flew past my window",
  "📱 Their profile picture changed",
  "🌧️ It started raining randomly",
  "🕐 They replied at 11:11",
  "💀 They used a period",
  "🌙 Mercury is in retrograde",
  "🏃 They started running",
  "🎵 A sad song played on Spotify",
  "🚗 A black SUV drove past",
  "👽 The wifi dropped for 3 seconds"
];

function Card({ children, style, glow }) {
  return (
    <div style={{
      background: C.s1,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${glow ? glow + "30" : C.border}`,
      borderRadius: 20,
      padding: "24px",
      boxShadow: glow ? `0 8px 40px rgba(0,0,0,0.4),0 0 30px ${glow}18` : `0 8px 32px rgba(0,0,0,0.35)`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function PanelHeading({ children, sub }) {
  return (
    <div style={{ marginBottom:20 }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.t1, margin:0 }}>{children}</h2>
      {sub && <p style={{ fontSize:13, color:C.t2, marginTop:4 }}>{sub}</p>}
    </div>
  );
}

function PrimaryBtn({ onClick, children, style, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? C.s2 : `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
        border: "none",
        borderRadius: 14,
        padding: "14px 24px",
        color: disabled ? C.t3 : "#fff",
        fontSize: 15,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        boxShadow: disabled ? "none" : `0 4px 15px rgba(139,109,255,0.3)`,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const inputStyle = {
  background:"rgba(255,255,255,0.06)",
  border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:14,
  padding:"12px 16px",
  color:C.t1,
  fontSize:14,
  fontFamily:"inherit",
  outline:"none",
  width:"100%",
  boxSizing:"border-box",
  transition:"border 0.2s",
};

export default function ConspiracyBuilder({ onScore }) {
  const [event, setEvent] = useState("");
  const [selectedClues, setSelectedClues] = useState([]);
  const [theory, setTheory] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleClue = (clue) => {
    if (selectedClues.includes(clue)) {
      setSelectedClues(selectedClues.filter(c => c !== clue));
    } else {
      if (selectedClues.length < 5) {
        setSelectedClues([...selectedClues, clue]);
      }
    }
  };

  const buildTheory = async () => {
    if (!event.trim() || selectedClues.length < 3) return;
    setLoading(true);
    setTheory(null);
    try {
      const result = await generateConspiracyTheory(event, selectedClues);
      setTheory(result);
      onScore(3);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setEvent("");
    setSelectedClues([]);
    setTheory(null);
  };

  return (
    <Card style={{ animation: "phaseIn 0.35s ease" }}>
      <PanelHeading sub="Connect the dots. Uncover the truth. Or just spiral completely.">
        🕵️ Conspiracy Builder
      </PanelHeading>

      {!theory && (
        <div style={{ animation: "fadeIn 0.3s" }}>
          <label style={{ fontSize: 13, color: C.t2, fontWeight: 700, display: "block", marginBottom: 8 }}>
            1. WHAT HAPPENED?
          </label>
          <input
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            placeholder="e.g. They didn't reply for 3 hours..."
            style={{ ...inputStyle, marginBottom: 20 }}
            onFocus={(e) => e.target.style.borderColor = "rgba(139,109,255,0.5)"}
            onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          />

          <label style={{ fontSize: 13, color: C.t2, fontWeight: 700, display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span>2. SELECT CLUES</span>
            <span style={{ color: selectedClues.length >= 3 ? C.mint : C.flame }}>
              {selectedClues.length}/5 (min 3)
            </span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {CLUES_BANK.map((clue, i) => {
              const selected = selectedClues.includes(clue);
              return (
                <button
                  key={i}
                  onClick={() => toggleClue(clue)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontSize: 13,
                    background: selected ? "linear-gradient(135deg, rgba(255,80,69,0.3), rgba(139,109,255,0.2))" : C.s2,
                    border: selected ? `1px solid ${C.flame}60` : `1px solid ${C.border}`,
                    color: selected ? C.t1 : C.t2,
                    fontWeight: selected ? 700 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {clue}
                </button>
              );
            })}
          </div>

          <PrimaryBtn
            onClick={buildTheory}
            disabled={!event.trim() || selectedClues.length < 3 || loading}
            style={{ width: "100%", background: loading ? C.s2 : undefined }}
          >
            {loading ? "CONNECTING THREADS..." : "BUILD MY THEORY"}
          </PrimaryBtn>
        </div>
      )}

      {theory && (
        <div style={{ animation: "scaleIn 0.4s cubic-bezier(.4,0,.2,1)" }}>
          <div style={{
            background: "rgba(255,80,69,0.08)",
            border: `1px solid ${C.flame}40`,
            borderRadius: 16,
            padding: "24px",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Thread visuals */}
            <div style={{ position: "absolute", top: -10, right: -10, fontSize: 60, opacity: 0.1 }}>📌</div>
            <div style={{ position: "absolute", bottom: -10, left: -10, fontSize: 60, opacity: 0.1 }}>🧵</div>

            <h3 style={{ margin: "0 0 16px 0", color: C.flame, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🕵️</span> THEORY DISCOVERED
            </h3>

            <p style={{ fontSize: 16, color: C.t1, lineHeight: 1.6, marginBottom: 20, fontStyle: "italic" }}>
              "{theory}"
            </p>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 13,
              color: C.t2,
              background: "rgba(0,0,0,0.3)",
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${C.border}`
            }}>
              <div><strong style={{ color: C.t1 }}>Evidence:</strong> questionable.</div>
              <div><strong style={{ color: C.t1 }}>Logic:</strong> absolutely none.</div>
              <div><strong style={{ color: C.t1 }}>Confidence:</strong> 97%.</div>
            </div>
          </div>

          <button
            onClick={reset}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: 16,
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              color: C.t2,
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { e.target.style.background = C.s2; e.target.style.color = C.t1; }}
            onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = C.t2; }}
          >
            Build Another Theory
          </button>
        </div>
      )}
    </Card>
  );
}
