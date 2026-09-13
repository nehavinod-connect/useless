import React, { useState, useRef, useEffect, useCallback } from "react";
import { generateOverthinkLines } from "./groq";
import {
  Phone, Camera, MessageCircleHeart, BookHeart, Flame, Sparkles,
  Send, Upload, RotateCcw, Copy, Check, Skull, Ghost, Flag, Zap,
} from "lucide-react";
import RedGreenFlag from "./features/RedGreenFlag";
import ConspiracyBuilder from "./features/ConspiracyBuilder";
import ExcuseBattle from "./features/ExcuseBattle";
import AnxietyWheel from "./features/AnxietyWheel";
/* ═══════════════════════════════════════════════════════════════════════════
   OVERTHINK-O-METER  ·  Complete redesign — dark glassmorphism + chaos UI
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg:      "#0D0B1A",
  bg2:     "#120F24",
  s1:      "rgba(255,255,255,0.04)",
  s2:      "rgba(255,255,255,0.07)",
  border:  "rgba(255,255,255,0.08)",
  t1:      "#F0EDFF",
  t2:      "rgba(240,237,255,0.65)",
  t3:      "rgba(240,237,255,0.35)",
  purple:  "#8B6DFF",
  pink:    "#FF4F9A",
  mint:    "#68D2A7",
  sun:     "#FFD84D",
  flame:   "#FF5045",
};

// ── Data ────────────────────────────────────────────────────────────────────
const SCENARIO_TIERS = [
  { label: "mild spiral",     color: C.mint,   lines: (s) => [
    `Okay realistically? "${s}" probably means nothing. They're busy. People are busy sometimes. This is fine.`,
    `Statistically speaking, "${s}" has a boring explanation 90% of the time. You are in the 90%. Probably.`,
  ]},
  { label: "main character",  color: "#A78BFF", lines: (s) => [
    `But WHAT IF "${s}" is actually a sign? What if this is the universe telling you something?`,
    `Replay the last 3 conversations. Slowly. Word by word. Did the punctuation change? Because punctuation NEVER changes for no reason.`,
    `You should probably analyze their last 12 messages for tone shifts. This is basic due diligence.`,
  ]},
  { label: "unhinged tier",   color: C.pink,   lines: (s) => [
    `"${s}" is clearly the beginning of the end. You already know how this ends.`,
    `Time to write the group chat essay. Full timeline. Screenshots. Font size 14, footnotes optional but recommended.`,
    `Assume the worst, prepare a speech, and also maybe move to a different country. Just in case.`,
  ]},
  { label: "conspiracy",      color: C.flame,  lines: (s) => [
    `Connect the string to the corkboard. "${s}" is not isolated. This goes back to March.`,
    `Everyone is in on it. Your friends know. Their friends know. The barista definitely knows.`,
    `This has stopped being about "${s}" and started being about the fundamental nature of trust, fate, and whether Mercury is in retrograde (it is).`,
  ]},
];

const CALL_TIERS = [
  { severity:1, label:"mundane",          color:C.mint,  reasons:["asking if you're free this weekend","wants to know if you still have their charger","butt-dialed you, no actual reason","reminding you about something you already know about"] },
  { severity:2, label:"mildly suspicious",color:C.sun,   reasons:["calling instead of texting, which is already weird","wants to 'talk about something' — no further context given, rude","asking where you were last night in a tone"] },
  { severity:3, label:"code red",         color:C.pink,  reasons:["someone told them something and now they're calling YOU about it","'we need to talk' energy radiating through the screen","calling at an unusual hour, which means it's Serious"] },
  { severity:4, label:"prepare a will",   color:C.flame, reasons:["this is The Call. You've been expecting this call your whole life.","they found the group chat screenshots","it's about to be a whole thing and you don't even know what the thing is yet"] },
];

const TOXIC_PERSONAS = [
  { id:"mom",    name:"Disappointed Mom",     emoji:"🧿", style:(s)=>[`You're asking ME? After everything I've sacrificed? About "${s}"? I just think it's interesting.`,`Well when I was your age I would NEVER have let "${s}" happen, but you know, everyone does things differently now.`,`Fine. Do what you want. I'll just be over here. Worrying. Like always.`] },
  { id:"bestie", name:"Unhinged Bestie",      emoji:"💅", style:(s)=>[`Girl "${s}"?? Absolutely not. We are cutting them off TODAY. I already typed the text. Fire emoji or skull emoji.`,`Okay but did you consider posting a cryptic story about "${s}" and just letting them wonder?`,`I've never liked them. I said it once in 2019: "${s}" was always going to happen. I called it.`] },
  { id:"auntie", name:"Nosy Auntie",          emoji:"👀", style:(s)=>[`So "${s}" huh. Interesting. Does your mother know? I'm asking for the family group chat context.`,`Back in MY day "${s}" would've been solved with one (1) direct conversation, but you kids like to complicate things.`,`I'm not judging. I would just simply never. I'll bring this up at Thanksgiving lovingly.`] },
  { id:"ex",     name:"Situationship Ghost",  emoji:"👻", style:(s)=>[`interesting that you're dealing with "${s}" and thinking of ME right now. anyway. hope ur good. 🙂`,`wow "${s}"... crazy how things change. hope the new person treats you well. genuinely.`,`lol ok. anyway good luck with "${s}", I'm sure it'll work out this time 🙂 (seen 4:47pm)`] },
];

const SAVAGE_TEMPLATES = [
  (m)=>`"${m}"?? okay bestie I'm going to need you to gather your things and exit stage left`,
  (m)=>`respectfully... this ain't it. try again in 3-5 business days`,
  (m)=>`the audacity to say "${m}" and think it wasn't going in my notes app`,
  (m)=>`sir this is a Wendy's. anyway no.`,
  (m)=>`I read "${m}" and immediately aged four years`,
  (m)=>`bold of you to assume I'd respond to that with anything other than silence and a slow blink`,
  (m)=>`not you saying "${m}" like that was ever going to work 💀`,
  (m)=>`girl what. genuinely what. try that again but this time think first`,
];

const CAPTION_MOODS = [
  { id:"heartbreak",     label:"Heartbreak Era",    emoji:"🖤", captions:["some people are just chapters, not the whole book. still annoying though.","closed the chat, opened the wound. new personality dropping soon.","not healed but the eyeliner is sharp so we move."] },
  { id:"delulu",         label:"Delulu Era",         emoji:"✨", captions:["manifesting a plot twist. the universe owes me one (1) miracle.","delulu is the solulu and I do not make the rules.","we are so back (this is not based on any evidence)."] },
  { id:"chaotic-single", label:"Chaotic Single Era", emoji:"💃", captions:["single and thriving, mostly the second one, working on the first","my situationship count is a war crime and I regret nothing","in my villain era but the wifi is bad so it's more of an inconvenience era"] },
  { id:"3am",            label:"3am Existential",    emoji:"🌙", captions:["3am thoughts hit different when you're staring at a ceiling that has never let you down","not to be dramatic but the ceiling and I have an understanding","does anyone actually sleep or do we just lie there reviewing 2016"] },
];

const JOURNAL_ROASTS = [
  "babe you wrote four paragraphs about a text that said \"k\". we need to talk. lovingly.",
  "this entry has more plot twists than a soap opera and the plot is: they replied slower than usual.",
  "you've officially written a Pulitzer-worthy essay about something that will not matter in nine days.",
  "the detective energy in this entry is unmatched. Sherlock Holmes could not crack this case.",
  "reading this back, be honest — would you believe you if a friend told you this? exactly. but we still love you.",
];
const JOURNAL_SOFT_LANDING = [
  "also, genuinely — you're allowed to feel this. just maybe also drink some water.",
  "real talk though: you're doing better than this entry makes it sound.",
  "jokes aside, that sounds like a lot to carry. be a little gentle with yourself today.",
];

const SCORE_TITLES = [
  { min:0,  title:"Casually Concerned" },
  { min:4,  title:"Certified Overthinker" },
  { min:9,  title:"Spiral Specialist" },
  { min:15, title:"Unhinged Icon" },
  { min:22, title:"Conspiracy Board Owner" },
];

function scoreTitle(s) { return [...SCORE_TITLES].reverse().find((t)=>s>=t.min).title; }

const TIER_KEYS = ["mild","main","unhinged","conspiracy"];

const TABS = [
  { id:"scenario",   label:"Overthink It",       icon:Sparkles,          emoji:"🌀" },
  { id:"call",       label:"Incoming Call",       icon:Phone,             emoji:"📞" },
  { id:"flag",       label:"Flag Check",          icon:Flag,              emoji:"🚩" },
  { id:"conspiracy", label:"Conspiracy Builder",  icon:Skull,             emoji:"🕵️" },
  { id:"toxic",      label:"Toxic Advice",        icon:Ghost,             emoji:"👻" },
  { id:"savage",     label:"Savage Replies",      icon:Flame,             emoji:"🔥" },
  { id:"journal",    label:"Journal + Roast",     icon:BookHeart,         emoji:"📔" },
  { id:"captions",   label:"Story Captions",      icon:MessageCircleHeart,emoji:"🖤" },
  { id:"excuses",    label:"Excuse Battle",       icon:Zap,               emoji:"🎭" },
  { id:"wheel",      label:"Anxiety Wheel",       icon:RotateCcw,         emoji:"🎡" },
];

// Chaos level from score
function getChaosLevel(score) {
  if (score >= 22) return 4;
  if (score >= 15) return 3;
  if (score >= 9)  return 2;
  if (score >= 4)  return 1;
  return 0;
}
function getChaosPercent(score) { return Math.min(100, Math.round((score / 28) * 100)); }

// ── Shared glass card ────────────────────────────────────────────────────────
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

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max=100, gradient="linear-gradient(90deg,#8B6DFF,#FF4F9A)", glow }) {
  const pct = Math.min(100, (value/max)*100);
  return (
    <div style={{ height:6, borderRadius:99, background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
      <div style={{
        height:"100%", width:`${pct}%`, background:gradient, borderRadius:99,
        transition:"width 0.7s cubic-bezier(.4,0,.2,1)",
        boxShadow: glow ? `0 0 10px ${glow}80` : undefined,
      }}/>
    </div>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────
function PanelHeading({ children, sub }) {
  return (
    <div style={{ marginBottom:20 }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.t1, margin:0 }}>{children}</h2>
      {sub && <p style={{ fontSize:13, color:C.t2, marginTop:4 }}>{sub}</p>}
    </div>
  );
}

// ── AI badge ─────────────────────────────────────────────────────────────────
function AIBadge() {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700,
      background:`${C.mint}18`, border:`1px solid ${C.mint}40`, color:C.mint,
      marginBottom:12,
    }}>
      ✦ powered by Groq AI
    </span>
  );
}

// ── Input shared style ────────────────────────────────────────────────────────
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
  transition:"border-color 0.2s",
};

function focusBorder(e) { e.target.style.borderColor="rgba(139,109,255,0.5)"; }
function blurBorder(e)  { e.target.style.borderColor="rgba(255,255,255,0.1)"; }

// ── Primary button ────────────────────────────────────────────────────────────
function PrimaryBtn({ onClick, disabled, children, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "rgba(139,109,255,0.2)" : "linear-gradient(135deg,#8B6DFF,#FF4F9A)",
        border:"none", borderRadius:99, padding:"12px 24px",
        color: disabled ? "rgba(240,237,255,0.35)" : "#fff",
        fontSize:14, fontWeight:700, cursor: disabled ? "not-allowed" : "pointer",
        transition:"transform 0.15s,box-shadow 0.15s",
        ...style,
      }}
      onMouseEnter={(e)=>{ if(!disabled){ e.currentTarget.style.transform="scale(1.03)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(139,109,255,0.4)"; }}}
      onMouseLeave={(e)=>{ e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow="none"; }}
    >
      {children}
    </button>
  );
}

// ── Ghost button ──────────────────────────────────────────────────────────────
function GhostBtn({ onClick, children, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        background:"rgba(255,255,255,0.05)",
        border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:99, padding:"10px 20px",
        color:C.t2, fontSize:13, cursor:"pointer",
        transition:"background 0.15s",
        ...style,
      }}
      onMouseEnter={(e)=>{ e.currentTarget.style.background="rgba(255,255,255,0.09)"; }}
      onMouseLeave={(e)=>{ e.currentTarget.style.background="rgba(255,255,255,0.05)"; }}
    >
      {children}
    </button>
  );
}

// ── Chaos Layer (Background Overthinking) ──────────────────────────────────
// A controlled pool of thoughts, doodles, and fake notifications that react to the overthinking level.

const CHAOS_ELEMENTS = [
  // Level 0 (0-20)
  { t: "✨", min: 0, top: "10%", left: "8%", rot: 15, scale: 1.2 },
  { t: "💭", min: 0, top: "25%", right: "12%", rot: -10, scale: 1 },
  { t: "🧠", min: 0, bottom: "20%", left: "5%", rot: 5, scale: 1.1 },
  { t: "probably nothing...", min: 0, top: "15%", right: "20%", rot: -5, type: "thought" },
  { t: "this is fine.", min: 0, bottom: "10%", right: "10%", rot: 8, type: "thought" },
  
  // Level 1 (21-40)
  { t: "❓", min: 1, top: "40%", left: "12%", rot: -15, scale: 1.4 },
  { t: "👀", min: 1, bottom: "35%", right: "8%", rot: 10, scale: 1.3 },
  { t: "wait...", min: 1, top: "30%", left: "15%", rot: -12, type: "thought" },
  { t: "what if...", hover: "what if... nothing?", min: 1, bottom: "25%", left: "20%", rot: 6, type: "thought" },
  { t: "should I?", min: 1, top: "50%", right: "18%", rot: -8, type: "thought" },
  { t: "💬 typing...", min: 1, bottom: "15%", left: "30%", rot: -4, type: "notif" },

  // Level 2 (41-60)
  { t: "🌀", min: 2, top: "20%", left: "25%", rot: 25, scale: 1.5 },
  { t: "❓❓", min: 2, top: "60%", right: "15%", rot: -20, scale: 1.2 },
  { t: "new theory unlocked", min: 2, top: "45%", left: "5%", rot: 14, type: "thought" },
  { t: "okay but...", min: 2, bottom: "40%", right: "22%", rot: -11, type: "thought" },
  { t: "why did they say that?", min: 2, top: "12%", left: "40%", rot: 7, type: "thought" },
  { t: "👀 Viewed your story", min: 2, top: "8%", right: "30%", rot: 3, type: "notif" },
  { t: "we're both confused.", min: 2, bottom: "5%", left: "40%", rot: -2, type: "ui" },

  // Level 3 (61-80)
  { t: "🤯", min: 3, top: "35%", right: "25%", rot: 18, scale: 1.6 },
  { t: "😵‍💫", min: 3, bottom: "45%", left: "15%", rot: -25, scale: 1.5 },
  { t: "💀", min: 3, top: "70%", left: "8%", rot: 12, scale: 1.3 },
  { t: "🚨 URGENT OVERTHINKING", min: 3, top: "28%", left: "30%", rot: -15, type: "notif" },
  { t: "WAIT", min: 3, top: "55%", left: "22%", rot: 22, type: "thought" },
  { t: "WHY?", min: 3, bottom: "30%", right: "35%", rot: -18, type: "thought" },
  { t: "DON'T ANSWER", min: 3, top: "80%", right: "10%", rot: 14, type: "thought" },
  { t: "the app is concerned.", min: 3, top: "2%", left: "50%", rot: 4, type: "ui" },
  { t: "why did they use a period?", min: 3, bottom: "50%", right: "5%", rot: -9, type: "thought" },

  // Level 4 (81-100)
  { t: "🫠", min: 4, top: "40%", left: "40%", rot: 30, scale: 1.8 },
  { t: "‼️", min: 4, bottom: "60%", right: "12%", rot: -30, scale: 1.5 },
  { t: "WHAT DOES THIS MEAN??", min: 4, top: "18%", right: "5%", rot: 25, type: "thought" },
  { t: "COINCIDENCE?", min: 4, bottom: "20%", left: "35%", rot: -14, type: "conspiracy" },
  { t: "THEORY #1", min: 4, top: "32%", right: "40%", rot: 16, type: "conspiracy" },
  { t: "PATTERN DETECTED", min: 4, bottom: "75%", left: "25%", rot: -22, type: "conspiracy" },
  { t: "💬 Seen 2h ago", min: 4, bottom: "12%", right: "28%", rot: -8, type: "notif" },
  { t: "who approved this thought?", min: 4, top: "65%", left: "45%", rot: 5, type: "ui" },
  { t: "NO BUT SERIOUSLY", min: 4, bottom: "35%", left: "50%", rot: -6, type: "thought" }
];

function ChaosElement({ el, index, currentLevel }) {
  const [isHovered, setIsHovered] = useState(false);
  if (currentLevel < el.min) return null;

  const type = el.type || "emoji";
  const speed = Math.max(3, 8 - currentLevel); 
  const animDelay = (index * 0.43).toFixed(2);
  
  let style = {
    position: "absolute",
    top: el.top, bottom: el.bottom, left: el.left, right: el.right,
    transform: `rotate(${el.rot}deg) scale(${el.scale || 1})`,
    animation: `float ${speed}s ease-in-out infinite ${animDelay}s`,
    opacity: Math.min(0.85, 0.35 + (currentLevel * 0.15)),
    pointerEvents: el.hover ? "auto" : "none",
    userSelect: "none",
    zIndex: 5,
  };

  if (type === "thought" || type === "conspiracy" || type === "notif" || type === "ui") {
    style = {
      ...style,
      fontSize: type === "conspiracy" ? 13 : 11,
      fontWeight: type === "conspiracy" ? 900 : 700,
      fontFamily: type === "conspiracy" ? "monospace" : "inherit",
      color: type === "conspiracy" ? C.flame : (type === "ui" ? C.mint : (index % 2 ? C.purple : C.pink)),
      background: type === "notif" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
      backdropFilter: "blur(4px)",
      border: `1px solid ${type === "conspiracy" ? C.flame + "80" : "rgba(255,255,255,0.09)"}`,
      borderRadius: type === "notif" ? 8 : 12,
      padding: "4px 11px",
      letterSpacing: type === "conspiracy" ? "0.05em" : "normal",
      textTransform: type === "conspiracy" ? "uppercase" : "none",
      boxShadow: type === "conspiracy" ? `0 0 10px ${C.flame}20` : "none",
    };
  }

  const text = isHovered && el.hover ? el.hover : el.t;

  return (
    <div
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {text}
    </div>
  );
}

function ChaosLayer({ level }) {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:5, overflow:"hidden" }}>
      {CHAOS_ELEMENTS.map((el, i) => (
        <ChaosElement key={i} el={el} index={i} currentLevel={level} />
      ))}
    </div>
  );
}

// ── Animated background blobs ─────────────────────────────────────────────────
function Background({ chaos }) {
  const intensity = ["0.35","0.45","0.55","0.65","0.8"][chaos];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
      <div style={{
        position:"absolute", width:600, height:600, borderRadius:"50%",
        background:`radial-gradient(circle,rgba(139,109,255,${intensity}) 0%,transparent 70%)`,
        top:"-200px", left:"-200px",
        animation:`blob ${[28,22,17,13,9][chaos]}s ease-in-out infinite`,
        filter:"blur(60px)",
      }}/>
      <div style={{
        position:"absolute", width:500, height:500, borderRadius:"50%",
        background:`radial-gradient(circle,rgba(255,79,154,${intensity}) 0%,transparent 70%)`,
        bottom:"-180px", right:"-180px",
        animation:`blobB ${[30,24,18,14,10][chaos]}s ease-in-out infinite 2s`,
        filter:"blur(60px)",
      }}/>
      <div style={{
        position:"absolute", width:400, height:400, borderRadius:"50%",
        background:`radial-gradient(circle,rgba(104,210,167,${parseFloat(intensity)*0.7}) 0%,transparent 70%)`,
        top:"40%", left:"40%",
        animation:`blobC ${[35,28,21,16,11][chaos]}s ease-in-out infinite 4s`,
        filter:"blur(80px)",
      }}/>
      {/* Noise grain overlay */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        backgroundSize:"256px",
        opacity:0.4,
      }}/>
    </div>
  );
}

