/** 噗噗日记 — 高保真可交互原型 */

const STORAGE_KEY = "poo-diary-records-v2";
const LEGACY_KEY = "poo-diary-records-v1";

const SHAPE = {
  normal: {
    id: "normal",
    emoji: "🍌",
    label: "顺滑毕业",
    plain: "正常",
    sect: "今日门派：顺滑毕业派",
    vibe: "像香蕉一样丝滑离场，教科书级别。",
    title: "顺滑毕业生",
    theme: "theme-normal",
  },
  hard: {
    id: "hard",
    emoji: "🥖",
    label: "坚如磐石",
    plain: "偏硬",
    sect: "今日门派：坚如磐石派",
    vibe: "今天也辛苦你了，法棍选手。",
    title: "法棍选手",
    theme: "theme-hard",
  },
  loose: {
    id: "loose",
    emoji: "🌊",
    label: "洪水预警",
    plain: "偏稀",
    sect: "今日门派：洪水预警派",
    vibe: "今日流速偏快，肠道在开派对？",
    title: "流速先锋",
    theme: "theme-loose",
  },
};

const FEELINGS = [
  { id: "easy", label: "轻松顺畅 ✨", danger: false },
  { id: "strain", label: "有点用力 💪", danger: false },
  { id: "bloat", label: "肚子胀胀 🎈", danger: false },
  { id: "pain", label: "轻微不适 😣", danger: false },
  { id: "severe", label: "剧痛警报 🚨", danger: true },
  { id: "blood", label: "见血了 🩸", danger: true },
];

const WEEK_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

/** 一日多次：次数越高越夸张（不直接晒具体数字给外人） */
const MULTI_COPY = {
  2: {
    emoji: "⚡",
    title: "二连击达成！",
    sub: "肠道今日开启加班模式，厕所门都快被你摸出包浆了。",
    tag: "称号升级：厕所回头客",
    theme: "theme-multi-2",
    confetti: 56,
    shake: true,
  },
  3: {
    emoji: "🔥",
    title: "三连冠！！",
    sub: "今日份「噗噗马拉松」正式开跑，裁判已举手示意：太猛了。",
    tag: "称号升级：一日三噗达人",
    theme: "theme-multi-3",
    confetti: 72,
    shake: true,
    flash: true,
  },
  4: {
    emoji: "🚀",
    title: "四连爆！！！",
    sub: "地球核心都震了三下。建议给马桶发个锦旗：服务之星。",
    tag: "传说称号：马桶常驻嘉宾",
    theme: "theme-multi-4",
    confetti: 90,
    shake: true,
    flash: true,
    pulse: true,
  },
  5: {
    emoji: "👑",
    title: "五连神话！！！！",
    sub: "今日已进入「传说难度」。肠道：我真的会谢。宇宙：收到。",
    tag: "隐藏称号：银河噗噗王",
    theme: "theme-multi-5",
    confetti: 110,
    shake: true,
    flash: true,
    pulse: true,
  },
};

/* ---------- utils ---------- */

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatCNDate(d = new Date()) {
  const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 · 周${week}`;
}

function formatShortDate(key) {
  const [, m, d] = key.split("-");
  return `${Number(m)}月${Number(d)}日`;
}

function startOfWeek(d = new Date()) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const s = new Date(d);
  s.setDate(d.getDate() + diff);
  s.setHours(0, 0, 0, 0);
  return s;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function uid() {
  return `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeDay(raw, key) {
  if (!raw) return null;
  if (Array.isArray(raw.entries)) {
    return {
      date: key,
      status: raw.status,
      entries: raw.entries,
      remindAt: raw.remindAt,
      updatedAt: raw.updatedAt || Date.now(),
    };
  }
  // migrate v1 flat record
  if (raw.status === "done") {
    return {
      date: key,
      status: "done",
      entries: [
        {
          id: uid(),
          shape: raw.shape || "normal",
          feelings: raw.feelings || [],
          at: raw.updatedAt || Date.now(),
        },
      ],
      updatedAt: raw.updatedAt || Date.now(),
    };
  }
  return {
    date: key,
    status: raw.status || "skipped",
    entries: [],
    remindAt: raw.remindAt,
    updatedAt: raw.updatedAt || Date.now(),
  };
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const out = {};
    Object.keys(parsed).forEach((k) => {
      out[k] = normalizeDay(parsed[k], k);
    });
    return out;
  } catch {
    return {};
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.hidden = true;
  }, 1800);
}

function burstConfetti(layer, count = 36) {
  layer.innerHTML = "";
  const colors = ["#ff5d8f", "#ffc93c", "#5fbf7a", "#74c0fc", "#ff7a59", "#fff", "#c77dff"];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "confetti";
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = `${1.2 + Math.random() * 1.6}s`;
    p.style.animationDelay = `${Math.random() * 0.4}s`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    p.style.width = `${6 + Math.random() * 10}px`;
    p.style.height = `${8 + Math.random() * 12}px`;
    layer.appendChild(p);
  }
}

function entryCount(day) {
  if (!day || day.status !== "done") return 0;
  return day.entries?.length || 0;
}

function latestEntry(day) {
  if (!day?.entries?.length) return null;
  return day.entries[day.entries.length - 1];
}

function dominantShape(day) {
  if (!day?.entries?.length) return null;
  const tally = {};
  day.entries.forEach((e) => {
    tally[e.shape] = (tally[e.shape] || 0) + 1;
  });
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
}

