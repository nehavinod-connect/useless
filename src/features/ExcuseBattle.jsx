import React, { useState } from "react";

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

const BATTLES = [
  {
    situation: "Why are you 2 hours late?",
    excuses: [
      { text: "My alarm clock and I are currently not on speaking terms.", rating: "QUESTIONABLE", feedback: "Relatable but structurally flawed." },
      { text: "A pigeon was blocking my destiny.", rating: "GENIUS", feedback: "Nobody questions pigeon-based fate." },
      { text: "I was emotionally preparing to leave.", rating: "ABSOLUTELY UNHINGED", feedback: "You can't use therapy talk for everything." },
      { text: "Mercury unfollowed me.", rating: "QUESTIONABLE", feedback: "Astrology isn't a valid legal defense yet." }
    ]
  },
  {
    situation: "Why didn't you reply to my message?",
    excuses: [
      { text: "I replied mentally. You just couldn't hear it.", rating: "ABSOLUTELY UNHINGED", feedback: "Telepathy is not a feature of iMessage." },
      { text: "My phone was heavy and I was tired.", rating: "QUESTIONABLE", feedback: "Gravity is a harsh mistress." },
      { text: "I saw it, spiraled, and then forgot.", rating: "GENIUS", feedback: "Honesty is the best policy." },
      { text: "I was being attacked by a mild inconvenience.", rating: "QUESTIONABLE", feedback: "Valid, but weak." }
    ]
  },
  {
    situation: "Why are you leaving the party so early?",
    excuses: [
      { text: "My social battery is flashing red.", rating: "GENIUS", feedback: "A classic." },
      { text: "My cat looked at me weird before I left.", rating: "QUESTIONABLE", feedback: "You don't even own a cat." },
      { text: "The vibes were misaligned with my chakras.", rating: "ABSOLUTELY UNHINGED", feedback: "Nobody knows what that means, which makes it perfect." },
      { text: "I have to go stare at a wall.", rating: "QUESTIONABLE", feedback: "Concerning, but okay." }
    ]
  },
  {
    situation: "Why didn't you do the assignment?",
    excuses: [
      { text: "My brain simply refused the terms and conditions.", rating: "GENIUS", feedback: "Can't argue with a declined EULA." },
      { text: "I was busy building a conspiracy board about someone's tweet.", rating: "ABSOLUTELY UNHINGED", feedback: "You need a hobby. A different one." },
      { text: "The vibes were wrong.", rating: "QUESTIONABLE", feedback: "You can't vibe-check homework." },
      { text: "I fell asleep while looking at it.", rating: "QUESTIONABLE", feedback: "It happens to the best of us." }
    ]
  }
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

export default function ExcuseBattle({ onScore }) {
  const [battleIdx, setBattleIdx] = useState(0);
  const [selectedExcuse, setSelectedExcuse] = useState(null);

  // Shuffle battles and excuses on mount
  const [battles, setBattles] = useState(() => {
    return [...BATTLES].sort(() => 0.5 - Math.random()).map(b => ({
      ...b,
      excuses: [...b.excuses].sort(() => 0.5 - Math.random())
    }));
  });

  const battle = battles[battleIdx];

  const handleSelect = (excuse) => {
    if (selectedExcuse) return;
    setSelectedExcuse(excuse);
    onScore(1);
  };

  const nextBattle = () => {
    setSelectedExcuse(null);
    setBattleIdx((prev) => (prev + 1) % battles.length);
  };

  const getRatingColor = (rating) => {
    if (rating === "GENIUS") return C.mint;
    if (rating === "QUESTIONABLE") return C.sun;
    return C.flame;
  };

  return (
    <Card style={{ animation: "phaseIn 0.35s ease" }}>
      <PanelHeading sub="Pick the perfect excuse. We will judge it.">
        🎭 Excuse Generator Battle
      </PanelHeading>

      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <p style={{ fontSize: 13, color: C.t3, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 8 }}>
          The Situation
        </p>
        <p style={{ fontSize: 20, color: C.t1, fontWeight: 600, fontStyle: "italic", margin: 0 }}>
          "{battle.situation}"
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {battle.excuses.map((excuse, i) => {
          const isSelected = selectedExcuse === excuse;
          const isFaded = selectedExcuse && !isSelected;

          return (
            <button
              key={i}
              onClick={() => handleSelect(excuse)}
              disabled={!!selectedExcuse}
              style={{
                textAlign: "left",
                padding: "16px 20px",
                borderRadius: 14,
                cursor: selectedExcuse ? "default" : "pointer",
                background: isSelected ? "rgba(255,255,255,0.12)" : C.s2,
                border: isSelected ? `1px solid rgba(255,255,255,0.3)` : `1px solid ${C.border}`,
                color: C.t1,
                fontSize: 15,
                fontWeight: isSelected ? 600 : 400,
                opacity: isFaded ? 0.4 : 1,
                transition: "all 0.2s",
                boxShadow: isSelected ? "0 4px 15px rgba(0,0,0,0.2)" : "none",
              }}
            >
              {excuse.text}
            </button>
          );
        })}
      </div>

      {selectedExcuse && (
        <div style={{ animation: "slideUp 0.3s ease", textAlign: "center", marginTop: 24 }}>
          <div style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: 99,
            background: `${getRatingColor(selectedExcuse.rating)}15`,
            border: `1px solid ${getRatingColor(selectedExcuse.rating)}40`,
            color: getRatingColor(selectedExcuse.rating),
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.05em",
            marginBottom: 12
          }}>
            VERDICT: {selectedExcuse.rating}
          </div>
          
          <p style={{ fontSize: 16, color: C.t2, marginBottom: 20 }}>
            {selectedExcuse.feedback}
          </p>

          <button
            onClick={nextBattle}
            style={{
              padding: "12px 24px",
              background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
              border: "none",
              borderRadius: 14,
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(139,109,255,0.3)"
            }}
          >
            Next Battle
          </button>
        </div>
      )}
    </Card>
  );
}