// ── Score meter ───────────────────────────────────────────────────────────────
function ScoreMeter({ score, chaosPercent, chaosLevel }) {
  const COLORS_METER = [C.mint, C.mint, C.sun, C.pink, C.flame];
  const col = COLORS_METER[chaosLevel];
  const title = scoreTitle(score);

  return (
    <div style={{
      background: C.s2,
      border: `1px solid ${col}30`,
      borderRadius:16,
      padding:"14px 16px",
      marginBottom:16,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:"uppercase", letterSpacing:"0.07em" }}>
          overthink meter
        </span>
        <span style={{ fontSize:12, fontWeight:700, color:col }}>
          {chaosPercent}%
        </span>
      </div>
      <ProgressBar value={chaosPercent} max={100} gradient={`linear-gradient(90deg,${C.mint},${C.sun},${col})`} glow={col} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
        <span style={{ fontSize:12, color:C.t2, fontWeight:600 }}>{title}</span>
        <span style={{ fontSize:11, color:C.t3 }}>{score} pts</span>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, score, chaosPercent, chaosLevel }) {
  return (
    <div style={{
      width:220, flexShrink:0,
      position:"sticky", top:24,
      height:"fit-content",
      display:"flex", flexDirection:"column", gap:4,
    }}>
      {/* Brand */}
      <div style={{ marginBottom:20, padding:"0 4px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
          🌀 overthink-o-meter
        </div>
        <h1 style={{ fontSize:20, fontWeight:900, color:C.t1, lineHeight:1.2, margin:0 }}>
          Are you<br/>
          <span style={{ background:"linear-gradient(135deg,#8B6DFF,#FF4F9A)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            overthinking?
          </span>
        </h1>
        <p style={{ fontSize:11, color:C.t3, marginTop:6 }}>it was probably nothing.</p>
      </div>

      {/* Score meter */}
      <ScoreMeter score={score} chaosPercent={chaosPercent} chaosLevel={chaosLevel} />

      {/* Nav */}
      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
        {TABS.map((t) => {
          const isActive = active === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"10px 14px", borderRadius:12,
                border: isActive ? "1px solid rgba(139,109,255,0.35)" : "1px solid transparent",
                background: isActive
                  ? "linear-gradient(135deg,rgba(139,109,255,0.2),rgba(255,79,154,0.12))"
                  : "transparent",
                color: isActive ? C.t1 : C.t2,
                fontSize:13, fontWeight: isActive ? 700 : 400,
                cursor:"pointer",
                transition:"all 0.15s",
                textAlign:"left",
              }}
              onMouseEnter={(e)=>{ if(!isActive){ e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.color=C.t1; }}}
              onMouseLeave={(e)=>{ if(!isActive){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=C.t2; }}}
            >
              <span style={{ fontSize:15 }}>{t.emoji}</span>
              <span style={{ flex:1 }}>{t.label}</span>
              {isActive && <span style={{ width:6, height:6, borderRadius:"50%", background:"linear-gradient(#8B6DFF,#FF4F9A)", flexShrink:0 }}/>}
            </button>
          );
        })}
      </div>

      {/* Bottom tagline */}
      <p style={{ fontSize:10, color:C.t3, marginTop:16, padding:"0 4px", lineHeight:1.5 }}>
        "the ui is also overthinking" 🌀
      </p>
    </div>
  );
}

// ── Mobile header ─────────────────────────────────────────────────────────────
function MobileHeader({ score, chaosPercent, chaosLevel }) {
  const COLORS_METER = [C.mint, C.mint, C.sun, C.pink, C.flame];
  const col = COLORS_METER[chaosLevel];
  return (
    <div style={{
      padding:"14px 16px 10px",
      borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", justifyContent:"space-between",
    }}>
      <div>
        <div style={{ fontSize:15, fontWeight:900, color:C.t1 }}>🌀 Overthink-o-Meter</div>
        <div style={{ fontSize:11, color:C.t3 }}>{scoreTitle(score)} · {score} pts</div>
      </div>
      <div style={{
        fontSize:12, fontWeight:700,
        padding:"4px 12px", borderRadius:99,
        background:`${col}20`, border:`1px solid ${col}40`, color:col,
      }}>
        {chaosPercent}%
      </div>
    </div>
  );
}

// ── Mobile bottom nav ─────────────────────────────────────────────────────────
function MobileBottomNav({ active, setActive }) {
  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:50,
      display:"flex", justifyContent:"space-around", alignItems:"center",
      padding:"8px 4px 12px",
      background:"rgba(13,11,26,0.95)",
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      borderTop:`1px solid ${C.border}`,
    }}>
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              padding:"4px 8px", border:"none", background:"none", cursor:"pointer",
              color: isActive ? C.purple : C.t3,
              fontSize:10, fontWeight: isActive ? 700 : 400,
              gap:2,
            }}
          >
            <span style={{ fontSize:18 }}>{t.emoji}</span>
            <span style={{ fontSize:9 }}>{t.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── 100% Overlay (Professional Overthinker) ───────────────────────────────────
const STAR_POSITIONS = [
  { top:"15%", left:"20%" }, { top:"20%", right:"18%" },
  { bottom:"25%", left:"15%" }, { bottom:"20%", right:"20%" },
  { top:"50%", left:"8%" },  { top:"50%", right:"8%" },
];

function OverthinkCompleteOverlay() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(13,11,26,0.88)",
      backdropFilter:"blur(12px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      animation:"fadeIn 0.3s ease",
    }}>
      {STAR_POSITIONS.map((p, i) => (
        <div
          key={i}
          style={{
            position:"absolute", fontSize:16, ...p,
            animation:`starFloat ${2+i*0.3}s ease-in-out infinite ${i*0.4}s`,
          }}
        >
          ✨
        </div>
      ))}

      <div style={{
        textAlign:"center", maxWidth:380, padding:40,
        background:"rgba(255,255,255,0.05)",
        backdropFilter:"blur(30px)",
        border:"1px solid rgba(139,109,255,0.4)",
        borderRadius:28,
        boxShadow:"0 0 80px rgba(139,109,255,0.3), 0 0 160px rgba(255,79,154,0.15)",
        animation:"overlayIn 0.4s cubic-bezier(.4,0,.2,1)",
      }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🤯</div>
        <h2 style={{
          fontSize:24, fontWeight:900, color:C.t1, margin:"0 0 8px",
          background:"linear-gradient(135deg,#8B6DFF,#FF4F9A)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>
          OVERTHINKING COMPLETE
        </h2>
        <p style={{ color:C.t2, fontSize:14, lineHeight:1.6, marginBottom:16 }}>
          You have successfully overthought<br/>the overthinking.
        </p>
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          padding:"8px 20px", borderRadius:99,
          background:"rgba(255,216,77,0.15)", border:"1px solid rgba(255,216,77,0.35)",
          color:C.sun, fontSize:13, fontWeight:700,
        }}>
          🏆 Professional Overthinker
        </div>
      </div>
    </div>
  );
}

