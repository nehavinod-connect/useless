// ============================================================
// RED FLAG / GREEN FLAG — Question Bank + Constants
// IMPORTANT: answer scores are NEVER shown to the user.
// score: 0 = green flag, 1 = yellow, 2 = red, 3 = nuclear red
// ============================================================

export const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Your crush hasn't texted back in 3 hours. What's your move?",
    answers: [
      { text: "Give them space — they're probably just busy.", score: 0 },
      { text: "Send one casual follow-up after a couple more hours.", score: 1 },
      { text: "Check if they've been active on WhatsApp. Just to see.", score: 2 },
      { text: "Send 4 messages escalating from 'hey :)' to full existential crisis.", score: 3 },
    ],
  },
  {
    id: 2,
    question: "You weren't added to a group chat. What do you think?",
    answers: [
      { text: "Probably an oversight. I'll ask casually.", score: 0 },
      { text: "Might have forgotten — not going to lose sleep over it.", score: 1 },
      { text: "I'm analysing who IS in the group and building a theory.", score: 2 },
      { text: "I have a list of suspects, a motive map, and Phase 2 begins tonight.", score: 3 },
    ],
  },
  {
    id: 3,
    question: "Your best friend didn't react to your Instagram post. You...",
    answers: [
      { text: "Don't even notice. Not everything needs a reaction.", score: 0 },
      { text: "Notice but assume they missed it — it happens.", score: 1 },
      { text: "Check if they reacted to other people's posts today.", score: 2 },
      { text: "Soft-launch your villain era. They'll understand eventually.", score: 3 },
    ],
  },
  {
    id: 4,
    question: "Your partner is an hour late and not responding to texts. You...",
    answers: [
      { text: "Assume traffic. Put on a show and wait.", score: 0 },
      { text: "Send a quick 'everything okay?' and carry on.", score: 1 },
      { text: "Call twice, text three friends asking if they've heard from them.", score: 2 },
      { text: "Draft speeches. For several different scenarios. Just in case.", score: 3 },
    ],
  },
  {
    id: 5,
    question: "Someone views your WhatsApp status but ignores your unread message. You...",
    answers: [
      { text: "Completely normal. Status and DMs are different things.", score: 0 },
      { text: "Mildly weird, but people are distracted. Whatever.", score: 1 },
      { text: "Leave them on read next time. As a diplomatic response.", score: 2 },
      { text: "Screenshot their 'last seen' hourly. As running evidence.", score: 3 },
    ],
  },
  {
    id: 6,
    question: "A friend cancels last minute with 'something came up.' You...",
    answers: [
      { text: "Reschedule. Life happens.", score: 0 },
      { text: "Feel a bit disappointed but genuinely understand.", score: 1 },
      { text: "Ask what came up and cross-reference their Instagram stories.", score: 2 },
      { text: "Quietly investigate their stories for contradicting evidence.", score: 3 },
    ],
  },
  {
    id: 7,
    question: "Your crush likes every story except yours. What do you conclude?",
    answers: [
      { text: "They probably just missed it. Algorithm is unpredictable.", score: 0 },
      { text: "A little odd. Probably coincidence.", score: 1 },
      { text: "Post a slightly pointed story. Strategic but subtle.", score: 2 },
      { text: "Build a 47-slide evidence presentation. With footnotes.", score: 3 },
    ],
  },
  {
    id: 8,
    question: "Someone you argued with last week just liked your photo. You...",
    answers: [
      { text: "Let it go. We've all moved on.", score: 0 },
      { text: "Take it as an olive branch. Sweet of them.", score: 1 },
      { text: "Like a strategically chosen old photo of theirs in return.", score: 2 },
      { text: "Spend six business days decoding the hidden message in the like.", score: 3 },
    ],
  },
  {
    id: 9,
    question: "Your group chat is suspiciously active. You notice you haven't been mentioned. You...",
    answers: [
      { text: "Join when I have something to say. Normal.", score: 0 },
      { text: "Lurk a bit, jump in when it feels right.", score: 1 },
      { text: "Monitor who's responding most and to what topic.", score: 2 },
      { text: "Conclude I've been silently excommunicated and plan my exit.", score: 3 },
    ],
  },
  {
    id: 10,
    question: "Someone you like is posting stories at 2am. You...",
    answers: [
      { text: "People have different schedules. Nothing to see here.", score: 0 },
      { text: "Maybe a different timezone. I note it mildly.", score: 1 },
      { text: "Wonder who they're talking to at 2am specifically.", score: 2 },
      { text: "Set a nightly alarm to monitor their activity. For research.", score: 3 },
    ],
  }
];

