(function () {
  const app = document.getElementById("app");
  const headerTitle = document.getElementById("header-title");
  const btnBack = document.getElementById("btn-back");
  const offlineBanner = document.getElementById("offline-banner");
  const toastEl = document.getElementById("toast");

  // State:
  // screen: 'home' | 'intro' | 'location' | 'question' | 'result'
  // moduleId: aktív scoring modul
  // nodules: lezárt (kiértékelt) göbök listája ebben a munkamenetben
  // current: éppen felvitel alatt álló göb { locationId, sizeDims, answers, stepIndex, forcedTerminal }
  // sizeDims: [x, y, z] — legfeljebb 3 megadott dimenzió (mm), a legnagyobb számít a javaslatnál
  let state = { screen: "home", moduleId: null, nodules: [], current: null };

  function maxDim(dims) {
    const nums = (dims || []).filter((v) => v != null && !isNaN(v));
    return nums.length ? Math.max(...nums) : undefined;
  }

  function setState(patch) {
    state = { ...state, ...patch };
    render();
  }

  function currentModule() {
    return window.RadHelpRegistry.get(state.moduleId);
  }

  function goHome() {
    state = { screen: "home", moduleId: null, nodules: [], current: null };
    render();
  }

  function startModule(moduleId) {
    setState({ screen: "intro", moduleId, nodules: [], current: null });
  }

  function freshNodule() {
    return { locationId: null, sizeDims: [undefined, undefined, undefined], answers: {}, stepIndex: 0, forcedTerminal: null };
  }

  function beginNodule() {
    setState({ screen: "location", current: freshNodule() });
  }

  function selectSingle(mod, question, optionId) {
    const answers = { ...state.current.answers, [question.id]: [optionId] };
    const opt = question.options.find((o) => o.id === optionId);
    if (opt && opt.terminal) {
      finalizeNodule(mod, { ...state.current, answers, forcedTerminal: opt.terminal });
      return;
    }
    advanceOrFinish(mod, answers);
  }

  function toggleMulti(mod, question, optionId) {
    const current = new Set(state.current.answers[question.id] || []);
    const opt = question.options.find((o) => o.id === optionId);
    const exclusiveId = question.options.find((o) => o.exclusiveWithOthers)?.id;

    if (opt.exclusiveWithOthers) {
      current.clear();
      current.add(optionId);
    } else {
      current.delete(exclusiveId);
      if (current.has(optionId)) current.delete(optionId);
      else current.add(optionId);
      if (current.size === 0 && exclusiveId) current.add(exclusiveId);
    }
    setState({ current: { ...state.current, answers: { ...state.current.answers, [question.id]: Array.from(current) } } });
  }

  function advanceOrFinish(mod, answers) {
    const nextIndex = state.current.stepIndex + 1;
    if (nextIndex >= mod.questions.length) {
      finalizeNodule(mod, { ...state.current, answers });
    } else {
      setState({ current: { ...state.current, answers, stepIndex: nextIndex } });
    }
  }

  function computeScore(mod, answers) {
    let points = 0;
    for (const q of mod.questions) {
      const chosen = answers[q.id] || [];
      for (const optId of chosen) {
        const opt = q.options.find((o) => o.id === optId);
        if (opt) points += opt.points;
      }
    }
    return points;
  }

  function finalizeNodule(mod, nodule) {
    const points = nodule.forcedTerminal ? 0 : computeScore(mod, nodule.answers);
    const category = mod.categorize(points);
    const sizeMm = maxDim(nodule.sizeDims);
    const recommendation = mod.recommendation(category.level, sizeMm);
    const finished = { ...nodule, sizeMm, points, category, recommendation };
    setState({ screen: "result", current: null, nodules: [...state.nodules, finished] });
  }

  function updateLastNoduleDims(mod, sizeDims) {
    const nodules = [...state.nodules];
    const last = { ...nodules[nodules.length - 1] };
    const sizeMm = maxDim(sizeDims);
    last.sizeDims = sizeDims;
    last.sizeMm = sizeMm;
    last.recommendation = mod.recommendation(last.category.level, sizeMm);
    nodules[nodules.length - 1] = last;
    state.nodules = nodules;
  }

  function goBack() {
    if (state.screen === "location") {
      if (state.nodules.length > 0) {
        setState({ screen: "result", current: null });
      } else {
        setState({ screen: "intro", current: null });
      }
      return;
    }
    if (state.screen === "question") {
      if (state.current.stepIndex === 0) {
        setState({ screen: "location" });
      } else {
        setState({ current: { ...state.current, stepIndex: state.current.stepIndex - 1 } });
      }
      return;
    }
    if (state.screen === "intro") {
      goHome();
      return;
    }
    goHome();
  }

  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("visible"), 2200);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast("Vágólapra másolva"))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      showToast("Vágólapra másolva");
    } catch (e) {
      showToast("Másolás sikertelen — jelöld ki kézzel");
    }
    document.body.removeChild(ta);
  }

  function buildFullReport(mod) {
    return state.nodules.map((n, i) => mod.buildReportText(n, i + 1)).join("\n\n");
  }

  // 3 mezős méret-bevitel (X × Y × Z mm) — nem kell mindet kitölteni,
  // a javaslatnál a legnagyobb megadott érték számít.
  function dimsInputsHtml(idPrefix, dims) {
    const v = (i) => (dims && dims[i] != null && !isNaN(dims[i]) ? dims[i] : "");
    return `
      <div class="size-input-row dims-row">
        <input type="number" inputmode="decimal" min="0" step="0.1" id="${idPrefix}-0" value="${v(0)}" />
        <span class="dims-sep">×</span>
        <input type="number" inputmode="decimal" min="0" step="0.1" id="${idPrefix}-1" value="${v(1)}" />
        <span class="dims-sep">×</span>
        <input type="number" inputmode="decimal" min="0" step="0.1" id="${idPrefix}-2" value="${v(2)}" />
        <span class="size-unit">mm</span>
      </div>
    `;
  }

  function readDimsInputs(idPrefix) {
    return [0, 1, 2].map((i) => {
      const el = document.getElementById(`${idPrefix}-${i}`);
      const val = el && el.value;
      return val ? parseFloat(val) : undefined;
    });
  }

  // Interaktív, kattintható pajzsmirigy-ábra: 2 KÜLÖN lebeny (egymással nem
  // érintkeznek), amelyeket csak az isthmus köt össze alul. Mindkét lebenyen
  // belül vékony szektorhatár-vonalak jelölik a felső/középső/alsó harmadot.
  function buildThyroidDiagramSvg(selectedLocationId) {
    const jobbLobePath =
      "M110 25 C60 20 28 65 25 120 C22 165 35 210 65 250 C85 272 115 278 140 270 " +
      "C150 260 152 230 150 200 C148 165 145 130 135 70 C128 40 122 28 110 25 Z";
    const balLobePath =
      "M290 25 C340 20 372 65 375 120 C378 165 365 210 335 250 C315 272 285 278 260 270 " +
      "C250 260 248 230 250 200 C252 165 255 130 265 70 C272 40 278 28 290 25 Z";

    const topY = 25;
    const bottomY = 274;
    const thirdY1 = topY + (bottomY - topY) / 3;
    const thirdY2 = topY + ((bottomY - topY) * 2) / 3;

    // Isthmus: érinti mindkét lebeny mediális szélét, középpontja a középső/alsó
    // harmad határán van (thirdY2).
    const isthmusH = 48;
    const isthmusY = thirdY2 - isthmusH / 2;
    const isthmusLeftX = 148;
    const isthmusMidX = 200;
    const isthmusRightX = 252;

    const zoneClass = (id) => `thyroid-zone${selectedLocationId === id ? " selected" : ""}`;
    const zone = (id, x, y, w, h, extra = "") =>
      `<rect data-loc="${id}" class="${zoneClass(id)}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}></rect>`;

    const lobeZones = (prefix, clipId) => `
      <g clip-path="url(#${clipId})">
        ${zone(`${prefix}_felso`, 0, topY, 400, thirdY1 - topY)}
        ${zone(`${prefix}_kozepso`, 0, thirdY1, 400, thirdY2 - thirdY1)}
        ${zone(`${prefix}_also`, 0, thirdY2, 400, bottomY - thirdY2)}
        <g class="thyroid-dividers">
          <line x1="0" y1="${thirdY1}" x2="400" y2="${thirdY1}" />
          <line x1="0" y1="${thirdY2}" x2="400" y2="${thirdY2}" />
        </g>
      </g>`;

    const isthmusBottomY = isthmusY + isthmusH;

    return `
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" class="thyroid-svg" role="img" aria-label="Pajzsmirigy elölnézeti lokalizációs ábra">
        <defs>
          <clipPath id="clip-jobb"><path d="${jobbLobePath}" /></clipPath>
          <clipPath id="clip-bal"><path d="${balLobePath}" /></clipPath>
        </defs>

        <text x="95" y="14" text-anchor="middle" class="thyroid-label">JOBB</text>
        <text x="305" y="14" text-anchor="middle" class="thyroid-label">BAL</text>

        <!-- Közös, vastag körvonal-réteg (alul) — a rákerülő kitöltések eltakarják
             a belső felét, így csak a teljes szerv valódi külső pereme látszik vastagnak. -->
        <g class="thyroid-outline-layer">
          <path d="${jobbLobePath}" />
          <path d="${balLobePath}" />
          <rect x="${isthmusLeftX}" y="${isthmusY}" width="${isthmusMidX - isthmusLeftX}" height="${isthmusH}" rx="4" />
          <rect x="${isthmusMidX}" y="${isthmusY}" width="${isthmusRightX - isthmusMidX}" height="${isthmusH}" rx="4" />
        </g>

        ${lobeZones("jobb", "clip-jobb")}
        ${lobeZones("bal", "clip-bal")}

        ${zone("isthmus_jobb", isthmusLeftX, isthmusY, isthmusMidX - isthmusLeftX, isthmusH, 'rx="4"')}
        ${zone("isthmus_bal", isthmusMidX, isthmusY, isthmusRightX - isthmusMidX, isthmusH, 'rx="4"')}

        <!-- Vékony elválasztók: isthmus <-> lebeny (fent/lent), és isthmus jobb/bal -->
        <g class="thyroid-dividers">
          <line x1="${isthmusLeftX}" y1="${isthmusY}" x2="${isthmusRightX}" y2="${isthmusY}" />
          <line x1="${isthmusLeftX}" y1="${isthmusBottomY}" x2="${isthmusRightX}" y2="${isthmusBottomY}" />
          <line x1="${isthmusMidX}" y1="${isthmusY}" x2="${isthmusMidX}" y2="${isthmusBottomY}" />
        </g>

        <text x="200" y="296" text-anchor="middle" class="thyroid-hint">elölnézet — koppints a lokalizációra</text>
      </svg>
    `;
  }

  function render() {
    btnBack.classList.toggle("hidden", state.screen === "home");
    app.innerHTML = "";

    if (state.screen === "home") return renderHome();
    if (state.screen === "intro") return renderIntro();
    if (state.screen === "location") return renderLocation();
    if (state.screen === "question") return renderQuestion();
    if (state.screen === "result") return renderResult();
  }

  function renderHome() {
    headerTitle.textContent = "RadHelp";
    const list = document.createElement("div");
    list.className = "module-list";
    window.RadHelpRegistry.all().forEach((mod) => {
      const card = document.createElement("button");
      card.className = "module-card";
      card.innerHTML = `<h2>${mod.name}</h2><p>${mod.fullName} · ${mod.organ}</p>`;
      card.onclick = () => startModule(mod.id);
      list.appendChild(card);
    });
    app.appendChild(list);
  }

  function renderIntro() {
    const mod = currentModule();
    headerTitle.textContent = mod.name;

    const intro = document.createElement("div");
    intro.className = "intro-box";
    intro.innerHTML = `<strong>${mod.fullName}</strong><br/><br/>${mod.intro}`;
    app.appendChild(intro);

    if (mod.exceptions && mod.exceptions.length) {
      const exc = document.createElement("div");
      exc.className = "exceptions-box";
      exc.innerHTML = `<h3>⚠ Nem alkalmazható, ha:</h3><ul>${mod.exceptions
        .map((e) => `<li>${e}</li>`)
        .join("")}</ul>`;
      app.appendChild(exc);
    }

    const nav = document.createElement("div");
    nav.className = "nav-buttons";
    const startBtn = document.createElement("button");
    startBtn.className = "btn btn-primary";
    startBtn.textContent = "Kezdés – 1. göb";
    startBtn.style.flex = "1";
    startBtn.onclick = beginNodule;
    nav.appendChild(startBtn);
    app.appendChild(nav);
  }

  function renderProgress(current, total) {
    const track = document.createElement("div");
    track.className = "progress-track";
    const fill = document.createElement("div");
    fill.className = "progress-fill";
    fill.style.width = `${(current / total) * 100}%`;
    track.appendChild(fill);
    app.appendChild(track);
  }

  function renderLocation() {
    const mod = currentModule();
    headerTitle.textContent = mod.name;

    const noduleNumber = state.nodules.length + 1;

    const title = document.createElement("h2");
    title.className = "step-title";
    title.textContent = `${noduleNumber}. göb – méret és lokalizáció`;
    app.appendChild(title);

    const help = document.createElement("p");
    help.className = "step-help";
    help.textContent = "Add meg a göb méretét és elhelyezkedését. Nagyobb göbnél akár 3 dimenziót is megadhatsz — nem kell mindet kitölteni, a javaslatnál a legnagyobb megadott érték számít. Ez kerül a riport fejlécébe.";
    app.appendChild(help);

    const wrap = document.createElement("div");
    wrap.className = "size-input-wrap";
    wrap.innerHTML = dimsInputsHtml("loc-dim", state.current.sizeDims);
    app.appendChild(wrap);

    const locTitle = document.createElement("p");
    locTitle.className = "step-help";
    locTitle.style.marginTop = "18px";
    locTitle.textContent = "Lokalizáció — koppints a göb helyére a pajzsmirigy ábrán:";
    app.appendChild(locTitle);

    const diagramWrap = document.createElement("div");
    diagramWrap.className = "thyroid-diagram-wrap";
    diagramWrap.innerHTML = buildThyroidDiagramSvg(state.current.locationId);
    diagramWrap.addEventListener("click", (e) => {
      const zone = e.target.closest("[data-loc]");
      if (!zone) return;
      setState({ current: { ...state.current, locationId: zone.getAttribute("data-loc") } });
    });
    app.appendChild(diagramWrap);

    const selectedLabel = document.createElement("p");
    selectedLabel.className = "thyroid-selected-label";
    selectedLabel.textContent = state.current.locationId
      ? `Kiválasztva: ${mod.locationLabel(state.current.locationId)}`
      : "Még nincs kiválasztva göb-elhelyezkedés";
    app.appendChild(selectedLabel);

    const nav = document.createElement("div");
    nav.className = "nav-buttons";
    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-primary";
    nextBtn.textContent = "Tovább a jellemzőkhöz";
    nextBtn.disabled = !(state.current.locationId && maxDim(readDimsInputs("loc-dim")) != null);
    nextBtn.onclick = () => {
      const sizeDims = readDimsInputs("loc-dim");
      setState({
        screen: "question",
        current: { ...state.current, sizeDims, stepIndex: 0 },
      });
    };
    nav.appendChild(nextBtn);
    app.appendChild(nav);

    // Élő validáció + állapot szinkronizálása render nélkül, hogy a beírt érték
    // ne vesszen el, amikor a lokalizáció-választás újrarendereli a képernyőt.
    [0, 1, 2].forEach((i) => {
      const input = document.getElementById(`loc-dim-${i}`);
      input.oninput = () => {
        const dims = readDimsInputs("loc-dim");
        state.current.sizeDims = dims;
        nextBtn.disabled = !(state.current.locationId && maxDim(dims) != null);
      };
    });
  }

  function renderQuestion() {
    const mod = currentModule();
    headerTitle.textContent = mod.name;
    const q = mod.questions[state.current.stepIndex];

    renderProgress(state.current.stepIndex, mod.questions.length);

    const title = document.createElement("h2");
    title.className = "step-title";
    title.textContent = q.title;
    app.appendChild(title);

    if (q.help) {
      const help = document.createElement("p");
      help.className = "step-help";
      help.textContent = q.help;
      app.appendChild(help);
    }

    if (q.type === "multi") {
      const hint = document.createElement("p");
      hint.className = "multi-hint";
      hint.textContent = "Több válasz is kiválasztható";
      app.appendChild(hint);
    }

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "options";

    const selected = new Set(state.current.answers[q.id] || []);

    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "option-btn" + (selected.has(opt.id) ? " selected" : "");
      btn.innerHTML = `
        <span class="option-check">${selected.has(opt.id) ? "✓" : ""}</span>
        <span>${opt.label}</span>
        <span class="option-points">${opt.points > 0 ? "+" + opt.points + " pt" : "0 pt"}</span>
      `;
      btn.onclick = () => {
        if (q.type === "multi") {
          toggleMulti(mod, q, opt.id);
        } else {
          selectSingle(mod, q, opt.id);
        }
      };
      optionsWrap.appendChild(btn);
    });
    app.appendChild(optionsWrap);

    if (q.type === "multi") {
      const nav = document.createElement("div");
      nav.className = "nav-buttons";
      const nextBtn = document.createElement("button");
      nextBtn.className = "btn btn-primary";
      nextBtn.textContent = "Tovább";
      nextBtn.disabled = !(state.current.answers[q.id] && state.current.answers[q.id].length);
      nextBtn.onclick = () => advanceOrFinish(mod, state.current.answers);
      nav.appendChild(nextBtn);
      app.appendChild(nav);
    }
  }

  function renderResult() {
    const mod = currentModule();
    headerTitle.textContent = "Eredmény";

    const nodule = state.nodules[state.nodules.length - 1];
    const noduleIndex = state.nodules.length;
    const cat = nodule.category;

    const card = document.createElement("div");
    card.className = "result-card " + cat.level.toLowerCase();
    card.innerHTML = `
      <p class="result-points" style="margin-top:0">${noduleIndex}. göb – ${mod.locationLabel(nodule.locationId)}</p>
      <p class="result-level">${cat.level}</p>
      <p class="result-label">${cat.label}</p>
      <p class="result-points">${nodule.points} pont</p>
      <p class="result-risk">Malignitási kockázat: ${cat.risk}</p>
    `;
    app.appendChild(card);

    const recBox = document.createElement("div");
    recBox.className = "recommendation-box";
    recBox.innerHTML = `
      <h3>Javaslat</h3>
      <p>${nodule.recommendation.action}</p>
      <p class="detail">${nodule.recommendation.detail}</p>
    `;
    app.appendChild(recBox);

    const sizeBox = document.createElement("div");
    sizeBox.className = "size-edit-box";
    sizeBox.innerHTML = `<label>Göb mérete — módosítható</label>${dimsInputsHtml("res-dim", nodule.sizeDims)}`;
    app.appendChild(sizeBox);
    [0, 1, 2].forEach((i) => {
      document.getElementById(`res-dim-${i}`).oninput = () => {
        const sizeDims = readDimsInputs("res-dim");
        updateLastNoduleDims(mod, sizeDims);
        const updated = state.nodules[state.nodules.length - 1];
        recBox.querySelector("p").textContent = updated.recommendation.action;
        recBox.querySelector(".detail").textContent = updated.recommendation.detail;
      };
    });

    if (!nodule.forcedTerminal) {
      const summary = document.createElement("div");
      summary.className = "summary-box";
      summary.innerHTML = "<h3>Összegzés</h3>";
      mod.questions.forEach((q) => {
        const chosen = nodule.answers[q.id] || [];
        const labels = chosen
          .map((id) => q.options.find((o) => o.id === id)?.label)
          .filter(Boolean)
          .join(", ");
        const row = document.createElement("div");
        row.className = "summary-row";
        row.innerHTML = `<span class="label">${q.title.replace(/^\d+\.\s*/, "")}</span><span class="value">${labels || "—"}</span>`;
        summary.appendChild(row);
      });
      app.appendChild(summary);
    }

    if (state.nodules.length > 1) {
      const storedBox = document.createElement("div");
      storedBox.className = "summary-box";
      storedBox.innerHTML = `<h3>Eddig rögzített göbök (${state.nodules.length})</h3>`;
      state.nodules.forEach((n, i) => {
        const row = document.createElement("div");
        row.className = "summary-row";
        row.innerHTML = `<span class="label">${i + 1}. ${mod.locationLabel(n.locationId)}</span><span class="value">${n.category.level}</span>`;
        storedBox.appendChild(row);
      });
      app.appendChild(storedBox);
    }

    const nav = document.createElement("div");
    nav.className = "nav-buttons";
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-secondary";
    addBtn.textContent = "+ Új göb hozzáadása";
    addBtn.onclick = beginNodule;
    const copyBtn = document.createElement("button");
    copyBtn.className = "btn btn-primary";
    copyBtn.textContent = "Másolás vágólapra";
    copyBtn.onclick = () => copyToClipboard(buildFullReport(mod));
    nav.appendChild(addBtn);
    nav.appendChild(copyBtn);
    app.appendChild(nav);

    const nav2 = document.createElement("div");
    nav2.className = "nav-buttons";
    const homeBtn = document.createElement("button");
    homeBtn.className = "btn btn-secondary";
    homeBtn.textContent = "Kilépés a főoldalra";
    homeBtn.onclick = goHome;
    nav2.appendChild(homeBtn);
    app.appendChild(nav2);
  }

  btnBack.onclick = goBack;

  // Offline állapot jelzése
  function updateOnlineStatus() {
    offlineBanner.classList.toggle("hidden", navigator.onLine);
  }
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();

  // Service worker regisztráció (offline támogatás)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  render();
})();