function markForDay(day) {
  if (!day) return "";
  if (day.status === "skipped") return "🌿";
  if (day.status !== "done") return "";
  const shape = dominantShape(day) || latestEntry(day)?.shape;
  return shape === "hard" ? "🥖" : shape === "loose" ? "🌊" : "💩";
}

function multiTier(n) {
  if (n >= 5) return MULTI_COPY[5];
  return MULTI_COPY[n] || null;
}

/* ---------- insights / titles (privacy-aware) ---------- */

function getDoneDays(records) {
  return Object.values(records)
    .filter((r) => r.status === "done" && entryCount(r) > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function flattenRecentEntries(records, dayLimit = 7) {
  const days = getDoneDays(records).slice(0, dayLimit);
  const entries = [];
  days.forEach((day) => {
    (day.entries || []).forEach((e) => entries.push({ ...e, date: day.date }));
  });
  return entries;
}

function buildInsight(records) {
  const recentDays = getDoneDays(records).slice(0, 3);
  const recentEntries = flattenRecentEntries(records, 7);
  const lastShapes = recentDays.map((d) => dominantShape(d) || latestEntry(d)?.shape);
  const hardCount = lastShapes.filter((s) => s === "hard").length;
  const looseCount = lastShapes.filter((s) => s === "loose").length;
  const strainCount = recentEntries.filter((e) =>
    (e.feelings || []).some((f) => f === "strain" || f === "bloat")
  ).length;
  const doneDays = getDoneDays(records).length;
  const today = records[dateKey()];
  const todayN = entryCount(today);

  if (
    recentEntries.some((e) => (e.feelings || []).some((f) => f === "blood" || f === "severe"))
  ) {
    return {
      quote: "肚肚今天想认真说两句",
      body: "近期出现过剧痛或见血信号。噗噗不诊断，但请尽快就医确认，别硬扛。",
      tip: "先停掉「硬撑文学」，去看医生。",
      trend: "需关注",
      mood: "warn",
      title: "认真模式开启者",
    };
  }

  if (todayN >= 2) {
    const honor = todayHonorTitle(today);
    const quote =
      todayN >= 4 ? "今日活跃度：传说级" : todayN >= 3 ? "今日活跃度：马拉松" : "今日已开启二连模式";
    const body =
      todayN >= 3
        ? "今天肠道特别勤快。多补水、清淡一点，让它也有下班时间。"
        : "回头客已就位。补水续上，别把厕所当公司工位。";
    return {
      quote,
      body,
      tip: "温水续杯，少挑战黑暗料理",
      trend: "今日超活跃",
      mood: "multi",
      title: honor.title,
    };
  }

  if (hardCount >= 2) {
    return {
      quote: "近几天偏硬居多",
      body: "法棍连击中……水杯续上，蔬菜加个钟。肠道也想躺平变香蕉。",
      tip: "今天多喝水 + 多嚼两口绿叶菜",
      trend: "偏硬倾向",
      mood: "hard",
      title: "法棍选手",
    };
  }

  if (looseCount >= 2) {
    return {
      quote: "近几天流速偏快",
      body: "洪水预警连播。先别挑战黑暗料理，清淡一点，让肠道下班休息。",
      tip: "少油少辣，温水续杯",
      trend: "偏稀倾向",
      mood: "loose",
      title: "流速先锋",
    };
  }

  if (strainCount >= 2) {
    return {
      quote: "最近用力次数有点多",
      body: "别把厕所当健身房。放松肩膀，给足时间，必要时散个小步。",
      tip: "饭后散步 10 分钟试试",
      trend: "用力偏多",
      mood: "care",
      title: "温柔对待派",
    };
  }

  if (recentDays.length === 0) {
    return {
      quote: "肚肚日报等你签收",
      body: "还没有足够样本。先打卡几天，噗噗才能开始说人话。",
      tip: "连续记录几天，趋势会更准",
      trend: "刚起步",
      mood: "neutral",
      title: "新手观察员",
    };
  }

  return {
    quote: "近期发挥很稳",
    body: "肠道状态整体在线。继续保持水分和纤维，别让加班把节奏打乱。",
    tip: "稳住，我们能赢过便秘和腹泻",
    trend: `已打卡 ${doneDays} 天`,
    mood: "good",
    title: "稳如老登",
  };
}

function weekHonorTitle(records) {
  const start = startOfWeek(new Date());
  const shapes = [];
  let activeDays = 0;
  let multiDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const day = records[dateKey(d)];
    if (day?.status === "done" && entryCount(day) > 0) {
      activeDays += 1;
      shapes.push(dominantShape(day));
      if (entryCount(day) >= 2) multiDays += 1;
    }
  }
  if (activeDays === 0) return { title: "本周潜水员", emoji: "🫧", line: "本周还在蓄力，下周见真章。" };
  if (multiDays >= 2) return { title: "本周厕所常客", emoji: "🎟️", line: "活跃得像办了月卡，记得补水。" };
  const hard = shapes.filter((s) => s === "hard").length;
  const loose = shapes.filter((s) => s === "loose").length;
  const normal = shapes.filter((s) => s === "normal").length;
  if (hard >= Math.ceil(activeDays / 2))
    return { title: "本周法棍选手", emoji: "🥖", line: "坚如磐石周，水杯请就位。" };
  if (loose >= Math.ceil(activeDays / 2))
    return { title: "本周流速先锋", emoji: "🌊", line: "水流偏快周，清淡饮食护航。" };
  if (normal >= Math.ceil(activeDays / 2))
    return { title: "本周顺滑毕业生", emoji: "🍌", line: "教科书发挥，继续保持。" };
  return { title: "本周均衡选手", emoji: "✨", line: "形态百花齐放，肠道在写散文。" };
}

function todayHonorTitle(day) {
  if (!day || day.status === "skipped") return { title: "今日蓄力中", emoji: "🌿" };
  const n = entryCount(day);
  if (n >= 5) return { title: "银河噗噗王", emoji: "👑" };
  if (n >= 4) return { title: "马桶常驻嘉宾", emoji: "🚀" };
  if (n >= 3) return { title: "一日三噗达人", emoji: "🔥" };
  if (n >= 2) return { title: "厕所回头客", emoji: "⚡" };
  const shape = dominantShape(day) || latestEntry(day)?.shape;
  return {
    title: SHAPE[shape]?.title || "今日已送达",
    emoji: SHAPE[shape]?.emoji || "💩",
  };
}

/* ---------- app state ---------- */

const state = {
  tab: "today",
  records: loadRecords(),
  flow: null, // { step, shape, feelings, mode: 'create'|'append'|'edit' }
  calMonth: new Date(),
  selectedDay: dateKey(),
  feedback: null,
  shareMode: "today", // today | week
};

function todayRecord() {
  return state.records[dateKey()] || null;
}

function setDay(key, day) {
  state.records[key] = { ...day, date: key, updatedAt: Date.now() };
  saveRecords(state.records);
}

function seedDemoIfEmpty() {
  if (Object.keys(state.records).length > 0) {
    saveRecords(state.records); // persist migrated
    return;
  }
  const today = new Date();
  const samples = [
    { offset: -1, status: "done", entries: [{ shape: "normal", feelings: ["easy"] }] },
    {
      offset: -2,
      status: "done",
      entries: [
        { shape: "hard", feelings: ["strain"] },
        { shape: "hard", feelings: ["bloat"] },
      ],
    },
    { offset: -3, status: "skipped", entries: [] },
    { offset: -4, status: "done", entries: [{ shape: "normal", feelings: ["easy"] }] },
    { offset: -5, status: "done", entries: [{ shape: "loose", feelings: ["bloat"] }] },
    {
      offset: -6,
      status: "done",
      entries: [{ shape: "hard", feelings: ["strain", "bloat"] }],
    },
  ];
  samples.forEach((s) => {
    const d = new Date(today);
    d.setDate(today.getDate() + s.offset);
    const key = dateKey(d);
    state.records[key] = {
      date: key,
      status: s.status,
      entries: (s.entries || []).map((e, i) => ({
        id: uid(),
        shape: e.shape,
        feelings: e.feelings || [],
        at: Date.now() + s.offset * 1000 + i,
      })),
      updatedAt: Date.now() + s.offset,
    };
  });
  saveRecords(state.records);
}

/* ---------- feedback overlay ---------- */

function showFeedback(payload) {
  const overlay = document.getElementById("feedback-overlay");
  const content = document.getElementById("feedback-content");
  const confetti = document.getElementById("confetti-layer");

  overlay.hidden = false;
  const extras = [
    payload.shake ? "is-shake" : "",
    payload.flash ? "is-flash" : "",
    payload.pulse ? "is-pulse" : "",
  ]
    .filter(Boolean)
    .join(" ");
  overlay.className = `feedback-overlay ${payload.theme || ""} ${extras}`.trim();
  content.innerHTML = `
    <div class="feedback-emoji ${payload.pulse ? "emoji-pulse" : ""}">${payload.emoji}</div>
    <h2 class="feedback-title">${payload.title}</h2>
    <p class="feedback-sub">${payload.sub}</p>
    ${payload.tag ? `<div class="feedback-tag">${payload.tag}</div>` : ""}
    <div class="feedback-actions">
      ${
        payload.primary
          ? `<button class="btn btn-primary" type="button" data-fb="primary">${payload.primary}</button>`
          : ""
      }
      ${
        payload.secondary
          ? `<button class="btn btn-secondary" type="button" data-fb="secondary">${payload.secondary}</button>`
          : ""
      }
    </div>
  `;

  if (payload.confetti) burstConfetti(confetti, payload.confetti);
  else confetti.innerHTML = "";

  state.feedback = payload;

  content.querySelectorAll("[data-fb]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-fb");
      hideFeedback();
      if (action === "primary" && payload.onPrimary) payload.onPrimary();
      if (action === "secondary" && payload.onSecondary) payload.onSecondary();
    });
  });
}

