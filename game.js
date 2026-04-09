(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const baseSize = { width: 960, height: 540 };
  let renderScale = 1;

  const state = {
    mode: "menu",
    time: 0,
    resources: {
      metal: 420,
      crystal: 190,
      deuterium: 80,
    },
    buildings: {
      metalMine: 2,
      crystalMine: 1,
      deuteriumSynth: 0,
      solarPlant: 1,
      researchLab: 1,
    },
    buildQueue: null,
    selectedIndex: 0,
    showAdvisor: false,
    focusIndex: 0,
    lastAdvice: [],
    layout: {},
    stars: [],
    pullCooldown: 0,
    pullMaxCooldown: 10,
  };

  const buildingDefs = [
    {
      key: "metalMine",
      name: "Metal Mine",
      baseCost: { metal: 60, crystal: 15, deuterium: 0 },
      baseRate: { metal: 2, crystal: 0, deuterium: 0 },
      growth: 1.55,
      buildTime: 3,
    },
    {
      key: "crystalMine",
      name: "Crystal Mine",
      baseCost: { metal: 48, crystal: 24, deuterium: 0 },
      baseRate: { metal: 0, crystal: 1.4, deuterium: 0 },
      growth: 1.6,
      buildTime: 4,
    },
    {
      key: "deuteriumSynth",
      name: "Deuterium Synth",
      baseCost: { metal: 225, crystal: 75, deuterium: 0 },
      baseRate: { metal: 0, crystal: 0, deuterium: 0.8 },
      growth: 1.5,
      buildTime: 5,
    },
    {
      key: "solarPlant",
      name: "Solar Plant",
      baseCost: { metal: 75, crystal: 30, deuterium: 0 },
      baseRate: { metal: 0, crystal: 0, deuterium: 0 },
      growth: 1.5,
      buildTime: 4,
    },
    {
      key: "researchLab",
      name: "Research Lab",
      baseCost: { metal: 200, crystal: 150, deuterium: 0 },
      baseRate: { metal: 0, crystal: 0, deuterium: 0 },
      growth: 1.7,
      buildTime: 6,
    },
  ];

  const uiStrings = {
    title: "Ajna Command Grid",
    subtitle: "Strategic Console // Public Edition",
  };

  const PUSH_COST_METAL_PER_SEC = 20;
  const PUSH_COST_CRYSTAL_PER_SEC = 10;
  const PUSH_MIN_REMAINING = 0.1;

  const strategyTracks = [
    {
      name: "Growth Loop",
      goal: "Increase inbound momentum",
      steps: [
        "Ship 2 acquisition experiments",
        "Refresh landing + CTA clarity",
        "Publish 3 high-signal updates",
      ],
      kpis: ["Leads +15%", "CTR > 2.5%", "Activation 20%"],
      metric: "Weekly lead delta",
    },
    {
      name: "Product Quality",
      goal: "Reduce friction in core flow",
      steps: [
        "Triage top 5 drop-off points",
        "Ship 2 UX fixes in core path",
        "Add one small delight",
      ],
      kpis: ["Task success 85%", "NPS 35+", "Support -20%"],
      metric: "Friction score trend",
    },
    {
      name: "Ops Stability",
      goal: "Protect reliability + speed",
      steps: [
        "Resolve 3 perf bottlenecks",
        "Add 2 alerting guardrails",
        "Document critical runbook",
      ],
      kpis: ["Uptime 99.9%", "TTFB < 500ms", "Errors < 0.5%"],
      metric: "Incident-free days",
    },
    {
      name: "Revenue Focus",
      goal: "Convert interest into cash",
      steps: [
        "Tighten pricing + packaging",
        "Ship 1 conversion nudge",
        "Follow up 10 warm leads",
      ],
      kpis: ["MRR +10%", "Conv > 3.5%", "Churn < 3%"],
      metric: "Monthly net revenue",
    },
  ];

  function initStars() {
    const count = 140;
    state.stars = Array.from({ length: count }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.3,
      a: Math.random() * 0.8 + 0.2,
      tw: Math.random() * 0.8 + 0.2,
    }));
  }

  function resizeCanvas() {
    const { innerWidth, innerHeight } = window;
    const targetRatio = baseSize.width / baseSize.height;
    const padding = document.fullscreenElement ? 0 : 32;
    const maxWidth = Math.max(320, innerWidth - padding);
    const maxHeight = Math.max(240, innerHeight - padding);

    let drawWidth = baseSize.width;
    let drawHeight = baseSize.height;

    const windowRatio = maxWidth / maxHeight;
    if (windowRatio > targetRatio) {
      drawHeight = Math.min(maxHeight, baseSize.height);
      drawWidth = drawHeight * targetRatio;
    } else {
      drawWidth = Math.min(maxWidth, baseSize.width);
      drawHeight = drawWidth / targetRatio;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${drawWidth}px`;
    canvas.style.height = `${drawHeight}px`;
    canvas.width = Math.floor(drawWidth * dpr);
    canvas.height = Math.floor(drawHeight * dpr);
    renderScale = canvas.width / baseSize.width;

    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  }

  function formatNumber(value) {
    return Math.floor(value).toLocaleString("en-US");
  }

  function getCost(def, level) {
    const factor = Math.pow(def.growth, level);
    return {
      metal: Math.ceil(def.baseCost.metal * factor),
      crystal: Math.ceil(def.baseCost.crystal * factor),
      deuterium: Math.ceil(def.baseCost.deuterium * factor),
    };
  }

  function canAfford(cost) {
    return (
      state.resources.metal >= cost.metal &&
      state.resources.crystal >= cost.crystal &&
      state.resources.deuterium >= cost.deuterium
    );
  }

  function spend(cost) {
    state.resources.metal -= cost.metal;
    state.resources.crystal -= cost.crystal;
    state.resources.deuterium -= cost.deuterium;
  }

  function productionPerSecond() {
    const totals = { metal: 0, crystal: 0, deuterium: 0 };
    buildingDefs.forEach((def) => {
      const level = state.buildings[def.key];
      totals.metal += def.baseRate.metal * level;
      totals.crystal += def.baseRate.crystal * level;
      totals.deuterium += def.baseRate.deuterium * level;
    });
    const powerBoost = 1 + Math.min(state.buildings.solarPlant * 0.06, 0.4);
    totals.metal *= powerBoost;
    totals.crystal *= powerBoost;
    totals.deuterium *= powerBoost;
    return totals;
  }

  function updateBuildQueue(dt) {
    if (!state.buildQueue) return;
    state.buildQueue.remaining -= dt;
    if (state.buildQueue.remaining <= 0) {
      state.buildings[state.buildQueue.key] += 1;
      state.buildQueue = null;
    }
  }

  function updateResources(dt) {
    const perSec = productionPerSecond();
    state.resources.metal += perSec.metal * dt;
    state.resources.crystal += perSec.crystal * dt;
    state.resources.deuterium += perSec.deuterium * dt;
  }

  function update(dt) {
    if (state.mode !== "game") return;
    updateResources(dt);
    updateBuildQueue(dt);
    if (state.pullCooldown > 0) {
      state.pullCooldown = Math.max(0, state.pullCooldown - dt);
    }
  }

  function getRecommendations() {
    const { metal, crystal, deuterium } = state.resources;
    const recs = [];
    if (metal < crystal * 0.8) recs.push("Prioritize Metal Mine to stabilize base income.");
    if (crystal < metal * 0.6) recs.push("Crystal Mine lags behind. Upgrade for balance.");
    if (deuterium < metal * 0.3) recs.push("Deuterium is low. Queue Synth upgrade soon.");
    if (state.buildings.researchLab < 2) recs.push("Research Lab level 2 unlocks better strategic options.");
    if (recs.length === 0) recs.push("Economy is balanced. Push Research Lab or Solar Plant.");
    state.lastAdvice = recs;
    return recs;
  }

  function drawBackground() {
    ctx.fillStyle = "#05080f";
    ctx.fillRect(0, 0, baseSize.width, baseSize.height);

    state.stars.forEach((s, idx) => {
      const drift = (Math.sin(state.time * 0.3 + idx) + 1) * 0.5 * s.tw;
      ctx.fillStyle = `rgba(200, 225, 255, ${s.a + drift * 0.1})`;
      ctx.beginPath();
      ctx.arc(s.x * baseSize.width, s.y * baseSize.height, s.r + drift, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPlanet(x, y, r) {
    const gradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
    gradient.addColorStop(0, "#6cc5ff");
    gradient.addColorStop(0.5, "#2f6ba0");
    gradient.addColorStop(1, "#0c1b30");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.08, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawPanel(x, y, w, h, title) {
    ctx.fillStyle = "rgba(11,17,27,0.88)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#2a3b53";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    if (title) {
      ctx.fillStyle = "#4dd2ff";
      ctx.font = "600 12px 'IBM Plex Sans'";
      ctx.fillText(title.toUpperCase(), x + 12, y + 18);
    }
  }

  function drawResourceRow(x, y, label, value, color) {
    ctx.fillStyle = color;
    ctx.font = "600 14px 'IBM Plex Sans'";
    ctx.fillText(label, x, y);
    ctx.fillStyle = "#e8edf2";
    ctx.font = "14px 'IBM Plex Sans'";
    ctx.fillText(formatNumber(value), x + 100, y);
  }

  function renderGame() {
    drawBackground();

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, baseSize.width, 70);

    ctx.fillStyle = "#e8edf2";
    ctx.font = "600 20px 'IBM Plex Sans'";
    ctx.fillText(uiStrings.title, 24, 32);
    ctx.fillStyle = "#b7c4d4";
    ctx.font = "12px 'IBM Plex Sans'";
    ctx.fillText(uiStrings.subtitle, 24, 52);

    const resourcePanel = { x: 24, y: 90, w: 250, h: 150 };
    drawPanel(resourcePanel.x, resourcePanel.y, resourcePanel.w, resourcePanel.h, "Resources");

    drawResourceRow(resourcePanel.x + 12, resourcePanel.y + 46, "Metal", state.resources.metal, "#ffd166");
    drawResourceRow(resourcePanel.x + 12, resourcePanel.y + 70, "Crystal", state.resources.crystal, "#6ee7ff");
    drawResourceRow(resourcePanel.x + 12, resourcePanel.y + 94, "Deuterium", state.resources.deuterium, "#9bffc9");

    const production = productionPerSecond();
    ctx.fillStyle = "#b7c4d4";
    ctx.font = "11px 'IBM Plex Sans'";
    ctx.fillText(
      `+${production.metal.toFixed(1)} / +${production.crystal.toFixed(1)} / +${production.deuterium.toFixed(1)} per sec`,
      resourcePanel.x + 12,
      resourcePanel.y + 128
    );

    drawPlanet(170, 380, 120);

    const buildPanel = { x: 310, y: 90, w: 320, h: 390 };
    drawPanel(buildPanel.x, buildPanel.y, buildPanel.w, buildPanel.h, "Infrastructure Queue");

    const listStartY = buildPanel.y + 40;
    const rowHeight = 44;

    buildingDefs.forEach((def, idx) => {
      const level = state.buildings[def.key];
      const rowY = listStartY + idx * rowHeight;
      const isSelected = idx === state.selectedIndex;

      ctx.fillStyle = isSelected ? "rgba(77,210,255,0.15)" : "rgba(255,255,255,0.03)";
      ctx.fillRect(buildPanel.x + 12, rowY, buildPanel.w - 24, rowHeight - 6);

      ctx.fillStyle = "#e8edf2";
      ctx.font = "600 13px 'IBM Plex Sans'";
      ctx.fillText(def.name, buildPanel.x + 24, rowY + 18);

      ctx.fillStyle = "#b7c4d4";
      ctx.font = "12px 'IBM Plex Sans'";
      ctx.fillText(`Lv ${level}`, buildPanel.x + 24, rowY + 34);

      const cost = getCost(def, level);
      ctx.fillStyle = canAfford(cost) ? "#36d399" : "#ff7b7b";
      ctx.font = "11px 'IBM Plex Sans'";
      ctx.fillText(`M ${cost.metal} / C ${cost.crystal}`, buildPanel.x + 130, rowY + 18);
      if (cost.deuterium > 0) {
        ctx.fillText(`D ${cost.deuterium}`, buildPanel.x + 130, rowY + 34);
      }
    });

    const queuePanel = { x: 660, y: 90, w: 270, h: 210 };
    drawPanel(queuePanel.x, queuePanel.y, queuePanel.w, queuePanel.h, "Build Status");

    ctx.fillStyle = "#e8edf2";
    ctx.font = "13px 'IBM Plex Sans'";

    if (state.buildQueue) {
      const def = buildingDefs.find((b) => b.key === state.buildQueue.key);
      ctx.fillText(def ? def.name : "Upgrade", queuePanel.x + 16, queuePanel.y + 50);
      ctx.fillStyle = "#b7c4d4";
      ctx.fillText(`ETA: ${state.buildQueue.remaining.toFixed(1)}s`, queuePanel.x + 16, queuePanel.y + 70);
      ctx.fillStyle = "rgba(77,210,255,0.2)";
      ctx.fillRect(queuePanel.x + 16, queuePanel.y + 90, queuePanel.w - 32, 10);
      const progress = Math.max(
        0,
        Math.min(1, 1 - state.buildQueue.remaining / state.buildQueue.total)
      );
      ctx.fillStyle = "#4dd2ff";
      ctx.fillRect(queuePanel.x + 16, queuePanel.y + 90, (queuePanel.w - 32) * progress, 10);
    } else {
      ctx.fillText("Queue empty", queuePanel.x + 16, queuePanel.y + 52);
      ctx.fillStyle = "#b7c4d4";
      ctx.fillText("Select a structure to upgrade.", queuePanel.x + 16, queuePanel.y + 72);
    }

    const advisorPanel = { x: 660, y: 320, w: 270, h: 160 };
    drawPanel(advisorPanel.x, advisorPanel.y, advisorPanel.w, advisorPanel.h, "Strategic Advisor");

    ctx.fillStyle = "#e8edf2";
    ctx.font = "12px 'IBM Plex Sans'";
    const advice = state.showAdvisor ? getRecommendations() : ["Press I to reveal guidance."];
    advice.forEach((line, idx) => {
      ctx.fillText(line, advisorPanel.x + 16, advisorPanel.y + 48 + idx * 18);
    });

    const strategyPanel = { x: 24, y: 240, w: 250, h: 250 };
    drawPanel(strategyPanel.x, strategyPanel.y, strategyPanel.w, strategyPanel.h, "Strategy Track");

    const track = strategyTracks[state.focusIndex];
    ctx.fillStyle = "#e8edf2";
    ctx.font = "600 12px 'IBM Plex Sans'";
    ctx.fillText(track.name, strategyPanel.x + 12, strategyPanel.y + 44);
    ctx.fillStyle = "#b7c4d4";
    ctx.font = "12px 'IBM Plex Sans'";
    ctx.fillText(track.goal, strategyPanel.x + 12, strategyPanel.y + 64);
    ctx.fillStyle = "#6ee7ff";
    ctx.fillText("Priority Steps:", strategyPanel.x + 12, strategyPanel.y + 90);

    ctx.fillStyle = "#e8edf2";
    track.steps.forEach((step, idx) => {
      ctx.fillText(`• ${step}`, strategyPanel.x + 16, strategyPanel.y + 112 + idx * 18);
    });

    ctx.fillStyle = "#9bffc9";
    ctx.fillText(`Metric: ${track.metric}`, strategyPanel.x + 12, strategyPanel.y + 188);

    ctx.fillStyle = "#ffd166";
    ctx.fillText("KPIs:", strategyPanel.x + 12, strategyPanel.y + 208);
    ctx.fillStyle = "#e8edf2";
    track.kpis.forEach((kpi, idx) => {
      ctx.fillText(kpi, strategyPanel.x + 52, strategyPanel.y + 208 + idx * 16);
    });

    const upgradeButton = {
      x: buildPanel.x + 12,
      y: buildPanel.y + buildPanel.h - 50,
      w: buildPanel.w - 24,
      h: 34,
    };

    const def = buildingDefs[state.selectedIndex];
    const level = state.buildings[def.key];
    const cost = getCost(def, level);
    const canUpgrade = !state.buildQueue && canAfford(cost);

    ctx.fillStyle = canUpgrade ? "rgba(77,210,255,0.25)" : "rgba(255,255,255,0.08)";
    ctx.fillRect(upgradeButton.x, upgradeButton.y, upgradeButton.w, upgradeButton.h);
    ctx.strokeStyle = canUpgrade ? "#4dd2ff" : "#2a3b53";
    ctx.strokeRect(upgradeButton.x, upgradeButton.y, upgradeButton.w, upgradeButton.h);
    ctx.fillStyle = canUpgrade ? "#e8edf2" : "#7d8da3";
    ctx.font = "600 13px 'IBM Plex Sans'";
    ctx.fillText("Upgrade (Enter)", upgradeButton.x + 16, upgradeButton.y + 21);

    // Pull Resources button
    const pullButton = {
      x: queuePanel.x,
      y: queuePanel.y + queuePanel.h + 10,
      w: queuePanel.w,
      h: 34,
    };
    const canPull = state.pullCooldown <= 0;
    ctx.fillStyle = canPull ? "rgba(155,255,201,0.2)" : "rgba(255,255,255,0.06)";
    ctx.fillRect(pullButton.x, pullButton.y, pullButton.w, pullButton.h);
    ctx.strokeStyle = canPull ? "#9bffc9" : "#2a3b53";
    ctx.strokeRect(pullButton.x, pullButton.y, pullButton.w, pullButton.h);
    ctx.fillStyle = canPull ? "#9bffc9" : "#7d8da3";
    ctx.font = "600 13px 'IBM Plex Sans'";
    if (canPull) {
      ctx.fillText("Pull Resources (R)", pullButton.x + 12, pullButton.y + 21);
    } else {
      ctx.fillText(`Pull cooldown: ${state.pullCooldown.toFixed(1)}s`, pullButton.x + 12, pullButton.y + 21);
    }

    // Push Build button
    const pushButton = {
      x: queuePanel.x,
      y: pullButton.y + pullButton.h + 8,
      w: queuePanel.w,
      h: 34,
    };
    const boost = state.buildQueue ? state.buildQueue.remaining * 0.5 : 0;
    const pushCost = state.buildQueue
      ? { metal: Math.ceil(boost * PUSH_COST_METAL_PER_SEC), crystal: Math.ceil(boost * PUSH_COST_CRYSTAL_PER_SEC) }
      : null;
    const canPush = !!state.buildQueue && canAfford({ ...pushCost, deuterium: 0 });
    ctx.fillStyle = canPush ? "rgba(255,209,102,0.2)" : "rgba(255,255,255,0.06)";
    ctx.fillRect(pushButton.x, pushButton.y, pushButton.w, pushButton.h);
    ctx.strokeStyle = canPush ? "#ffd166" : "#2a3b53";
    ctx.strokeRect(pushButton.x, pushButton.y, pushButton.w, pushButton.h);
    ctx.fillStyle = canPush ? "#ffd166" : "#7d8da3";
    ctx.font = "600 13px 'IBM Plex Sans'";
    if (state.buildQueue && pushCost) {
      ctx.fillText(`Push Build (G)  M${pushCost.metal}/C${pushCost.crystal}`, pushButton.x + 12, pushButton.y + 21);
    } else {
      ctx.fillText("Push Build (G)  no queue", pushButton.x + 12, pushButton.y + 21);
    }

    ctx.fillStyle = "#b7c4d4";
    ctx.font = "11px 'IBM Plex Sans'";
    ctx.fillText("Up/Down select, Enter build, I advisor, P pause, F fullscreen", 310, 512);
    ctx.fillText("T: strategy track  R: pull resources  G: push build", 310, 528);

    state.layout = {
      buildPanel,
      listStartY,
      rowHeight,
      upgradeButton,
      pullButton,
      pushButton,
      advisorPanel,
      strategyPanel,
    };
  }

  function renderMenu() {
    drawBackground();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, baseSize.width, baseSize.height);

    ctx.fillStyle = "#e8edf2";
    ctx.font = "700 36px 'IBM Plex Sans'";
    ctx.fillText(uiStrings.title, 170, 200);
    ctx.font = "16px 'IBM Plex Sans'";
    ctx.fillStyle = "#b7c4d4";
    ctx.fillText("A cover interface that behaves like a strategy game.", 210, 235);
    ctx.fillText("Press Enter to begin simulation.", 310, 270);

    drawPanel(260, 310, 440, 160, "Controls");
    ctx.fillStyle = "#e8edf2";
    ctx.font = "13px 'IBM Plex Sans'";
    ctx.fillText("Up/Down: select structure", 290, 350);
    ctx.fillText("Enter: upgrade selection", 290, 372);
    ctx.fillText("I: toggle advisor guidance", 290, 394);
    ctx.fillText("P: pause / resume", 290, 416);
    ctx.fillText("R: pull resources (burst)  G: push build (speed up)", 290, 438);
    ctx.fillText("F: fullscreen toggle", 290, 460);
  }

  function renderPause() {
    renderGame();
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, baseSize.width, baseSize.height);
    drawPanel(320, 220, 320, 100, "Paused");
    ctx.fillStyle = "#e8edf2";
    ctx.font = "16px 'IBM Plex Sans'";
    ctx.fillText("Press P or Esc to resume.", 350, 270);
  }

  function render() {
    if (state.mode === "menu") renderMenu();
    else if (state.mode === "pause") renderPause();
    else renderGame();
  }

  function startUpgrade() {
    const def = buildingDefs[state.selectedIndex];
    const level = state.buildings[def.key];
    const cost = getCost(def, level);
    if (state.buildQueue || !canAfford(cost)) return;

    spend(cost);
    const duration = def.buildTime + level * 0.8;
    state.buildQueue = {
      key: def.key,
      remaining: duration,
      total: duration,
    };
  }

  function pullResources() {
    if (state.pullCooldown > 0) return;
    const perSec = productionPerSecond();
    const burst = state.pullMaxCooldown;
    state.resources.metal += perSec.metal * burst;
    state.resources.crystal += perSec.crystal * burst;
    state.resources.deuterium += perSec.deuterium * burst;
    state.pullCooldown = state.pullMaxCooldown;
  }

  function pushBuild() {
    if (!state.buildQueue) return;
    const boost = state.buildQueue.remaining * 0.5;
    const boostCost = {
      metal: Math.ceil(boost * PUSH_COST_METAL_PER_SEC),
      crystal: Math.ceil(boost * PUSH_COST_CRYSTAL_PER_SEC),
      deuterium: 0,
    };
    if (!canAfford(boostCost)) return;
    spend(boostCost);
    state.buildQueue.remaining = Math.max(PUSH_MIN_REMAINING, state.buildQueue.remaining - boost);
  }

  function handleClick(x, y) {
    if (state.mode === "menu") {
      state.mode = "game";
      return;
    }
    if (state.mode !== "game") return;

    const { buildPanel, listStartY, rowHeight, upgradeButton, pullButton, pushButton } = state.layout;
    if (
      x >= buildPanel.x + 12 &&
      x <= buildPanel.x + buildPanel.w - 12 &&
      y >= listStartY &&
      y <= listStartY + buildingDefs.length * rowHeight
    ) {
      const idx = Math.floor((y - listStartY) / rowHeight);
      if (idx >= 0 && idx < buildingDefs.length) state.selectedIndex = idx;
    }

    if (
      x >= upgradeButton.x &&
      x <= upgradeButton.x + upgradeButton.w &&
      y >= upgradeButton.y &&
      y <= upgradeButton.y + upgradeButton.h
    ) {
      startUpgrade();
    }

    if (
      pullButton &&
      x >= pullButton.x &&
      x <= pullButton.x + pullButton.w &&
      y >= pullButton.y &&
      y <= pullButton.y + pullButton.h
    ) {
      pullResources();
    }

    if (
      pushButton &&
      x >= pushButton.x &&
      x <= pushButton.x + pushButton.w &&
      y >= pushButton.y &&
      y <= pushButton.y + pushButton.h
    ) {
      pushBuild();
    }
  }

  function handleKey(event) {
    const key = event.key.toLowerCase();
    if (state.mode === "menu" && (key === "enter" || key === " ")) {
      state.mode = "game";
      return;
    }

    if (key === "f") {
      toggleFullscreen();
      return;
    }

    if (state.mode === "pause") {
      if (key === "p" || key === "escape") state.mode = "game";
      return;
    }

    if (state.mode !== "game") return;

    if (key === "arrowup") {
      state.selectedIndex = (state.selectedIndex - 1 + buildingDefs.length) % buildingDefs.length;
    } else if (key === "arrowdown") {
      state.selectedIndex = (state.selectedIndex + 1) % buildingDefs.length;
    } else if (key === "enter") {
      startUpgrade();
    } else if (key === "i") {
      state.showAdvisor = !state.showAdvisor;
    } else if (key === "t") {
      state.focusIndex = (state.focusIndex + 1) % strategyTracks.length;
    } else if (key === "r") {
      pullResources();
    } else if (key === "g") {
      pushBuild();
    } else if (key === "p" || key === "escape") {
      state.mode = "pause";
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function step(dt) {
    state.time += dt;
    update(dt);
    render();
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    step(dt);
    requestAnimationFrame(loop);
  }

  function toCanvasCoords(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * baseSize.width;
    const y = ((event.clientY - rect.top) / rect.height) * baseSize.height;
    return { x, y };
  }

  canvas.addEventListener("click", (event) => {
    const { x, y } = toCanvasCoords(event);
    handleClick(x, y);
  });

  window.addEventListener("keydown", handleKey);
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("fullscreenchange", resizeCanvas);

  window.render_game_to_text = () => {
    const perSec = productionPerSecond();
    const queue = state.buildQueue
      ? {
          key: state.buildQueue.key,
          remaining: Number(state.buildQueue.remaining.toFixed(2)),
        }
      : null;
    return JSON.stringify({
      mode: state.mode,
      coord: "origin top-left, x right, y down",
      resources: {
        metal: Number(state.resources.metal.toFixed(1)),
        crystal: Number(state.resources.crystal.toFixed(1)),
        deuterium: Number(state.resources.deuterium.toFixed(1)),
        perSec: {
          metal: Number(perSec.metal.toFixed(2)),
          crystal: Number(perSec.crystal.toFixed(2)),
          deuterium: Number(perSec.deuterium.toFixed(2)),
        },
      },
      buildings: buildingDefs.map((def, idx) => ({
        key: def.key,
        name: def.name,
        level: state.buildings[def.key],
        selected: idx === state.selectedIndex,
      })),
      queue,
      pullCooldown: Number(state.pullCooldown.toFixed(2)),
      pullReady: state.pullCooldown <= 0,
      advisorVisible: state.showAdvisor,
      advisor: state.lastAdvice,
      strategy: {
        index: state.focusIndex,
        name: strategyTracks[state.focusIndex].name,
      },
    });
  };

  window.advanceTime = (ms) => {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    const dt = ms / 1000 / steps;
    for (let i = 0; i < steps; i += 1) step(dt);
  };

  initStars();
  resizeCanvas();
  render();
  requestAnimationFrame(loop);
})();