// ── Milestone toast ───────────────────────────────────────────────────────────
function MilestoneToast({ text }) {
  return (
    <div style={{
      position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
      zIndex:500, display:"flex", alignItems:"center", gap:8,
      padding:"10px 20px", borderRadius:99,
      background:`rgba(255,216,77,0.15)`,
      backdropFilter:"blur(16px)",
      border:`1px solid ${C.sun}50`,
      color:C.sun, fontSize:13, fontWeight:700,
      animation:"milestoneIn 2.2s ease forwards",
      whiteSpace:"nowrap",
      boxShadow:`0 4px 20px rgba(255,216,77,0.2)`,
    }}>
      ✨ new title: {text}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PANELS
   ═══════════════════════════════════════════════════════════════════════════ */

// ── 1. Scenario / Overthink It ────────────────────────────────────────────────
function ScenarioPanel({ onScore, chaosLevel }) {
  const [input,   setInput]   = useState("");
  const [tierIdx, setTierIdx] = useState(-1);
  const [lines,   setLines]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const hasKey = Boolean(import.meta.env.VITE_GROQ_API_KEY &&
    import.meta.env.VITE_GROQ_API_KEY !== "your_groq_api_key_here");

  async function overthink() {
    if (!input.trim() || loading) return;
    const nextTier = Math.min(tierIdx + 1, SCENARIO_TIERS.length - 1);
    const tier = SCENARIO_TIERS[nextTier];
    setTierIdx(nextTier);
    setAiError(null);
    if (hasKey) {
      setLoading(true);
      try {
        const aiLines = await generateOverthinkLines(input.trim(), TIER_KEYS[nextTier]);
        setLines((p) => [...p, ...aiLines]);
      } catch {
        setAiError("AI is spiraling too hard. falling back to templates.");
        setLines((p) => [...p, ...tier.lines(input.trim())]);
      } finally { setLoading(false); }
    } else {
      setLines((p) => [...p, ...tier.lines(input.trim())]);
    }
    onScore(2);
  }

  function reset() { setTierIdx(-1); setLines([]); setInput(""); setAiError(null); }

  const tier = tierIdx >= 0 ? SCENARIO_TIERS[tierIdx] : null;
  const meterVal = tierIdx >= 0 ? ((tierIdx+1)/SCENARIO_TIERS.length)*100 : 5;

  return (
    <Card style={{ animation:"phaseIn 0.35s ease" }}>
      <PanelHeading sub="describe a totally normal situation. we will make it worse, together.">
        🌀 Overthink It
      </PanelHeading>

      {hasKey && <AIBadge />}

      {/* Spiral meter */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.t3, marginBottom:6 }}>
          <span style={{ textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:700 }}>spiral meter</span>
          <span style={{ color: tier?.color || C.mint, fontWeight:700 }}>{tier?.label || "resting state"}</span>
        </div>
        <ProgressBar value={meterVal} gradient={`linear-gradient(90deg,${C.mint},${tier?.color||C.mint})`} glow={tier?.color} />
      </div>

      {/* Output lines */}
      <div style={{ maxHeight:260, overflowY:"auto", display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            padding:"12px 16px", borderRadius:14,
            background:"rgba(139,109,255,0.1)", border:"1px solid rgba(139,109,255,0.2)",
            fontSize:14, color:C.t1, lineHeight:1.55,
            animation:"slideUp 0.3s ease",
          }}>
            {l}
          </div>
        ))}
        {loading && (
          <div style={{
            padding:"12px 16px", borderRadius:14,
            background:C.s2, border:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", gap:8, color:C.t2, fontSize:14,
          }}>
            <span style={{ display:"inline-block", width:14, height:14, border:"2px solid currentColor", borderTopColor:"transparent", borderRadius:"50%", animation:"spinSlow 0.7s linear infinite" }}/>
            the AI is spiraling on your behalf...
          </div>
        )}
        {aiError && <p style={{ fontSize:12, color:C.flame, fontStyle:"italic" }}>⚠ {aiError}</p>}
        {lines.length === 0 && !loading && (
          <p style={{ fontSize:13, color:C.t3, fontStyle:"italic" }}>waiting for you to give me something to work with...</p>
        )}
      </div>

      {/* Input row */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && overthink()}
          placeholder="e.g. they took 3 hours to text back"
          disabled={loading}
          style={{ ...inputStyle, flex:1, minWidth:180, borderRadius:99 }}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
        <div style={{ display:"flex", gap:6 }}>
          <PrimaryBtn onClick={overthink} disabled={loading}>
            {loading ? (
              <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                <span style={{ display:"inline-block", width:13, height:13, border:"2px solid #fff", borderTopColor:"transparent", borderRadius:"50%", animation:"spinSlow 0.7s linear infinite" }}/>
                thinking...
              </span>
            ) : (
              <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><Send size={13}/> spiral more</span>
            )}
          </PrimaryBtn>
          {lines.length > 0 && !loading && (
            <GhostBtn onClick={reset} style={{ padding:"10px 14px" }}><RotateCcw size={14}/></GhostBtn>
          )}
        </div>
      </div>

      {tierIdx === SCENARIO_TIERS.length - 1 && (
        <div style={{ marginTop:14 }}>
          <span style={{
            display:"inline-block", padding:"4px 14px", borderRadius:99, fontSize:12, fontWeight:700,
            background:`${C.flame}18`, border:`1px solid ${C.flame}40`, color:C.flame,
            transform:"rotate(-2deg)",
          }}>
            🧵 CONSPIRACY BOARD UNLOCKED
          </span>
        </div>
      )}
    </Card>
  );
}