function hideFeedback() {
  const overlay = document.getElementById("feedback-overlay");
  overlay.hidden = true;
  overlay.className = "feedback-overlay";
  document.getElementById("confetti-layer").innerHTML = "";
  state.feedback = null;
}

/* ---------- week strip ---------- */

function renderWeekStrip() {
  const start = startOfWeek(new Date());
  const cells = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dateKey(d);
    const rec = state.records[key];
    const isToday = key === dateKey();
    const n = entryCount(rec);
    let mark = "·";
    let cls = "week-dot";
    if (isToday) cls += " today";
    if (rec?.status === "done" && n > 0) {
      mark = markForDay(rec);
      cls += " done";
      if (n >= 2) cls += " multi";
    } else if (rec?.status === "skipped") {
      mark = "🌿";
      cls += " miss";
    } else if (isToday) {
      mark = "❓";
    }
    cells.push(`
      <div class="week-day">
        <span class="week-label">周${WEEK_LABELS[i]}</span>
        <div class="${cls}" title="${key}">
          ${mark}
          ${n >= 2 ? `<span class="count-badge">×${n}</span>` : ""}
        </div>
      </div>
    `);
  }
  return `<div class="week-strip">${cells.join("")}</div>`;
}

function weekProgressLabel() {
  const start = startOfWeek(new Date());
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const rec = state.records[dateKey(d)];
    if (rec?.status === "done" || rec?.status === "skipped") done += 1;
  }
  return `${done}/7`;
}

