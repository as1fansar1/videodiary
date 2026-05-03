/* global React, ReactDOM, DCSection, DCArtboard, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle, TweakColor */
const { useState, useEffect } = React;

/* =========================================================================
   SKETCH PRIMITIVES
   ========================================================================= */

const Box = ({ children, style, className = "", as: As = "div", ...rest }) => (
  <As className={"sk-box " + className} style={style} {...rest}>{children}</As>
);

// Hand-drawn looking rectangle (svg) so borders are wobbly
const SkRect = ({ w, h, fill = "transparent", stroke = "var(--ink)", sw = 2, rx = 6, dash, style }) => {
  // Add slight jitter to corners
  const j = () => (Math.random() - 0.5) * 1.6;
  const x1 = 1 + j(), y1 = 1 + j();
  const x2 = w - 1 + j(), y2 = 1 + j();
  const x3 = w - 1 + j(), y3 = h - 1 + j();
  const x4 = 1 + j(), y4 = h - 1 + j();
  const d = `M ${x1} ${y1+rx} Q ${x1} ${y1}, ${x1+rx} ${y1} L ${x2-rx} ${y2} Q ${x2} ${y2}, ${x2} ${y2+rx} L ${x3} ${y3-rx} Q ${x3} ${y3}, ${x3-rx} ${y3} L ${x4+rx} ${y4} Q ${x4} ${y4}, ${x4} ${y4-rx} Z`;
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, pointerEvents: "none", ...style }}>
      <path d={d} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
    </svg>
  );
};

// A wrapper that draws a wobbly border around its children
const Sketch = ({ children, fill = "transparent", stroke, sw = 2, rx = 6, dash, style, ...rest }) => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const ref = React.useRef(null);
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

// Hatched "image placeholder"
const Hatch = ({ style, label, accent }) => (
  <div className="sk-hatch" style={style}>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id={`h-${label?.replace(/\s/g,'')}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--ink-soft)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#h-${label?.replace(/\s/g,'')})`} opacity="0.5" />
    </svg>
    {label && <span className="sk-hatch-label">{label}</span>}
  </div>
);

// Squiggly line
const Squiggle = ({ width = 80, color = "var(--ink-soft)" }) => (
  <svg width={width} height="6" style={{ display: "block" }}>
    <path d={`M 2 3 Q ${width*0.15} 0, ${width*0.3} 3 T ${width*0.6} 3 T ${width*0.9} 3`}
      fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Annotation arrow + label
const Note = ({ children, style, side = "right" }) => (
  <div className="sk-note" data-side={side} style={style}>
    <svg width="40" height="30" className="sk-note-arrow">
      <path d={side === "right" ? "M 38 25 Q 20 20, 5 8 L 10 6 M 5 8 L 9 14" : "M 2 25 Q 20 20, 35 8 L 30 6 M 35 8 L 31 14"}
        fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span>{children}</span>
  </div>
);

// Generic button
const SkBtn = ({ children, primary, big, style, ...rest }) => (
  <Sketch
    rx={big ? 30 : 8}
    sw={primary ? 2.5 : 2}
    fill={primary ? "var(--accent)" : "transparent"}
    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      padding: big ? "14px 22px" : "8px 14px", cursor: "pointer", color: primary ? "var(--ink)" : "var(--ink)",
      fontFamily: "var(--font-hand)", fontSize: big ? 20 : 16, ...style }}
    {...rest}
  >
    {children}
  </Sketch>
);

/* =========================================================================
   RECORD PAGE DIRECTIONS
   ========================================================================= */