// ── 2. Incoming Call ──────────────────────────────────────────────────────────
const CALL_PULSE_ANIMS = ["callPulse1","callPulse2","callPulse3","callPulse4"];
const CHAOS_THOUGHTS = {
  0: ["who's calling?"],
  1: ["who's calling?", "wait... who is this?"],
  2: ["wait... who is this?", "why are they calling?", "why not just text?"],
  3: ["WHY ARE THEY CALLING?", "this is suspicious", "should I answer?"],
  4: ["WHO IS IT?!", "DO I ANSWER?", "WHAT IF IT'S IMPORTANT?", "WHAT IF IT'S NOT?", "ANSWER.", "NO.", "DON'T."],
};

function CallPanel({ onScore, chaosLevel }) {
  const [caller, setCaller] = useState("");
  const [answered, setAnswered] = useState(false);
  const [tier, setTier] = useState(null);
  const [reasons, setReasons] = useState([]);
  const interactCount = useRef(0);

  function answer() {
    if (!caller.trim()) return;
    interactCount.current++;
    const t = CALL_TIERS[Math.floor(Math.random() * CALL_TIERS.length)];
    setTier(t);
    setReasons([...t.reasons].sort(() => 0.5-Math.random()).slice(0, 3));
    setAnswered(true);
    onScore(2);
  }

  function hangUp() { setAnswered(false); setCaller(""); setTier(null); }

  const thoughts = CHAOS_THOUGHTS[chaosLevel] || CHAOS_THOUGHTS[0];
  const pulseAnim = CALL_PULSE_ANIMS[Math.min(chaosLevel, 3)];
  const TIER_COLORS = [C.mint, C.sun, C.pink, C.flame];

  return (
    <Card style={{ maxWidth:420, animation:"phaseIn 0.35s ease" }}>
      <PanelHeading sub="who's calling, and more importantly — why.">📞 Incoming Call</PanelHeading>

      {!answered ? (
        <div style={{ textAlign:"center", padding:"20px 0" }}>
          {/* Phone icon with pulse */}
          <div style={{
            width:80, height:80, borderRadius:"50%", margin:"0 auto 16px",
            background:"rgba(104,210,167,0.12)",
            border:`2px solid ${TIER_COLORS[Math.min(chaosLevel,3)]}50`,
            display:"flex", alignItems:"center", justifyContent:"center",
            animation:`${pulseAnim} ${[2.5,2,1.5,1.2,0.8][chaosLevel]}s ease-in-out infinite`,
          }}>
            <Phone size={28} style={{ color:C.mint }}/>
          </div>

          {/* Chaos thoughts */}
          <div style={{ marginBottom:16, minHeight:40, display:"flex", flexWrap:"wrap", justifyContent:"center", gap:6 }}>
            {thoughts.map((t, i) => (
              <span
                key={t + i}
                style={{
                  fontSize:12, color: i===thoughts.length-1 ? C.pink : C.t2,
                  fontWeight: i===thoughts.length-1 ? 700 : 400,
                  fontStyle:"italic",
                }}
              >
                {t}
                {i < thoughts.length-1 && <span style={{ margin:"0 4px", opacity:0.4 }}>·</span>}
              </span>
            ))}
          </div>

          {interactCount.current >= 3 && (
            <p style={{ fontSize:11, color:C.t3, fontStyle:"italic", marginBottom:12 }}>
              you really thought about that one 😭
            </p>
          )}

          <input
            value={caller}
            onChange={(e) => setCaller(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && answer()}
            placeholder="who's calling..."
            style={{ ...inputStyle, textAlign:"center", borderRadius:99, marginBottom:14 }}
            onFocus={focusBorder} onBlur={blurBorder}
          />
          <PrimaryBtn onClick={answer} style={{ width:"100%" }}>
            answer (bravely)
          </PrimaryBtn>
        </div>
      ) : (
        <div style={{ animation:"slideUp 0.3s ease" }}>
          <p style={{ fontSize:14, color:C.t2, marginBottom:14 }}>
            <b style={{ color:C.t1 }}>{caller}</b> is calling.
            heart rate: rising. here's what this could mean —
          </p>
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.t3, marginBottom:6 }}>
              <span style={{ textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:700 }}>threat level</span>
              <span style={{ color:tier.color, fontWeight:700 }}>{tier.label}</span>
            </div>
            <ProgressBar value={tier.severity*25} gradient={`linear-gradient(90deg,${C.mint},${tier.color})`} glow={tier.color} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
            {reasons.map((r, i) => (
              <div key={i} style={{
                padding:"12px 16px", borderRadius:14,
                background:C.s2, border:`1px solid ${C.border}`,
                fontSize:14, color:C.t1, lineHeight:1.5,
              }}>
                {r}
              </div>
            ))}
          </div>
          <GhostBtn onClick={hangUp} style={{ width:"100%", justifyContent:"center" }}>
            decline and text instead
          </GhostBtn>
        </div>
      )}
    </Card>
  );
}