/* ---------- today flows ---------- */

function flowSubtitle() {
  const mode = state.flow?.mode;
  if (mode === "append") return "再记一笔 · 形态确认";
  if (mode === "edit") return "改最近一笔 · 形态确认";
  return "选完立刻发奖状";
}

function renderTodayPrompt() {
  return `
    <div class="page" id="page-today">
      <div class="top-row">
        <div class="brand">
          <div class="brand-name">噗噗日记</div>
          <div class="brand-sub">${formatCNDate()}</div>
        </div>
        <div class="pill">本周进度 ${weekProgressLabel()}</div>
      </div>
      ${renderWeekStrip()}
      <div class="hero">
        <div class="hero-mascot">💩</div>
        <h1 class="hero-title">今天，噗了吗？</h1>
        <p class="hero-sub">肚肚日报等你签收 · 十秒搞定</p>
      </div>
      <div class="action-stack">
        <button class="btn btn-primary" type="button" data-action="yes">噗了！💩</button>
        <button class="btn btn-secondary" type="button" data-action="no">还没呢 🌿</button>
      </div>
    </div>
  `;
}

function renderShapeStep() {
  return `
    <div class="page" id="page-today">
      <div class="top-row">
        <div class="brand">
          <div class="brand-name">形态是哪一卦？</div>
          <div class="brand-sub">${flowSubtitle()}</div>
        </div>
        <button class="pill" type="button" data-action="back-home">返回</button>
      </div>
      <div class="progress-dots" aria-hidden="true">
        <span class="on"></span><span></span><span></span>
      </div>
      <p class="step-caption">先锁定形态，再决定要不要补充感受</p>
      <div class="hero" style="justify-content:flex-start;padding-top:8px">
        <div class="choice-grid cols-3" style="width:100%">
          ${Object.values(SHAPE)
            .map(
              (s) => `
            <button class="choice-card" type="button" data-shape="${s.id}">
              <span class="emoji">${s.emoji}</span>
              <span class="label">${s.label}</span>
              <span class="hint">${s.plain}</span>
            </button>
          `
            )
            .join("")}
        </div>
      </div>
      <p class="footer-note">文案再夸张，也不替代医疗建议哦</p>
    </div>
  `;
}

function renderFeelingStep() {
  const selected = new Set(state.flow?.feelings || []);
  const shape = SHAPE[state.flow?.shape];
  return `
    <div class="page" id="page-today">
      <div class="top-row">
        <div class="brand">
          <div class="brand-name">身体有话说？</div>
          <div class="brand-sub">${shape ? `${shape.emoji} 已锁定「${shape.label}」` : "可选补充"}</div>
        </div>
        <button class="pill" type="button" data-action="skip-feel">跳过</button>
      </div>
      <div class="progress-dots" aria-hidden="true">
        <span class="on"></span><span class="on"></span><span></span>
      </div>
      <p class="step-caption">可多选；若有剧痛/见血，会切换认真提醒</p>
      <div class="hero" style="justify-content:center">
        <div class="chip-row">
          ${FEELINGS.map(
            (f) => `
            <button class="chip ${f.danger ? "danger" : ""} ${selected.has(f.id) ? "on" : ""}"
              type="button" data-feel="${f.id}">${f.label}</button>
          `
          ).join("")}
        </div>
      </div>
      <div class="action-stack">
        <button class="btn btn-accent" type="button" data-action="submit-feel">就这样，交差！🎉</button>
      </div>
    </div>
  `;
}

function renderTodayDone() {
  const rec = todayRecord();
  const insight = buildInsight(state.records);
  const latest = latestEntry(rec);
  const shape = latest?.shape ? SHAPE[latest.shape] : null;
  const n = entryCount(rec);
  const honor = todayHonorTitle(rec);
  const skipped = rec?.status === "skipped";

  return `
    <div class="page" id="page-today">
      <div class="top-row">
        <div class="brand">
          <div class="brand-name">${skipped ? "今日暂未送达" : "今日已送达 √"}</div>
          <div class="brand-sub">${formatCNDate()}${!skipped && n > 1 ? ` · 今日 ${n} 笔` : ""}</div>
        </div>
        <button class="pill" type="button" data-action="share">分享 ✨</button>
      </div>
      ${renderWeekStrip()}
      <div class="insight-card">
        <p class="section-sub">肚肚今天有话说</p>
        <h2 class="insight-quote">${skipped ? "没事，不催不卷" : insight.quote}</h2>
        <p class="insight-body">${
          skipped
            ? "晚上再轻轻提醒你一声。若其实已经噗了，随时可以补记。"
            : insight.body
        }</p>
        <div class="stat-row">
          <div class="stat">
            <div class="stat-label">${skipped ? "今日状态" : n > 1 ? "最近一笔" : "今日形态"}</div>
            <div class="stat-value">${
              skipped
                ? "🌿 蓄力中"
                : shape
                  ? `${shape.emoji} ${shape.label}`
                  : "已记录"
            }</div>
          </div>
          <div class="stat alt">
            <div class="stat-label">${skipped ? "今晚提醒" : "今日称号"}</div>
            <div class="stat-value">${skipped ? "20:00" : `${honor.emoji} ${honor.title}`}</div>
          </div>
        </div>
        <p class="insight-body" style="margin-top:auto">💡 ${skipped ? "想起来了就记一笔，不晚" : insight.tip}</p>
      </div>
      <div class="mini-actions">
        ${
          skipped
            ? `<button class="btn btn-primary" type="button" data-action="yes" style="grid-column:1/-1">其实噗了！💩</button>`
            : `
          <button class="btn btn-accent" type="button" data-action="append">再记一笔 ⚡</button>
          <button class="btn btn-secondary" type="button" data-action="go-calendar">看日历 📅</button>
        `
        }
      </div>
    </div>
  `;
}

