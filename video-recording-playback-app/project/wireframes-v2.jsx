/* global React, ReactDOM, DCSection, DCArtboard, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle */
const { useState, useEffect, useRef } = React;

/* ===== sketch primitives (same as v1, trimmed) ===== */
const SkRect = ({ w, h, fill = "transparent", stroke = "var(--ink)", sw = 2, rx = 6, dash, style }) => {
  const j = () => (Math.random() - 0.5) * 1.6;
  const x1=1+j(),y1=1+j(),x2=w-1+j(),y2=1+j(),x3=w-1+j(),y3=h-1+j(),x4=1+j(),y4=h-1+j();
  const d = `M ${x1} ${y1+rx} Q ${x1} ${y1}, ${x1+rx} ${y1} L ${x2-rx} ${y2} Q ${x2} ${y2}, ${x2} ${y2+rx} L ${x3} ${y3-rx} Q ${x3} ${y3}, ${x3-rx} ${y3} L ${x4+rx} ${y4} Q ${x4} ${y4}, ${x4} ${y4-rx} Z`;
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, pointerEvents: "none", ...style }}>
      <path d={d} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
    </svg>
  );
};

const Sketch = ({ children, fill = "transparent", stroke, sw = 2, rx = 6, dash, style, ...rest }) => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const update = () => {
      const r = ref.current.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", ...style }} {...rest}>
      {size.w > 0 && <SkRect w={size.w} h={size.h} fill={fill} stroke={stroke} sw={sw} rx={rx} dash={dash} />}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
};

const Hatch = ({ style, label, id }) => (
  <div className="sk-hatch" style={style}>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id={`h-${id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--ink-soft)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#h-${id})`} opacity="0.5" />
    </svg>
    {label && <span className="sk-hatch-label">{label}</span>}
  </div>
);