// ── 3. (Removed Screenshot Spiral) ──────────────────────────────────────────
// ── 4. Toxic Advice ───────────────────────────────────────────────────────────
function ToxicPanel({ onScore }) {
  const [personaId, setPersonaId] = useState(TOXIC_PERSONAS[0].id);
  const [situation, setSituation] = useState("");
  const [reply, setReply]         = useState(null);
  const persona = TOXIC_PERSONAS.find((p) => p.id === personaId);

  function ask() {
    if (!situation.trim()) return;
    const lines = persona.style(situation.trim());
    setReply(lines[Math.floor(Math.random() * lines.length)]);
    onScore(2);
  }

  return (
    <Card style={{ animation:"phaseIn 0.35s ease" }}>
      <PanelHeading sub="pick your chaos consultant. describe the situation. regret it immediately.">
        😈 Toxic Advice Mode
      </PanelHeading>

      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
        {TOXIC_PERSONAS.map((p) => {
          const sel = personaId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => { setPersonaId(p.id); setReply(null); }}
              style={{
                padding:"8px 16px", borderRadius:12, cursor:"pointer",
                background: sel ? "linear-gradient(135deg,rgba(139,109,255,0.3),rgba(255,79,154,0.2))" : C.s2,
                border: sel ? "1px solid rgba(139,109,255,0.4)" : `1px solid ${C.border}`,
                color: sel ? C.t1 : C.t2,
                fontSize:13, fontWeight: sel ? 700 : 400,
                transition:"all 0.15s",
              }}
            >
              {p.emoji} {p.name}
            </button>
          );
        })}
      </div>

      <textarea
        value={situation}
        onChange={(e) => setSituation(e.target.value)}
        placeholder="what's going on..."
        rows={3}
        style={{ ...inputStyle, resize:"vertical", marginBottom:12 }}
        onFocus={focusBorder} onBlur={blurBorder}
      />

      <PrimaryBtn onClick={ask}>
        ask {persona.name.toLowerCase()}
      </PrimaryBtn>

      {reply && (
        <div style={{
          marginTop:16, padding:"16px 18px", borderRadius:14,
          background:"rgba(139,109,255,0.08)",
          border:"1px solid rgba(139,109,255,0.2)",
          animation:"slideUp 0.3s ease",
        }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.t3, marginBottom:8 }}>
            {persona.emoji} {persona.name}
          </p>
          <p style={{ fontSize:14, color:C.t1, lineHeight:1.6 }}>{reply}</p>
        </div>
      )}
    </Card>
  );
}