function renderToday() {
  if (state.flow?.step === "shape") return renderShapeStep();
  if (state.flow?.step === "feel") return renderFeelingStep();
  const rec = todayRecord();
  if (rec && (rec.status === "done" || rec.status === "skipped") && !state.flow) {
    return renderTodayDone();
  }
  return renderTodayPrompt();
}

/* ---------- calendar ---------- */

function renderCalendar() {
  const year = state.calMonth.getFullYear();
  const month = state.calMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const total = daysInMonth(year, month);
  const selected = state.selectedDay;
  const selectedRec = state.records[selected];

  const dows = WEEK_LABELS.map((w) => `<div class="cal-dow">${w}</div>`).join("");
  const blanks = Array.from({ length: offset }, () => `<div class="cal-cell empty"></div>`).join(
    ""
  );

  const days = [];
  for (let d = 1; d <= total; d++) {
    const key = `${year}-${pad(month + 1)}-${pad(d)}`;
    const rec = state.records[key];
    const n = entryCount(rec);
    const mark = markForDay(rec);
    const cls = [
      "cal-cell",
      key === dateKey() ? "today" : "",
      key === selected ? "selected" : "",
      n >= 2 ? "multi" : "",
    ]
      .filter(Boolean)
      .join(" ");
    days.push(`
      <button class="${cls}" type="button" data-day="${key}">
        <span class="day-num">${d}</span>
        <span class="mark">${mark || "&nbsp;"}</span>
        ${n >= 2 ? `<span class="cal-count">×${n}</span>` : ""}
      </button>
    `);
  }

  let detailTitle = "点选一天看看";
  let detailBody = "有记录的日子会亮起 emoji；一天多笔会显示 ×N。";
  if (selectedRec?.status === "done" && entryCount(selectedRec) > 0) {
    const n = entryCount(selectedRec);
    const honor = todayHonorTitle(selectedRec);
    const lines = selectedRec.entries
      .map((e, i) => {
        const s = SHAPE[e.shape];
        const feels = (e.feelings || [])
          .map((id) => FEELINGS.find((f) => f.id === id)?.label)
          .filter(Boolean)
          .join("、");
        return `${i + 1}) ${s?.emoji || ""} ${s?.label || ""}${feels ? ` · ${feels}` : ""}`;
      })
      .join("<br/>");
    detailTitle = `${formatShortDate(selected)} · ${honor.emoji} ${honor.title}`;
    detailBody = n > 1 ? `今日共 ${n} 笔<br/>${lines}` : lines;
  } else if (selectedRec?.status === "skipped") {
    detailTitle = `${formatShortDate(selected)} · 暂未送达`;
    detailBody = "那天选择了「还没呢」。不催不卷，想起来再补也行。";
  } else if (selected) {
    detailTitle = `${formatShortDate(selected)} · 空空如也`;
    detailBody = "这天还没留下足迹。过去的日子也可以补记哦。";
  }

  const isToday = selected === dateKey();
  const hasRec = !!selectedRec;

  return `
    <div class="page" id="page-calendar">
      <div class="cal-header">
        <button class="icon-btn" type="button" data-cal="prev">‹</button>
        <div class="brand" style="align-items:center;text-align:center;flex:1">
          <div class="brand-name" style="font-size:24px">${year}年${month + 1}月</div>
          <div class="brand-sub">便便打卡日历</div>
        </div>
        <button class="icon-btn" type="button" data-cal="next">›</button>
      </div>
      <div class="cal-grid">${dows}${blanks}${days.join("")}</div>
      <div class="cal-detail">
        <h4>${detailTitle}</h4>
        <p>${detailBody}</p>
      </div>
      ${
        isToday && !hasRec
          ? `<button class="btn btn-primary" type="button" data-action="start-record">去记今天 💩</button>`
          : isToday && selectedRec?.status === "done"
            ? `<div class="mini-actions">
                <button class="btn btn-accent" type="button" data-action="append">再记一笔 ⚡</button>
                <button class="btn btn-secondary" type="button" data-action="weekly-report">本周小报 📰</button>
              </div>`
            : !hasRec
              ? `<button class="btn btn-secondary" type="button" data-action="backfill">补记这一天</button>`
              : `<button class="btn btn-accent" type="button" data-action="weekly-report">生成本周肚肚小报 📰</button>`
      }
    </div>
  `;
}

/* ---------- mine ---------- */