const Squiggle = ({ width = 80, color = "var(--ink-soft)" }) => (
  <svg width={width} height="6" style={{ display: "block" }}>
    <path d={`M 2 3 Q ${width*0.15} 0, ${width*0.3} 3 T ${width*0.6} 3 T ${width*0.9} 3`}
      fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Note = ({ children, style, side = "right" }) => (
  <div className="sk-note" data-side={side} style={style}>
    <svg width="40" height="30" className="sk-note-arrow">
      <path d={side === "right" ? "M 38 25 Q 20 20, 5 8 L 10 6 M 5 8 L 9 14" : "M 2 25 Q 20 20, 35 8 L 30 6 M 35 8 L 31 14"}
        fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span>{children}</span>
  </div>
);

/* ===== shared header ===== */
const Header = ({ active }) => (
  <header className="rec-header">
    <div className="logo">📹 diary</div>
    <nav className="rec-nav">
      <span className={active === "record" ? "" : "muted"}>record</span>
      <span className={active === "library" ? "" : "muted"}>library</span>
    </nav>
  </header>
);

/* ===== screen 1 — LIBRARY (journal timeline) ===== */
const VIDEOS = [
  { t: "small win — coffee mtg", d: "thu apr 30", len: "1:24", n: 47 },
  { t: "stuck on the auth bug", d: "wed apr 29", len: "3:02", n: 46 },
  { t: "weekend plans?", d: "tue apr 28", len: "0:48", n: 45 },
  { t: "demo walkthrough", d: "mon apr 27", len: "5:11", n: 44 },
  { t: "morning ramble", d: "sun apr 26", len: "2:33", n: 43 },
];

const ScreenLibrary = ({ showNotes }) => (
  <div className="rec lib">
    <Header active="library" />
    <div className="lib-toolbar">
      <div style={{ fontFamily: "var(--font-hand-bold)", fontSize: 26 }}>journal <span style={{ color: "var(--ink-soft)", fontFamily: "var(--font-hand)", fontSize: 18 }}>· 47 entries</span></div>
      <div style={{ flex: 1 }} />
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 14px", fontFamily: "var(--font-hand)", fontSize: 14, minWidth: 180 }}>🔍 search...</Sketch>
      <Sketch rx={50} sw={2.5} fill="var(--accent)" style={{ padding: "10px 18px", fontFamily: "var(--font-hand-bold)", fontSize: 15, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--ink)" }} /> new entry
      </Sketch>
    </div>

    <div className="lib-timeline">
      {[
        { day: "this week", items: VIDEOS.slice(0, 3) },
        { day: "last week", items: VIDEOS.slice(3, 5) },
      ].map((group, gi) => (
        <div key={gi} className="lib-tl-group">
          <div className="lib-tl-day">
            <Squiggle width={40} />
            <span>{group.day}</span>
            <Squiggle width={300} />
          </div>
          {group.items.map((v, i) => (
            <Sketch key={i} rx={8} sw={2} style={{ padding: 12, display: "flex", gap: 14, alignItems: "center", marginBottom: 10 }}>
              <div style={{ position: "relative", width: 130, height: 80, flexShrink: 0 }}>
                <Hatch id={`l${gi}${i}`} label="" style={{ position: "absolute", inset: 0, borderRadius: 6 }} />
                <Sketch rx={6} sw={1.5} style={{ position: "absolute", inset: 0 }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>▶</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-hand-bold)", fontSize: 18 }}>#{v.n} — {v.t}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>{v.d} · {v.len}</div>
              </div>
              <div style={{ fontFamily: "var(--font-hand)", fontSize: 18, color: "var(--ink-soft)" }}>···</div>
            </Sketch>
          ))}
        </div>
      ))}
    </div>

    {showNotes && <>
      <Note style={{ position: "absolute", top: 24, right: -150 }}>"new entry" anchors the action</Note>
      <Note side="left" style={{ position: "absolute", top: 160, left: -150 }}>grouped by date — diary feel</Note>
    </>}
  </div>
);

/* ===== screen 2 — RECORD IDLE (prompt + cam, pre-record) ===== */
const ScreenRecordIdle = ({ showNotes }) => (
  <div className="rec">
    <Header active="record" />

    <div className="rec-split">
      <div className="rec-prompt">
        <div style={{ fontFamily: "var(--font-hand-bold)", fontSize: 22 }}>today's prompt</div>
        <Squiggle width={120} />
        <div style={{ fontFamily: "var(--font-hand)", fontSize: 28, lineHeight: 1.3, marginTop: 16 }}>
          what's one small win<br/>from today?
        </div>
        <div style={{ fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--ink-soft)", marginTop: 12, fontStyle: "italic" }}>
          or skip it — talk about anything.
        </div>
        <Sketch rx={6} sw={1.5} style={{ marginTop: "auto", padding: "10px 14px", fontFamily: "var(--font-hand)", fontSize: 14, alignSelf: "flex-start", background: "var(--paper)" }}>
          🎲 new prompt
        </Sketch>
      </div>

      <div className="rec-cam">
        <Hatch id="ridle" label="WEBCAM PREVIEW" style={{ position: "absolute", inset: 0, borderRadius: 10 }} />
        <Sketch rx={10} style={{ position: "absolute", inset: 0 }} />
        <Sketch rx={6} sw={1.5} style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", fontFamily: "var(--font-hand)", fontSize: 12, background: "var(--paper)" }}>
          ● ready
        </Sketch>
        <div className="rec-timer-sm">— : — / 5:00</div>
      </div>
    </div>

    <div className="rec-controls" style={{ justifyContent: "center", gap: 24 }}>
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>🎤 mic ▾</Sketch>
      <div className="rec-record-btn-wrap">
        <Sketch rx={50} sw={3} fill="var(--accent)" style={{ width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--ink)" }} />
        </Sketch>
        <div style={{ fontFamily: "var(--font-hand)", fontSize: 12, marginTop: 6 }}>tap to record</div>
      </div>
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>📷 cam ▾</Sketch>
    </div>

    {showNotes && <>
      <Note side="left" style={{ position: "absolute", top: 130, left: -150 }}>prompt = less staring</Note>
      <Note style={{ position: "absolute", top: 130, right: -130 }}>idle: clean preview</Note>
    </>}
  </div>
);

/* ===== screen 3 — COUNTDOWN (3·2·1) ===== */
const ScreenCountdown = ({ showNotes, count = 3 }) => (
  <div className="rec">
    <Header active="record" />

    <div className="rec-split">
      <div className="rec-prompt" style={{ opacity: 0.4 }}>
        <div style={{ fontFamily: "var(--font-hand-bold)", fontSize: 22 }}>today's prompt</div>
        <Squiggle width={120} />
        <div style={{ fontFamily: "var(--font-hand)", fontSize: 28, lineHeight: 1.3, marginTop: 16 }}>
          what's one small win<br/>from today?
        </div>
      </div>

      <div className="rec-cam" style={{ position: "relative" }}>
        <Hatch id="rcd" label="" style={{ position: "absolute", inset: 0, borderRadius: 10 }} />
        <Sketch rx={10} sw={3} stroke="var(--accent)" style={{ position: "absolute", inset: 0 }} />

        {/* Big countdown number */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontFamily: "var(--font-hand-bold)", fontSize: 200, lineHeight: 1, color: "var(--ink)", textShadow: "4px 4px 0 var(--accent)" }}>
            {count}
          </div>
          <div style={{ fontFamily: "var(--font-hand)", fontSize: 20, color: "var(--ink-soft)", marginTop: 8 }}>
            get ready...
          </div>
        </div>

        {/* dots showing 3·2·1 progress */}
        <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10 }}>
          {[3, 2, 1].map(n => (
            <div key={n} style={{
              width: 14, height: 14, borderRadius: "50%",
              background: n === count ? "var(--accent)" : "var(--paper)",
              border: "2px solid var(--ink)"
            }} />
          ))}
        </div>
      </div>
    </div>

    <div className="rec-controls" style={{ justifyContent: "center", gap: 24 }}>
      <Sketch rx={50} sw={2} style={{ padding: "10px 22px", fontFamily: "var(--font-hand)", fontSize: 15, cursor: "pointer" }}>
        ✕ cancel
      </Sketch>
    </div>

    {showNotes && <>
      <Note style={{ position: "absolute", top: 240, right: -130 }}>big number = no surprises</Note>
      <Note side="left" style={{ position: "absolute", bottom: 60, left: -150 }}>only "cancel" — fewer choices</Note>
    </>}
  </div>
);

/* ===== flow arrow between screens ===== */
const FlowArrow = ({ label }) => (
  <div className="flow-arrow">
    <svg width="80" height="60" viewBox="0 0 80 60">
      <path d="M 4 30 Q 30 20, 60 30 L 54 24 M 60 30 L 54 36"
        fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <div className="flow-arrow-label">{label}</div>
  </div>
);

/* ===== ROOT ===== */
const ACCENTS = {
  coral: { accent: "#FF8A6B", soft: "#FFD9CD" },
  mint:  { accent: "#9FE3C0", soft: "#DCF5E8" },
  sky:   { accent: "#A9D4F2", soft: "#DDEEF9" },
  butter:{ accent: "#FFD86B", soft: "#FFEFC2" },
};
const FONTS = {
  caveat: { hand: "'Caveat', cursive", handBold: "'Caveat', cursive" },
  kalam:  { hand: "'Kalam', cursive", handBold: "'Kalam', cursive" },
  patrick:{ hand: "'Patrick Hand', cursive", handBold: "'Patrick Hand SC', cursive" },
};

function App() {
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "accent": "coral",
    "font": "kalam",
    "showNotes": true,
    "paperBg": true,
    "countdown": 3
  }/*EDITMODE-END*/);

  const a = ACCENTS[tweaks.accent] || ACCENTS.coral;
  const f = FONTS[tweaks.font] || FONTS.kalam;

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", a.accent);
    document.documentElement.style.setProperty("--accent-soft", a.soft);
    document.documentElement.style.setProperty("--font-hand", f.hand);
    document.documentElement.style.setProperty("--font-hand-bold", f.handBold);
    document.documentElement.style.setProperty("--paper", tweaks.paperBg ? "#FBF7F0" : "#FFFFFF");
  }, [tweaks]);

  const showNotes = tweaks.showNotes;

  return (
    <>
      <design-canvas-root>
        <DCSection id="flow" title="B → B flow · journal → record idle → countdown">
          <DCArtboard id="s1-library" label="① library (journal timeline)" width={1100} height={680}>
            <ScreenLibrary showNotes={showNotes} />
          </DCArtboard>
          <DCArtboard id="s2-idle" label="② record · idle (prompt + cam)" width={1000} height={680}>
            <ScreenRecordIdle showNotes={showNotes} />
          </DCArtboard>
          <DCArtboard id="s3-countdown" label="③ record · countdown" width={1000} height={680}>
            <ScreenCountdown showNotes={showNotes} count={tweaks.countdown} />
          </DCArtboard>
        </DCSection>
      </design-canvas-root>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Accent">
          <TweakRadio
            value={tweaks.accent}
            onChange={(v) => setTweak("accent", v)}
            options={[
              { value: "coral", label: "coral" },
              { value: "mint", label: "mint" },
              { value: "sky", label: "sky" },
              { value: "butter", label: "butter" },
            ]}
          />
        </TweakSection>
        <TweakSection title="Handwriting">
          <TweakRadio
            value={tweaks.font}
            onChange={(v) => setTweak("font", v)}
            options={[
              { value: "kalam", label: "Kalam" },
              { value: "caveat", label: "Caveat" },
              { value: "patrick", label: "Patrick" },
            ]}
          />
        </TweakSection>
        <TweakSection title="Countdown frame">
          <TweakRadio
            value={String(tweaks.countdown)}
            onChange={(v) => setTweak("countdown", Number(v))}
            options={[
              { value: "3", label: "3" },
              { value: "2", label: "2" },
              { value: "1", label: "1" },
            ]}
          />
        </TweakSection>
        <TweakSection title="Display">
          <TweakToggle label="Show annotations" checked={tweaks.showNotes} onChange={(v) => setTweak("showNotes", v)} />
          <TweakToggle label="Paper background" checked={tweaks.paperBg} onChange={(v) => setTweak("paperBg", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