// ── 5. Savage Replies ─────────────────────────────────────────────────────────
function SavagePanel({ onScore }) {
  const [msg, setMsg]         = useState("");
  const [replies, setReplies] = useState([]);
  const [copiedIdx, setCopied]= useState(null);

  function generate() {
    if (!msg.trim()) return;
    setReplies([...SAVAGE_TEMPLATES].sort(()=>0.5-Math.random()).slice(0,4).map((f)=>f(msg.trim())));
    onScore(2);
  }

  function copy(text, i) {
    navigator.clipboard?.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <Card style={{ animation:"phaseIn 0.35s ease" }}>
      <PanelHeading sub="paste what they sent. we'll write the comeback. sending it is on you.">
        🔥 Savage Reply Generator
      </PanelHeading>

      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="paste the message here..."
        rows={3}
        style={{ ...inputStyle, resize:"vertical", marginBottom:12 }}
        onFocus={focusBorder} onBlur={blurBorder}
      />

      <PrimaryBtn onClick={generate}>generate comebacks</PrimaryBtn>

      {replies.length > 0 && (
        <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:10 }}>
          {replies.map((r, i) => (
            <div key={i} style={{
              padding:"14px 16px", borderRadius:14,
              background:C.s2, border:`1px solid ${C.border}`,
              display:"flex", gap:12, alignItems:"flex-start",
              animation:"slideUp 0.3s ease",
            }}>
              <p style={{ flex:1, fontSize:14, color:C.t1, lineHeight:1.55 }}>{r}</p>
              <button
                onClick={() => copy(r, i)}
                style={{ border:"none", background:"none", color:C.t3, cursor:"pointer", padding:4, flexShrink:0 }}
              >
                {copiedIdx === i ? <Check size={15} style={{color:C.mint}}/> : <Copy size={15}/>}
              </button>
            </div>
          ))}
          <p style={{ fontSize:11, color:C.t3, fontStyle:"italic" }}>
            send it / don't, you'll regret it either way — no judgment 🖤
          </p>
        </div>
      )}
    </Card>
  );
}