function renderMine() {
  const done = getDoneDays(state.records).length;
  const streak = calcStreak();
  return `
    <div class="page" id="page-mine">
      <div class="profile-hero">
        <div class="avatar">🧸</div>
        <div class="profile-text">
          <h2>噗噗观察员</h2>
          <p>记录只留在你这边，想清就清</p>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat">
          <div class="stat-label">累计打卡</div>
          <div class="stat-value">${done} 天</div>
        </div>
        <div class="stat alt">
          <div class="stat-label">最近连续</div>
          <div class="stat-value">${streak} 天</div>
        </div>
      </div>
      <div class="list-card">
        <button class="list-item" type="button" data-mine="share-week">
          <span>生成我的本周小报</span><span>称号海报 ›</span>
        </button>
        <button class="list-item" type="button" data-mine="reset-today">
          <span>重记今天</span><span>清空今日 ›</span>
        </button>
        <button class="list-item" type="button" data-mine="clear">
          <span>清空全部记录</span><span>需确认 ›</span>
        </button>
        <button class="list-item" type="button" data-mine="watch">
          <span>Apple Watch 预告</span><span>即将 ›</span>
        </button>
      </div>
      <p class="footer-note">
        噗噗日记提供轻松提醒，不构成医疗诊断。<br/>
        若出现剧痛、见血、持续异常，请及时就医。
      </p>
    </div>
  `;
}

function calcStreak() {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    const key = dateKey(d);
    const rec = state.records[key];
    if (rec && (rec.status === "done" || rec.status === "skipped")) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else if (i === 0) {
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/* ---------- render root ---------- */

function render() {
  const screen = document.getElementById("screen");
  if (state.tab === "today") screen.innerHTML = renderToday();
  else if (state.tab === "calendar") screen.innerHTML = renderCalendar();
  else screen.innerHTML = renderMine();

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === state.tab);
  });

  bindScreenEvents();
}

function bindScreenEvents() {
  const screen = document.getElementById("screen");

  screen.querySelector('[data-action="yes"]')?.addEventListener("click", onYes);
  screen.querySelector('[data-action="no"]')?.addEventListener("click", onNo);
  screen.querySelector('[data-action="append"]')?.addEventListener("click", onAppend);
  screen.querySelector('[data-action="back-home"]')?.addEventListener("click", () => {
    state.flow = null;
    render();
  });
  screen.querySelector('[data-action="skip-feel"]')?.addEventListener("click", () => {
    finishRecord([]);
  });
  screen.querySelector('[data-action="submit-feel"]')?.addEventListener("click", () => {
    finishRecord(state.flow?.feelings || []);
  });
  screen.querySelector('[data-action="share"]')?.addEventListener("click", () => openShare("today"));
  screen.querySelector('[data-action="go-calendar"]')?.addEventListener("click", () => {
    state.tab = "calendar";
    render();
  });
  screen.querySelector('[data-action="start-record"]')?.addEventListener("click", () => {
    state.tab = "today";
    state.flow = null;
    render();
  });
  screen.querySelector('[data-action="backfill"]')?.addEventListener("click", () => {
    const key = state.selectedDay;
    setDay(key, {
      status: "done",
      entries: [{ id: uid(), shape: "normal", feelings: ["easy"], at: Date.now() }],
    });
    toast("已补记为「顺滑毕业」🍌");
    render();
  });
  screen.querySelector('[data-action="weekly-report"]')?.addEventListener("click", () => {
    openShare("week");
  });

  screen.querySelectorAll("[data-shape]").forEach((btn) => {
    btn.addEventListener("click", () => onShape(btn.dataset.shape));
  });

  screen.querySelectorAll("[data-feel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.feel;
      const set = new Set(state.flow.feelings || []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      state.flow.feelings = [...set];
      render();
    });
  });

  screen.querySelector('[data-cal="prev"]')?.addEventListener("click", () => {
    state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() - 1, 1);
    render();
  });
  screen.querySelector('[data-cal="next"]')?.addEventListener("click", () => {
    state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + 1, 1);
    render();
  });
  screen.querySelectorAll("[data-day]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedDay = btn.dataset.day;
      render();
    });
  });

  screen.querySelector('[data-mine="share-week"]')?.addEventListener("click", () => openShare("week"));
  screen.querySelector('[data-mine="reset-today"]')?.addEventListener("click", () => {
    delete state.records[dateKey()];
    saveRecords(state.records);
    state.flow = null;
    toast("今日已清空，可以重记");
    state.tab = "today";
    render();
  });
  screen.querySelector('[data-mine="clear"]')?.addEventListener("click", () => {
    if (confirm("确定清空全部记录？此操作不可恢复。")) {
      state.records = {};
      saveRecords(state.records);
      state.flow = null;
      toast("已清空全部记录");
      render();
    }
  });
  screen.querySelector('[data-mine="watch"]')?.addEventListener("click", () => {
    toast("Watch 版：抬腕一键记录，敬请期待 ⌚️");
  });
}

/* ---------- interactions ---------- */

function startShapeFlow(mode = "create") {
  state.flow = { step: "shape", feelings: [], mode, shape: null };
  render();
}

function onYes() {
  // if skipped earlier, treat as first create
  const existing = todayRecord();
  if (existing?.status === "skipped") {
    delete state.records[dateKey()];
    saveRecords(state.records);
  }
  showFeedback({
    theme: "theme-yes",
    emoji: "🎉",
    title: "噗得漂亮！",
    sub: "这一刻，值得全世界放个小烟花",
    tag: "情绪奖励已到账 +100",
    primary: "继续补充形态 →",
    confetti: 42,
    onPrimary: () => startShapeFlow("create"),
  });
}

