import React, { useState, useRef } from "react";

const C = {
  bg: "#0D0B1A",
  s1: "rgba(255,255,255,0.04)",
  s2: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  t1: "#F0EDFF",
  t2: "rgba(240,237,255,0.65)",
  t3: "rgba(240,237,255,0.35)",
  flame: "#FF5045",
  mint: "#68D2A7",
  pink: "#FF4F9A",
  purple: "#8B6DFF",
  sun: "#FFD84D",
};

const OUTCOMES = [
  { label: "😭 They're ignoring you", color: C.pink, reaction: "We knew it. Let's spiral together." },
  { label: "📱 Wrong number", color: C.purple, reaction: "Plot twist: It was never about you." },
  { label: "🧠 You're overthinking", color: C.mint, reaction: "Touch grass immediately." },
  { label: "👀 They saw your story", color: C.sun, reaction: "They perceived you. Panic." },
  { label: "💀 You sent the wrong message", color: C.flame, reaction: "Time to throw the phone into the ocean." },
  { label: "🤨 They said 'okay'", color: C.t2, reaction: "The most violent word in the English language." },
  { label: "📞 Missed call", color: C.mint, reaction: "Check their pulse." },
  { label: "🫠 Touch Grass", color: C.pink, reaction: "Seriously. Go outside." },
  { label: "🚨 Emergency Overthinking", color: C.flame, reaction: "Sound the alarms!" },
  { label: "🌀 Create a conspiracy", color: C.purple, reaction: "Connect the dots. They exist." },
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
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: 0 }}>{children}</h2>
      {sub && <p style={{ fontSize: 13, color: C.t2, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function AnxietyWheel({ onScore }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);

  const segments = OUTCOMES.length;
  const anglePerSegment = 360 / segments;

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    // Random number of full spins + a random stop segment
    const spins = 5 + Math.floor(Math.random() * 5);
    const stopSegment = Math.floor(Math.random() * segments);

    // The exact angle to stop on (center of the segment)
    // The pointer is at the top (0 degrees).
    const extraAngle = (segments - stopSegment) * anglePerSegment - (anglePerSegment / 2);
    const newRotation = rotation + (spins * 360) + extraAngle;

    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      setResult(OUTCOMES[stopSegment]);
      onScore(2);
    }, 4000); // 4 seconds animation
  };

  return (
    <Card style={{ animation: "phaseIn 0.35s ease", textAlign: "center" }}>
      <PanelHeading sub="Let fate decide what you should panic about today.">
        🎡 Spin the Anxiety Wheel
      </PanelHeading>

      <div style={{ position: "relative", width: 280, height: 280, margin: "30px auto" }}>
        {/* Pointer */}
        <div style={{
          position: "absolute",
          top: -15,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "15px solid transparent",
          borderRight: "15px solid transparent",
          borderTop: `25px solid ${C.flame}`,
          zIndex: 10,
          filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.5))"
        }} />

        {/* Wheel */}
        <div style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          position: "relative",
          overflow: "hidden",
          transition: "transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)",
          transform: `rotate(${rotation}deg)`,
          border: `4px solid ${C.s2}`,
          boxShadow: `0 0 30px rgba(0,0,0,0.5)`
        }}>
          {OUTCOMES.map((outcome, i) => {
            const angle = i * anglePerSegment;
            const skewAngle = 90 - anglePerSegment;
            // A pure CSS pie slice approach using conic-gradient is cleaner
            return null;
          })}

          {/* Simple conic gradient for the wheel */}
          <div style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: `conic-gradient(
              ${OUTCOMES.map((o, i) => `${o.color} ${i * anglePerSegment}deg ${(i + 1) * anglePerSegment}deg`).join(", ")}
            )`,
            position: "absolute",
            top: 0, left: 0
          }} />

          {/* Labels on the wheel */}
          {OUTCOMES.map((outcome, i) => {
            const rotationAngle = (i * anglePerSegment) + (anglePerSegment / 2);
            return (
              <div key={i} style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) rotate(${rotationAngle}deg) translateY(-100px)`,
                color: "#fff",
                fontWeight: 800,
                fontSize: 12,
                textShadow: "0px 1px 4px rgba(0,0,0,0.8)",
                whiteSpace: "nowrap"
              }}>
                {outcome.label.split(" ")[0]} {/* Just show emoji on wheel to save space */}
              </div>
            );
          })}

          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: C.bg,
            border: `3px solid ${C.s2}`,
            zIndex: 5
          }} />
        </div>
      </div>

      <button
        onClick={spinWheel}
        disabled={spinning}
        style={{
          padding: "16px 40px",
          borderRadius: 99,
          background: spinning ? C.s2 : `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
          border: "none",
          color: spinning ? C.t3 : "#fff",
          fontSize: 18,
          fontWeight: 800,
          cursor: spinning ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          boxShadow: spinning ? "none" : `0 4px 20px rgba(255,79,154,0.4)`,
          letterSpacing: "0.1em"
        }}
      >
        {spinning ? "SPINNING..." : result ? "SPIN AGAIN" : "SPIN"}
      </button>

      {result && !spinning && (
        <div style={{ animation: "scaleIn 0.4s cubic-bezier(.4,0,.2,1)", marginTop: 30 }}>
          <div style={{
            display: "inline-block",
            padding: "8px 20px",
            borderRadius: 99,
            background: `${result.color}20`,
            border: `1px solid ${result.color}60`,
            color: result.color,
            fontWeight: 800,
            fontSize: 18,
            marginBottom: 12
          }}>
            {result.label}
          </div>
          <p style={{ fontSize: 16, color: C.t1, fontStyle: "italic", fontWeight: 600 }}>
            "{result.reaction}"
          </p>
        </div>
      )}
    </Card>
  );
}