// ── 6. Journal + Roast ────────────────────────────────────────────────────────
function JournalPanel({ onScore }) {
  const [entry, setEntry]   = useState("");
  const [entries, setEntries] = useState([]);

  function submit() {
    if (!entry.trim()) return;
    const roast = JOURNAL_ROASTS[Math.floor(Math.random() * JOURNAL_ROASTS.length)];
    const soft  = JOURNAL_SOFT_LANDING[Math.floor(Math.random() * JOURNAL_SOFT_LANDING.length)];
    setEntries((p) => [{ text:entry.trim(), roast, soft }, ...p]);
    setEntry("");
    onScore(2);
  }

  return (
    <Card style={{ animation:"phaseIn 0.35s ease" }}>
      <PanelHeading sub="write it out. we'll roast it. then we'll be nice for one sentence.">
        📔 Journal + Roast
      </PanelHeading>

      <textarea
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        placeholder="dear diary..."
        rows={5}
        style={{ ...inputStyle, resize:"vertical", fontSize:15, marginBottom:12 }}
        onFocus={focusBorder} onBlur={blurBorder}
      />
      <PrimaryBtn onClick={submit}>submit for roasting</PrimaryBtn>

      {entries.length > 0 && (
        <div style={{ marginTop:20, maxHeight:400, overflowY:"auto", display:"flex", flexDirection:"column", gap:12 }}>
          {entries.map((e, i) => (
            <div key={i} style={{
              padding:"16px 18px", borderRadius:16,
              background:"rgba(139,109,255,0.07)", border:"1px solid rgba(139,109,255,0.15)",
              animation:"slideUp 0.3s ease",
            }}>
              <p style={{ fontSize:14, color:C.t2, fontStyle:"italic", marginBottom:10, lineHeight:1.6 }}>
                "{e.text}"
              </p>
              <p style={{ fontSize:14, fontWeight:600, color:C.t1, lineHeight:1.55 }}>{e.roast}</p>
              <p style={{ fontSize:12, color:C.mint, marginTop:8, fontStyle:"italic" }}>{e.soft}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── 7. Story Captions ─────────────────────────────────────────────────────────
function CaptionsPanel({ onScore }) {
  const [moodId, setMoodId] = useState(CAPTION_MOODS[0].id);
  const [caption, setCaption] = useState(null);
  const mood = CAPTION_MOODS.find((m) => m.id === moodId);

  function generate() {
    setCaption(mood.captions[Math.floor(Math.random() * mood.captions.length)]);
    onScore(1);
  }

  return (
    <Card style={{ maxWidth:440, animation:"phaseIn 0.35s ease" }}>
      <PanelHeading sub="pick a mood. get a caption ready to screenshot for your story.">
        🖤 Story Caption Generator
      </PanelHeading>

      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
        {CAPTION_MOODS.map((m) => {
          const sel = moodId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setMoodId(m.id); setCaption(null); }}
              style={{
                padding:"8px 14px", borderRadius:12, cursor:"pointer", fontSize:13,
                background: sel ? "linear-gradient(135deg,rgba(139,109,255,0.3),rgba(255,79,154,0.2))" : C.s2,
                border: sel ? "1px solid rgba(139,109,255,0.4)" : `1px solid ${C.border}`,
                color: sel ? C.t1 : C.t2, fontWeight: sel ? 700 : 400,
              }}
            >
              {m.emoji} {m.label}
            </button>
          );
        })}
      </div>

      <PrimaryBtn onClick={generate}>generate caption</PrimaryBtn>

      {caption && (
        <div style={{
          marginTop:16, padding:"24px 20px", borderRadius:16, textAlign:"center",
          background:"linear-gradient(135deg,rgba(139,109,255,0.12),rgba(255,79,154,0.08))",
          border:"1px solid rgba(139,109,255,0.2)",
          animation:"scaleIn 0.35s cubic-bezier(.4,0,.2,1)",
        }}>
          <div style={{ fontSize:32, marginBottom:10 }}>{mood.emoji}</div>
          <p style={{
            fontSize:18, fontWeight:600, color:C.t1, lineHeight:1.45,
            fontStyle:"italic",
          }}>
            "{caption}"
          </p>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function OverthinkOMeter() {
  const [active, setActive]           = useState("scenario");
  const [score, setScore]             = useState(0);
  const [milestoneFlash, setMFlash]   = useState(null);
  const [show100, setShow100]         = useState(false);
  const shown100 = useRef(false);

  const chaosLevel   = getChaosLevel(score);
  const chaosPercent = getChaosPercent(score);

  // Award score and check milestones
  function bumpScore(n = 1) {
    setScore((prev) => {
      const next  = prev + n;
      const before = scoreTitle(prev);
      const after  = scoreTitle(next);
      if (after !== before) {
        setMFlash(after);
        setTimeout(() => setMFlash(null), 2500);
      }
      return next;
    });
  }

  // 100% overlay — show once
  useEffect(() => {
    if (chaosPercent >= 100 && !shown100.current) {
      shown100.current = true;
      setShow100(true);
      setTimeout(() => setShow100(false), 3500);
    }
  }, [chaosPercent]);

  return (
    <div style={{ minHeight:"100dvh", background:C.bg, position:"relative" }}>
      {/* ── Global styles ── */}
      <style>{`
        * { box-sizing:border-box; }
        @keyframes float {
          0%,100% { transform:translateY(0) rotate(var(--rot,0deg)); }
          50%     { transform:translateY(-10px) rotate(var(--rot,0deg)); }
        }
        @keyframes blob  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.07)} 66%{transform:translate(-15px,10px) scale(0.96)} }
        @keyframes blobB { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,15px) scale(1.05)} 66%{transform:translate(20px,-10px) scale(0.94)} }
        @keyframes blobC { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,20px) scale(1.1)} }
        @keyframes spinSlow { to{transform:rotate(360deg)} }
        @keyframes phaseIn  { 0%{opacity:0;transform:scale(0.96) translateY(8px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes overlayIn{ from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
        @keyframes starFloat{ 0%,100%{transform:translateY(0) scale(1);opacity:.7} 50%{transform:translateY(-12px) scale(1.2);opacity:1} }
        @keyframes milestoneIn {
          0%  {opacity:0;transform:translateX(-50%) translateY(-8px)}
          15% {opacity:1;transform:translateX(-50%) translateY(0)}
          80% {opacity:1;transform:translateX(-50%) translateY(0)}
          100%{opacity:0;transform:translateX(-50%) translateY(-8px)}
        }
        @keyframes callPulse1{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(104,210,167,0.5)}50%{transform:scale(1.02);box-shadow:0 0 0 14px rgba(104,210,167,0)}}
        @keyframes callPulse2{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,216,77,0.5)}50%{transform:scale(1.03);box-shadow:0 0 0 18px rgba(255,216,77,0)}}
        @keyframes callPulse3{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,79,154,0.5)}50%{transform:scale(1.04);box-shadow:0 0 0 20px rgba(255,79,154,0)}}
        @keyframes callPulse4{0%,10%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,80,69,0.6)}50%{transform:scale(1.05) rotate(-1deg);box-shadow:0 0 0 24px rgba(255,80,69,0)}90%,100%{transform:scale(1) rotate(1deg)}}
      `}</style>

      {/* ── Background blobs ── */}
      <Background chaos={chaosLevel} />

      {/* ── Chaos thought bubbles ── */}
      <ChaosLayer level={chaosLevel} />

      {/* ── Overlays ── */}
      {show100 && <OverthinkCompleteOverlay />}
      {milestoneFlash && <MilestoneToast text={milestoneFlash} />}

      {/* ── Mobile header ── */}
      <div style={{ display:"block" }} className="mobile-header">
        <MobileHeader score={score} chaosPercent={chaosPercent} chaosLevel={chaosLevel} />
      </div>

      {/* ── Layout ── */}
      <div style={{
        maxWidth:1200, margin:"0 auto",
        padding:"24px 20px 120px",
        display:"flex", gap:24, alignItems:"flex-start",
        position:"relative", zIndex:10,
      }}>
        {/* Sidebar — hidden on mobile via inline media approach */}
        <div className="sidebar-wrap">
          <Sidebar
            active={active}
            setActive={setActive}
            score={score}
            chaosPercent={chaosPercent}
            chaosLevel={chaosLevel}
          />
        </div>

        {/* Main panel */}
        <main style={{ flex:1, minWidth:0 }}>
          {active === "scenario"   && <ScenarioPanel    onScore={bumpScore} chaosLevel={chaosLevel} />}
          {active === "call"       && <CallPanel         onScore={bumpScore} chaosLevel={chaosLevel} />}
          {active === "conspiracy" && <ConspiracyBuilder onScore={bumpScore} />}
          {active === "toxic"      && <ToxicPanel        onScore={bumpScore} />}
          {active === "savage"     && <SavagePanel       onScore={bumpScore} />}
          {active === "journal"    && <JournalPanel      onScore={bumpScore} />}
          {active === "captions"   && <CaptionsPanel     onScore={bumpScore} />}
          {active === "flag"       && <RedGreenFlag      onScore={bumpScore} />}
          {active === "excuses"    && <ExcuseBattle      onScore={bumpScore} />}
          {active === "wheel"      && <AnxietyWheel      onScore={bumpScore} />}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <div className="mobile-nav">
        <MobileBottomNav active={active} setActive={setActive} />
      </div>

      {/* ── Responsive styles ── */}
      <style>{`
        .sidebar-wrap { display:flex; }
        .mobile-header { display:none; }
        .mobile-nav    { display:none; }
        @media (max-width:768px) {
          .sidebar-wrap  { display:none !important; }
          .mobile-header { display:block !important; }
          .mobile-nav    { display:block !important; }
        }
      `}</style>
    </div>
  );
}