// A) BIG STAGE — webcam fills most of the page, fat record button at bottom
const RecordA = ({ showNotes }) => (
  <div className="rec rec-a">
    <header className="rec-header">
      <div className="logo">📹 diary</div>
      <nav className="rec-nav">
        <span>record</span>
        <span className="muted">library</span>
      </nav>
    </header>

    <div className="rec-stage">
      <Hatch label="WEBCAM PREVIEW" style={{ position: "absolute", inset: 0, borderRadius: 12 }} />
      <Sketch rx={12} sw={2} style={{ position: "absolute", inset: 0 }} />
      <div className="rec-timer">00:00</div>
      <Sketch rx={6} sw={1.5} style={{ position: "absolute", top: 18, left: 18, padding: "4px 10px", fontFamily: "var(--font-hand)", fontSize: 13 }}>
        ● ready
      </Sketch>
    </div>

    <div className="rec-controls">
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>
        🎤 mic ▾
      </Sketch>
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>
        📷 cam ▾
      </Sketch>

      <div className="rec-record-btn-wrap">
        <Sketch rx={50} sw={3} fill="var(--accent)" style={{ width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--ink)" }} />
        </Sketch>
        <div style={{ fontFamily: "var(--font-hand)", fontSize: 13, marginTop: 6, textAlign: "center" }}>tap to record</div>
      </div>

      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>
        ⏱ 3·2·1 ✓
      </Sketch>
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>
        🖥 +screen
      </Sketch>
    </div>

    {showNotes && <>
      <Note style={{ position: "absolute", top: 70, right: -150 }}>big preview = confidence check</Note>
      <Note side="left" style={{ position: "absolute", bottom: 50, left: -150 }}>fat fun record btn</Note>
    </>}
  </div>
);

// B) SPLIT — prompt/journal column on left, camera on right
const RecordB = ({ showNotes }) => (
  <div className="rec rec-b">
    <header className="rec-header">
      <div className="logo">📹 diary</div>
      <nav className="rec-nav"><span>record</span><span className="muted">library</span></nav>
    </header>

    <div className="rec-split">
      <div className="rec-prompt">
        <div style={{ fontFamily: "var(--font-hand-bold)", fontSize: 22 }}>today's prompt</div>
        <Squiggle width={120} />
        <div style={{ fontFamily: "var(--font-hand)", fontSize: 28, lineHeight: 1.3, marginTop: 16 }}>
          what's one small win <br/>from today?
        </div>
        <Sketch rx={6} sw={1.5} style={{ marginTop: "auto", padding: "10px 14px", fontFamily: "var(--font-hand)", fontSize: 14, alignSelf: "flex-start" }}>
          🎲 new prompt
        </Sketch>
      </div>

      <div className="rec-cam">
        <Hatch label="CAM" style={{ position: "absolute", inset: 0, borderRadius: 10 }} />
        <Sketch rx={10} style={{ position: "absolute", inset: 0 }} />
        <div className="rec-timer-sm">00:00 / 5:00</div>
      </div>
    </div>

    <div className="rec-controls" style={{ justifyContent: "center", gap: 24 }}>
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>🎤 mic</Sketch>
      <div className="rec-record-btn-wrap">
        <Sketch rx={50} sw={3} fill="var(--accent)" style={{ width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--ink)" }} />
        </Sketch>
      </div>
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>📷 cam</Sketch>
    </div>

    {showNotes && <>
      <Note side="left" style={{ position: "absolute", top: 110, left: -160 }}>journal prompt → less staring</Note>
      <Note style={{ position: "absolute", top: 110, right: -150 }}>cam beside, not over</Note>
    </>}
  </div>
);

// C) MINIMAL — just a giant circle camera, almost nothing else
const RecordC = ({ showNotes }) => (
  <div className="rec rec-c">
    <header className="rec-header">
      <div className="logo">📹 diary</div>
      <nav className="rec-nav"><span>record</span><span className="muted">library</span></nav>
    </header>

    <div className="rec-minimal">
      <div className="rec-circle">
        <Sketch rx={300} sw={3} style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden" }}>
          <Hatch label="CAM" style={{ position: "absolute", inset: 0, borderRadius: "50%" }} />
        </Sketch>
      </div>

      <div style={{ fontFamily: "var(--font-hand)", fontSize: 18, marginTop: 28, textAlign: "center" }}>
        thursday, april 30 — entry #47
      </div>

      <Sketch rx={50} sw={3} fill="var(--accent)" style={{ marginTop: 24, padding: "16px 36px", cursor: "pointer", fontFamily: "var(--font-hand-bold)", fontSize: 22, display: "inline-flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--ink)", display: "inline-block" }} /> start recording
      </Sketch>

      <div style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--ink-soft)", marginTop: 14 }}>
        countdown 3·2·1, then go ✨
      </div>
    </div>

    {showNotes && <Note style={{ position: "absolute", top: 200, right: -140 }}>round = warm + diary-like</Note>}
  </div>
);

// D) PIP TWO-CAM — screen recording w/ webcam picture-in-picture
const RecordD = ({ showNotes }) => (
  <div className="rec rec-d">
    <header className="rec-header">
      <div className="logo">📹 diary</div>
      <nav className="rec-nav"><span>record</span><span className="muted">library</span></nav>
    </header>

    <div className="rec-mode-tabs">
      <Sketch rx={20} sw={1.5} style={{ padding: "6px 14px", fontFamily: "var(--font-hand)", fontSize: 13 }}>face</Sketch>
      <Sketch rx={20} sw={2.5} fill="var(--accent-soft)" style={{ padding: "6px 14px", fontFamily: "var(--font-hand-bold)", fontSize: 13 }}>screen + face</Sketch>
      <Sketch rx={20} sw={1.5} style={{ padding: "6px 14px", fontFamily: "var(--font-hand)", fontSize: 13 }}>screen</Sketch>
    </div>

    <div className="rec-stage">
      <Hatch label="SCREEN SHARE" style={{ position: "absolute", inset: 0, borderRadius: 12 }} />
      <Sketch rx={12} style={{ position: "absolute", inset: 0 }} />
      <div className="rec-pip">
        <Sketch rx={80} sw={2.5} style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden" }}>
          <Hatch label="ME" style={{ position: "absolute", inset: 0, borderRadius: "50%" }} />
        </Sketch>
      </div>
      <div className="rec-timer">00:00</div>
    </div>

    <div className="rec-controls">
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>📐 pip pos ▾</Sketch>
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>🖥 window ▾</Sketch>
      <div className="rec-record-btn-wrap">
        <Sketch rx={50} sw={3} fill="var(--accent)" style={{ width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--ink)" }} />
        </Sketch>
      </div>
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>🎤 mic ▾</Sketch>
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>⏱ countdown</Sketch>
    </div>

    {showNotes && <>
      <Note side="left" style={{ position: "absolute", top: 90, left: -130 }}>mode picker up top</Note>
      <Note style={{ position: "absolute", top: 200, right: -130 }}>draggable PIP bubble</Note>
    </>}
  </div>
);

/* =========================================================================
   LIBRARY PAGE DIRECTIONS
   ========================================================================= */

const VIDEOS = [
  { t: "small win — coffee mtg", d: "thu apr 30", len: "1:24", n: 47 },
  { t: "stuck on the auth bug", d: "wed apr 29", len: "3:02", n: 46 },
  { t: "weekend plans?", d: "tue apr 28", len: "0:48", n: 45 },
  { t: "demo walkthrough", d: "mon apr 27", len: "5:11", n: 44 },
  { t: "morning ramble", d: "sun apr 26", len: "2:33", n: 43 },
  { t: "what i'm reading", d: "sat apr 25", len: "1:55", n: 42 },
  { t: "screen review of v2", d: "fri apr 24", len: "4:10", n: 41 },
  { t: "feeling good today", d: "thu apr 23", len: "0:52", n: 40 },
  { t: "ugh mondays", d: "mon apr 20", len: "1:08", n: 39 },
];

// A) GRID — playful card wall
const LibraryA = ({ showNotes }) => (
  <div className="lib lib-a">
    <header className="rec-header">
      <div className="logo">📹 diary</div>
      <nav className="rec-nav"><span className="muted">record</span><span>library</span></nav>
    </header>

    <div className="lib-toolbar">
      <div style={{ fontFamily: "var(--font-hand-bold)", fontSize: 26 }}>my videos <span style={{ color: "var(--ink-soft)", fontFamily: "var(--font-hand)", fontSize: 18 }}>· 47</span></div>
      <div style={{ flex: 1 }} />
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 14px", fontFamily: "var(--font-hand)", fontSize: 14, minWidth: 200 }}>🔍 search...</Sketch>
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>newest ▾</Sketch>
    </div>

    <div className="lib-grid">
      {VIDEOS.slice(0, 9).map((v, i) => (
        <Sketch key={i} rx={10} sw={2} style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }}>
          <div style={{ position: "relative", aspectRatio: "16/10" }}>
            <Hatch label="" style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", left: 8, top: 8, fontFamily: "var(--font-hand-bold)", fontSize: 12, background: "var(--paper)", padding: "2px 6px", border: "1.5px solid var(--ink)", borderRadius: 4 }}>#{v.n}</div>
            <div style={{ position: "absolute", right: 8, bottom: 8, fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--paper)", padding: "2px 6px", border: "1.5px solid var(--ink)", borderRadius: 4 }}>{v.len}</div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--paper)", border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>▶</div>
            </div>
          </div>
          <div style={{ padding: "8px 10px" }}>
            <div style={{ fontFamily: "var(--font-hand)", fontSize: 14, lineHeight: 1.2 }}>{v.t}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-soft)", marginTop: 2 }}>{v.d}</div>
          </div>
        </Sketch>
      ))}
    </div>

    {showNotes && <Note style={{ position: "absolute", top: 80, right: -140 }}>thumbnails = quick scan</Note>}
  </div>
);