function onAppend() {
  const n = entryCount(todayRecord());
  const next = n + 1;
  const tease = multiTier(Math.max(next, 2));
  showFeedback({
    theme: tease?.theme || "theme-yes",
    emoji: tease?.emoji || "⚡",
    title: next >= 2 ? `准备冲击第 ${next} 笔？` : "再来一笔？",
    sub:
      next >= 5
        ? "你正在挑战今日传说难度。形态选好，奖状更炸。"
        : next >= 3
          ? "厕所VIP通道已为你亮灯，选完形态立刻加冕。"
          : "回头客通道已开启，选完形态就给你升称号。",
    tag: "再记一笔 · 反馈会更夸张",
    primary: "开始记录 →",
    secondary: "先算了",
    confetti: 24,
    shake: next >= 3,
    onPrimary: () => startShapeFlow("append"),
    onSecondary: () => render(),
  });
}

function onNo() {
  showFeedback({
    theme: "theme-no",
    emoji: "🌿",
    title: "没事，不催",
    sub: "肠道也有自己的上班时间。晚上 8 点再轻轻提醒你一声。",
    tag: "今日暂不追问",
    primary: "好的，记下了",
    secondary: "其实我噗了…",
    confetti: 0,
    onPrimary: () => {
      setDay(dateKey(), {
        status: "skipped",
        entries: [],
        remindAt: "20:00",
      });
      state.flow = null;
      render();
      toast("已记下，晚上再提醒你");
    },
    onSecondary: () => startShapeFlow("create"),
  });
}

function onShape(shapeId) {
  const shape = SHAPE[shapeId];
  const mode = state.flow?.mode || "create";
  state.flow = { ...(state.flow || {}), step: "feel", shape: shapeId, feelings: [], mode };
  showFeedback({
    theme: shape.theme,
    emoji: shape.emoji,
    title: shape.sect,
    sub: shape.vibe,
    tag: `形态锁定：${shape.label}`,
    primary: "继续补充感受",
    secondary: "直接交差",
    confetti: shapeId === "normal" ? 28 : 16,
    onPrimary: () => render(),
    onSecondary: () => finishRecord([]),
  });
}

function finishRecord(feelings) {
  const danger = feelings.some((f) => f === "blood" || f === "severe");
  const care = feelings.some((f) => f === "strain" || f === "bloat" || f === "pain");
  const shapeId = state.flow?.shape || "normal";
  const shape = SHAPE[shapeId];
  const mode = state.flow?.mode || "create";
  const key = dateKey();
  const prev = state.records[key];
  const entry = { id: uid(), shape: shapeId, feelings, at: Date.now() };

  let nextCount = 1;
  if (mode === "append" && prev?.status === "done") {
    const entries = [...(prev.entries || []), entry];
    nextCount = entries.length;
    setDay(key, { status: "done", entries });
  } else if (mode === "edit" && prev?.status === "done" && prev.entries?.length) {
    const entries = [...prev.entries];
    entries[entries.length - 1] = entry;
    nextCount = entries.length;
    setDay(key, { status: "done", entries });
  } else {
    setDay(key, { status: "done", entries: [entry] });
    nextCount = 1;
  }

  state.flow = null;

  if (danger) {
    showFeedback({
      theme: "theme-warn",
      emoji: "🚨",
      title: "先认真一点",
      sub: "剧痛或见血不是玩笑。噗噗不诊断，但请尽快就医确认，别拖。",
      tag: "已切换认真提醒",
      primary: "我知道了",
      confetti: 0,
      onPrimary: () => render(),
    });
    return;
  }

  // 多次记录：优先播报夸张连击反馈
  if (mode === "append" && nextCount >= 2) {
    const multi = multiTier(nextCount);
    showFeedback({
      theme: multi.theme,
      emoji: multi.emoji,
      title: multi.title,
      sub: `${multi.sub}<br/><span class="feedback-inline">${shape.emoji} 本笔：${shape.label}</span>`,
      tag: multi.tag,
      primary: "查看今日战报",
      secondary: care ? "我有点不舒服…" : null,
      confetti: multi.confetti,
      shake: multi.shake,
      flash: multi.flash,
      pulse: multi.pulse,
      onPrimary: () => render(),
      onSecondary: care
        ? () => {
            showFeedback({
              theme: "theme-care",
              emoji: "🫶",
              title: "收到，心疼模式开启",
              sub: "活跃归活跃，不舒服就温柔点。温水、散步、放松肚子。",
              tag: shape.label,
              primary: "好的",
              confetti: 10,
              onPrimary: () => render(),
            });
          }
        : null,
    });
    return;
  }

  if (care) {
    showFeedback({
      theme: "theme-care",
      emoji: "🫶",
      title: "收到，心疼模式开启",
      sub: `${shape.vibe} 今天别硬刚——温水、散步、放松肚子。`,
      tag: `称号：${shape.title}`,
      primary: "看看今日提示",
      confetti: 12,
      onPrimary: () => render(),
    });
    return;
  }

  showFeedback({
    theme: "theme-yes",
    emoji: "🏆",
    title: "日报签收成功！",
    sub: `${shape.vibe}`,
    tag: `今日称号：${shape.title}`,
    primary: "查看今日洞察",
    confetti: 30,
    onPrimary: () => render(),
  });
}

/* ---------- share poster ---------- */

function openShare(mode = "today") {
  state.shareMode = mode;
  const sheet = document.getElementById("share-sheet");
  const title = document.getElementById("share-title");
  const sub = document.getElementById("share-sub");
  title.textContent = mode === "week" ? "本周肚肚小报" : "今日肚肚小报";
  sub.textContent = "只晒称号，不晒次数 · 可保存到相册";

  const canvas = document.getElementById("share-canvas");
  drawSharePoster(canvas, mode);
  sheet.hidden = false;
}

function closeShare() {
  document.getElementById("share-sheet").hidden = true;
}