// Max possible score = 10 × 3 = 30
export const FLAG_THRESHOLDS = [
  { max: 5,  key: "green",   label: "🌿 Certified Green Flag",  shortLabel: "Green Flag",        color: "#68D2A7", glow: "rgba(104,210,167,0.35)" },
  { max: 12, key: "yellow",  label: "🟡 Yellow Flag",           shortLabel: "Yellow Flag",       color: "#FFD84D", glow: "rgba(255,216,77,0.35)"  },
  { max: 20, key: "red",     label: "🚩 Red Flag",              shortLabel: "Red Flag",          color: "#FF5045", glow: "rgba(255,80,69,0.4)"    },
  { max: 30, key: "nuclear", label: "☠ Nuclear Red Flag",       shortLabel: "Nuclear Red Flag",  color: "#C44BFF", glow: "rgba(196,75,255,0.45)"  },
];

export const FLAG_ROASTS = {
  green: [
    "Wow. Are you even real? You might be a therapist's dream client.",
    "Genuinely secure. Slightly suspicious. No one is this okay.",
    "Either emotionally mature or you abandoned your phone in 2019.",
    "We've never seen this before. Congratulations on being a unicorn.",
  ],
  yellow: [
    "Healthy-ish. You sometimes spiral but mostly recover. We respect the journey.",
    "51% rational, 49% spiral. We're keeping a gentle eye on you.",
    "Almost fine. Please drink water and close four of those browser tabs.",
    "Doing okay. You could do better. The fact you know that is the green flag.",
  ],
  red: [
    "You have filed multiple complaints against people in your own imagination.",
    "Your FBI career starts whenever someone replies with just 'K'.",
    "You don't need evidence. You have VIBES and they are very, very loud.",
    "Congratulations. You lost an argument that never happened.",
  ],
  nuclear: [
    "You have built a conspiracy board about someone who texts completely normally.",
    "CEO of Delulu Industries. We are sorry. And honestly, deeply impressed.",
    "Your imagination has filed 47 unnecessary complaints this week alone.",
    "You've argued with 12 imaginary people today and it's not even noon.",
    "Not a red flag. You ARE the corkboard. You ARE the red string.",
  ],
};

export const FLAG_TRAITS = {
  green:   ["Mature 🌱", "Empathetic 💚", "Trustworthy 🤝", "Emotionally Stable 🧘"],
  yellow:  ["Slightly Dramatic 🌤", "Sometimes Overthinks 🤔", "Needs Reassurance 💛", "Growing 🌱"],
  red:     ["Possessive Tendencies 🚩", "Jumps to Conclusions ⚡", "Emotionally Chaotic 🌪", "Handle with Care ⚠️"],
  nuclear: ["Professional Overthinker 🧠", "Creates Problems That Don't Exist 💀", "CEO of Delulu 👑", "Can Argue With Imaginary People 👻"],
};

export const DELUSION_LEVELS = [
  { max: 20,  label: "Totally Normal",            color: "#68D2A7" },
  { max: 40,  label: "Minor Delulu",              color: "#A8D468" },
  { max: 60,  label: "Suspiciously Delulu",       color: "#FFD84D" },
  { max: 80,  label: "Advanced Overthinker",      color: "#FF8C42" },
  { max: 100, label: "CEO OF DELULU INDUSTRIES",  color: "#C44BFF" },
];