// B) TIMELINE — vertical journal-style feed grouped by date
const LibraryB = ({ showNotes }) => (
  <div className="lib lib-b">
    <header className="rec-header">
      <div className="logo">📹 diary</div>
      <nav className="rec-nav"><span className="muted">record</span><span>library</span></nav>
    </header>

    <div className="lib-toolbar">
      <div style={{ fontFamily: "var(--font-hand-bold)", fontSize: 26 }}>journal</div>
      <div style={{ flex: 1 }} />
      <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>this week ▾</Sketch>
    </div>

    <div className="lib-timeline">
      {[
        { day: "this week", items: VIDEOS.slice(0, 3) },
        { day: "last week", items: VIDEOS.slice(3, 6) },
      ].map((group, gi) => (
        <div key={gi} className="lib-tl-group">
          <div className="lib-tl-day">
            <Squiggle width={40} />
            <span>{group.day}</span>
            <Squiggle width={300} />
          </div>
          {group.items.map((v, i) => (
            <Sketch key={i} rx={8} sw={2} style={{ padding: 12, display: "flex", gap: 14, alignItems: "center", marginBottom: 10, cursor: "pointer" }}>
              <div style={{ position: "relative", width: 130, height: 80, flexShrink: 0 }}>
                <Hatch label="" style={{ position: "absolute", inset: 0, borderRadius: 6 }} />
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

    {showNotes && <Note side="left" style={{ position: "absolute", top: 130, left: -150 }}>grouped by date = diary feel</Note>}
  </div>
);

// C) CALENDAR — month view with thumbnails on the days you recorded
const LibraryC = ({ showNotes }) => {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const recordedDays = new Set([2, 5, 9, 12, 13, 18, 22, 23, 26, 27, 28, 29, 30]);
  return (
    <div className="lib lib-c">
      <header className="rec-header">
        <div className="logo">📹 diary</div>
        <nav className="rec-nav"><span className="muted">record</span><span>library</span></nav>
      </header>

      <div className="lib-toolbar">
        <Sketch rx={8} sw={1.5} style={{ padding: "6px 10px", fontFamily: "var(--font-hand)", fontSize: 14 }}>‹</Sketch>
        <div style={{ fontFamily: "var(--font-hand-bold)", fontSize: 26 }}>april 2026</div>
        <Sketch rx={8} sw={1.5} style={{ padding: "6px 10px", fontFamily: "var(--font-hand)", fontSize: 14 }}>›</Sketch>
        <div style={{ flex: 1 }} />
        <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14 }}>13 entries · 24 min</Sketch>
      </div>

      <div className="lib-cal">
        {["sun","mon","tue","wed","thu","fri","sat"].map(d => (
          <div key={d} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-soft)", textAlign: "center", padding: "4px 0" }}>{d}</div>
        ))}
        {Array.from({ length: 3 }, (_, i) => <div key={"pad"+i} />)}
        {days.map(d => {
          const has = recordedDays.has(d);
          return (
            <Sketch key={d} rx={6} sw={has ? 2 : 1} style={{ aspectRatio: "1", position: "relative", overflow: "hidden", cursor: has ? "pointer" : "default" }} dash={has ? undefined : "3 3"}>
              <div style={{ position: "absolute", top: 4, left: 6, fontFamily: "var(--font-hand-bold)", fontSize: 13, zIndex: 2 }}>{d}</div>
              {has && <Hatch label="" style={{ position: "absolute", inset: 0 }} />}
              {has && <div style={{ position: "absolute", right: 4, bottom: 4, width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", border: "1.5px solid var(--ink)" }} />}
            </Sketch>
          );
        })}
      </div>

      {showNotes && <Note style={{ position: "absolute", top: 220, right: -140 }}>see your streak at a glance</Note>}
    </div>
  );
};

// D) PLAYER + LIST — left rail of titles, big player on right (could be detail combined)
const LibraryD = ({ showNotes }) => (
  <div className="lib lib-d">
    <header className="rec-header">
      <div className="logo">📹 diary</div>
      <nav className="rec-nav"><span className="muted">record</span><span>library</span></nav>
    </header>

    <div className="lib-pl">
      <div className="lib-pl-list">
        <Sketch rx={8} sw={1.5} style={{ padding: "8px 12px", fontFamily: "var(--font-hand)", fontSize: 14, marginBottom: 10 }}>🔍 search...</Sketch>
        {VIDEOS.slice(0, 7).map((v, i) => (
          <Sketch key={i} rx={6} sw={i === 0 ? 2.5 : 1.5} fill={i === 0 ? "var(--accent-soft)" : "transparent"} style={{ padding: "10px 12px", marginBottom: 6, cursor: "pointer" }}>
            <div style={{ fontFamily: "var(--font-hand-bold)", fontSize: 14, lineHeight: 1.2 }}>#{v.n} {v.t}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-soft)", marginTop: 2 }}>{v.d} · {v.len}</div>
          </Sketch>
        ))}
      </div>

      <div className="lib-pl-player">
        <div style={{ position: "relative", aspectRatio: "16/10" }}>
          <Hatch label="NOW PLAYING" style={{ position: "absolute", inset: 0, borderRadius: 10 }} />
          <Sketch rx={10} style={{ position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sketch rx={50} sw={3} fill="var(--accent)" style={{ width: 70, height: 70, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>▶</Sketch>
          </div>
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <Sketch rx={4} sw={1.5} style={{ flex: 1, height: 8, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "35%", background: "var(--accent)" }} />
          </Sketch>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>0:29 / 1:24</span>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: "var(--font-hand-bold)", fontSize: 22 }}>#47 — small win, coffee mtg</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>thursday, april 30 · 1:24</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <Sketch rx={6} sw={1.5} style={{ padding: "6px 12px", fontFamily: "var(--font-hand)", fontSize: 13 }}>✏️ rename</Sketch>
          <Sketch rx={6} sw={1.5} style={{ padding: "6px 12px", fontFamily: "var(--font-hand)", fontSize: 13 }}>⬇ download</Sketch>
          <Sketch rx={6} sw={1.5} style={{ padding: "6px 12px", fontFamily: "var(--font-hand)", fontSize: 13 }}>🗑 delete</Sketch>
        </div>
      </div>
    </div>

    {showNotes && <>
      <Note side="left" style={{ position: "absolute", top: 110, left: -150 }}>list + player in one</Note>
    </>}
  </div>
);

/* =========================================================================
   ROOT
   ========================================================================= */

const ACCENTS = {
  coral: { accent: "#FF8A6B", soft: "#FFD9CD" },
  mint:  { accent: "#9FE3C0", soft: "#DCF5E8" },
  sky:   { accent: "#A9D4F2", soft: "#DDEEF9" },
  butter:{ accent: "#FFD86B", soft: "#FFEFC2" },
};

const FONTS = {
  caveat: { hand: "'Caveat', cursive", handBold: "'Caveat', cursive", weight: 700 },
  kalam:  { hand: "'Kalam', cursive", handBold: "'Kalam', cursive", weight: 700 },
  patrick:{ hand: "'Patrick Hand', cursive", handBold: "'Patrick Hand SC', cursive", weight: 400 },
};

function App() {
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "accent": "coral",
    "font": "kalam",
    "showNotes": true,
    "paperBg": true
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
        <DCSection id="record" title="① record page — directions">
          <DCArtboard id="rec-a" label="A · big stage" width={900} height={620}>
            <RecordA showNotes={showNotes} />
          </DCArtboard>
          <DCArtboard id="rec-b" label="B · prompt + cam" width={900} height={620}>
            <RecordB showNotes={showNotes} />
          </DCArtboard>
          <DCArtboard id="rec-c" label="C · minimal circle" width={900} height={620}>
            <RecordC showNotes={showNotes} />
          </DCArtboard>
          <DCArtboard id="rec-d" label="D · screen + face PIP" width={900} height={620}>
            <RecordD showNotes={showNotes} />
          </DCArtboard>
        </DCSection>

        <DCSection id="library" title="② library page — directions">
          <DCArtboard id="lib-a" label="A · grid wall" width={1100} height={720}>
            <LibraryA showNotes={showNotes} />
          </DCArtboard>
          <DCArtboard id="lib-b" label="B · journal timeline" width={1100} height={720}>
            <LibraryB showNotes={showNotes} />
          </DCArtboard>
          <DCArtboard id="lib-c" label="C · calendar / streak" width={1100} height={720}>
            <LibraryC showNotes={showNotes} />
          </DCArtboard>
          <DCArtboard id="lib-d" label="D · list + player" width={1100} height={720}>
            <LibraryD showNotes={showNotes} />
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
        <TweakSection title="Display">
          <TweakToggle
            label="Show annotations"
            checked={tweaks.showNotes}
            onChange={(v) => setTweak("showNotes", v)}
          />
          <TweakToggle
            label="Paper background"
            checked={tweaks.paperBg}
            onChange={(v) => setTweak("paperBg", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