function drawSharePoster(canvas, mode) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = 360;
  const h = 480;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const insight = buildInsight(state.records);
  const today = todayRecord();
  const honor =
    mode === "week" ? weekHonorTitle(state.records) : todayHonorTitle(today);
  const dateLabel =
    mode === "week"
      ? `${formatShortDate(dateKey(startOfWeek()))} — ${formatShortDate(dateKey())}`
      : formatCNDate();

  // background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  if (mode === "week") {
    grad.addColorStop(0, "#FFE8F0");
    grad.addColorStop(0.5, "#FFF3B0");
    grad.addColorStop(1, "#DFF7EA");
  } else if (insight.mood === "hard" || honor.title.includes("法棍")) {
    grad.addColorStop(0, "#FFE0C2");
    grad.addColorStop(1, "#FF8C42");
  } else if (insight.mood === "loose") {
    grad.addColorStop(0, "#D9F2FF");
    grad.addColorStop(1, "#74C0FC");
  } else {
    grad.addColorStop(0, "#FFE566");
    grad.addColorStop(1, "#FF9F7A");
  }
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, w, h, 28);
  ctx.fill();

  // decorative circles
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.arc(48, 64, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(310, 120, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(80, 400, 44, 0, Math.PI * 2);
  ctx.fill();

  // brand
  ctx.fillStyle = "rgba(43,33,24,0.7)";
  ctx.font = "600 14px 'Noto Sans SC', sans-serif";
  ctx.fillText("噗噗日记 · 肚肚小报", 28, 42);

  ctx.fillStyle = "#2B2118";
  ctx.font = "500 13px 'Noto Sans SC', sans-serif";
  ctx.fillText(dateLabel, 28, 66);

  // big emoji
  ctx.font = "72px serif";
  ctx.textAlign = "center";
  ctx.fillText(honor.emoji || "💩", w / 2, 160);

  // title card
  ctx.textAlign = "left";
  roundRect(ctx, 24, 190, w - 48, 168, 22);
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.fill();

  ctx.fillStyle = "#6B5748";
  ctx.font = "600 12px 'Noto Sans SC', sans-serif";
  ctx.fillText(mode === "week" ? "本周荣誉称号" : "今日荣誉称号", 44, 218);

  ctx.fillStyle = "#2B2118";
  ctx.font = "900 28px 'ZCOOL KuaiLe', 'Noto Sans SC', sans-serif";
  wrapText(ctx, honor.title, 44, 258, w - 96, 34);

  ctx.fillStyle = "#6B5748";
  ctx.font = "600 14px 'Noto Sans SC', sans-serif";
  const line =
    mode === "week"
      ? honor.line
      : today?.status === "skipped"
        ? "今日蓄力，晚上见。"
        : insight.tip;
  wrapText(ctx, line, 44, 310, w - 96, 22);

  // privacy footer
  ctx.fillStyle = "rgba(43,33,24,0.55)";
  ctx.font = "500 11px 'Noto Sans SC', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("只晒称号，不晒细节 · 轻松监测不吓人", w / 2, 400);

  // fake stamp
  ctx.save();
  ctx.translate(278, 430);
  ctx.rotate(-0.2);
  ctx.strokeStyle = "rgba(255,93,143,0.75)";
  ctx.lineWidth = 3;
  roundRect(ctx, -46, -22, 92, 44, 8);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,93,143,0.85)";
  ctx.font = "800 14px 'Noto Sans SC', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("已送达", 0, 6);
  ctx.restore();

  ctx.textAlign = "left";
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = String(text || "").split("");
  let line = "";
  let yy = y;
  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = chars[i];
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

async function saveShareImage() {
  const canvas = document.getElementById("share-canvas");
  const filename = `噗噗日记-${state.shareMode === "week" ? "本周" : "今日"}小报.png`;

  // Prefer Web Share with file (mobile), then download
  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("blob failed");

    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "噗噗日记肚肚小报",
        text: "只晒称号，不晒次数",
      });
      toast("可以存到相册或发给朋友啦");
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast("图片已保存到本地");
  } catch (err) {
    if (err?.name === "AbortError") return;
    // fallback: open image in new tab for long-press save
    try {
      const url = canvas.toDataURL("image/png");
      const win = window.open();
      if (win) {
        win.document.write(`<img src="${url}" style="width:100%" alt="肚肚小报"/>`);
        toast("长按图片可保存到相册");
      } else {
        toast("请允许弹窗，或截图保存");
      }
    } catch {
      toast("保存失败，请试试截图");
    }
  }
}

/* ---------- boot ---------- */

function updateStatusTime() {
  const now = new Date();
  document.getElementById("status-time").textContent = `${pad(now.getHours())}:${pad(
    now.getMinutes()
  )}`;
}

function bindChrome() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      if (state.flow && state.tab === "today" && tab.dataset.tab !== "today") {
        state.flow = null;
      }
      state.tab = tab.dataset.tab;
      render();
    });
  });

  document.getElementById("close-share").addEventListener("click", closeShare);
  document.getElementById("share-sheet").addEventListener("click", (e) => {
    if (e.target.id === "share-sheet") closeShare();
  });
  document.getElementById("save-share").addEventListener("click", saveShareImage);
  document.getElementById("toggle-share-mode")?.addEventListener("click", () => {
    openShare(state.shareMode === "week" ? "today" : "week");
  });
}

seedDemoIfEmpty();
bindChrome();
updateStatusTime();
setInterval(updateStatusTime, 30_000);
render();
