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
  // current: éppen felvitel alatt álló göb { locationId, sizeMm, answers, stepIndex, forcedTerminal }
  let state = { screen: "home", moduleId: null, nodules: [], current: null };

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
    return { locationId: null, sizeMm: undefined, answers: {}, stepIndex: 0, forcedTerminal: null };
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
    const recommendation = mod.recommendation(category.level, nodule.sizeMm);
    const finished = { ...nodule, points, category, recommendation };
    setState({ screen: "result", current: null, nodules: [...state.nodules, finished] });
  }

  function updateLastNoduleSize(mod, sizeMm) {
    const nodules = [...state.nodules];
    const last = { ...nodules[nodules.length - 1] };
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

  // Interaktív, kattintható pajzsmirigy-ábra: 2 lebeny (felső/középső/alsó
  // harmad) + isthmus (bal/jobb fél), lekerekített, stilizált kontúrral.
  function buildThyroidDiagramSvg(selectedLocationId) {
    const lobeTop = 30;
    const lobeH = 240;
    const lobeW = 90;
    const thirdH = lobeH / 3;
    const gap = 3;
    const rightLobeX = 40; // képen balra = anatómiailag JOBB lebeny
    const leftLobeX = 270; // képen jobbra = anatómiailag BAL lebeny
    const isthmusY = 150;
    const isthmusH = 60;
    const isthmusGap = 4;
    const midX = 200;
    const rightLobePath = "M143 38 C115 42 89 75 78 113 C65 157 77 205 95 245 C106 269 124 286 142 284 C161 281 170 264 167 239 L160 190 C156 170 158 151 171 133 L164 84 C160 57 154 40 143 38 Z";
    const leftLobePath = "M257 38 C285 42 311 75 322 113 C335 157 323 205 305 245 C294 269 276 286 258 284 C239 281 230 264 233 239 L240 190 C244 170 242 151 229 133 L236 84 C240 57 246 40 257 38 Z";
    const zoneClass = (id) => `thyroid-zone${selectedLocationId === id ? " selected" : ""}`;
    const lobeZones = (prefix) => `
      <g clip-path="url(#clip-${prefix})">
        <rect data-loc="${prefix}_felso" class="${zoneClass(`${prefix}_felso`)}" x="60" y="34" width="280" height="88" />
        <rect data-loc="${prefix}_kozepso" class="${zoneClass(`${prefix}_kozepso`)}" x="60" y="122" width="280" height="82" />
        <rect data-loc="${prefix}_also" class="${zoneClass(`${prefix}_also`)}" x="60" y="204" width="280" height="86" />
      </g>`;

    return `
      <svg viewBox="0 0 400 330" xmlns="http://www.w3.org/2000/svg" class="thyroid-svg" role="img" aria-label="Pajzsmirigy elölnézeti lokalizációs ábra">
        <defs>
          <clipPath id="clip-jobb"><path d="${rightLobePath}" /></clipPath>
          <clipPath id="clip-bal"><path d="${leftLobePath}" /></clipPath>
        </defs>

        <text x="122" y="20" text-anchor="middle" class="thyroid-label">JOBB</text>
        <text x="278" y="20" text-anchor="middle" class="thyroid-label">BAL</text>

        <path d="${rightLobePath}" class="thyroid-base" />
        <path d="${leftLobePath}" class="thyroid-base" />
        <path data-loc="isthmus_jobb" class="${zoneClass("isthmus_jobb")}" d="M151 142 C166 138 183 138 200 142 L200 188 C183 192 166 192 151 188 C158 171 158 157 151 142 Z" />
        <path data-loc="isthmus_bal" class="${zoneClass("isthmus_bal")}" d="M249 142 C234 138 217 138 200 142 L200 188 C217 192 234 192 249 188 C242 171 242 157 249 142 Z" />
        ${lobeZones("jobb")}
        ${lobeZones("bal")}

        <path d="${rightLobePath}" class="thyroid-outline" />
        <path d="${leftLobePath}" class="thyroid-outline" />
        <path d="M151 142 C166 138 183 138 200 142 C217 138 234 138 249 142" class="thyroid-outline thyroid-isthmus-outline" />
        <path d="M151 188 C166 192 183 192 200 188 C217 192 234 192 249 188" class="thyroid-outline thyroid-isthmus-outline" />

        <text x="200" y="316" text-anchor="middle" class="thyroid-hint">elölnézet — koppints a lokalizációra</text>
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
    help.textContent = "Add meg a göb legnagyobb átmérőjét és elhelyezkedését. Ez alapján számolja a rendszer a méretfüggő FNA/követési javaslatot, és ez kerül a riport fejlécébe.";
    app.appendChild(help);

    const wrap = document.createElement("div");
    wrap.className = "size-input-wrap";
    wrap.innerHTML = `
      <div class="size-input-row">
        <input type="number" inputmode="decimal" min="0" step="0.1" id="loc-size-input" placeholder="pl. 18" value="${state.current.sizeMm ?? ""}" />
        <span class="size-unit">mm</span>
      </div>
    `;
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
    const sizeVal = document.getElementById("loc-size-input")?.value;
    nextBtn.disabled = !(state.current.locationId && sizeVal);
    nextBtn.onclick = () => {
      const val = document.getElementById("loc-size-input").value;
      setState({
        screen: "question",
        current: { ...state.current, sizeMm: val ? parseFloat(val) : undefined, stepIndex: 0 },
      });
    };
    nav.appendChild(nextBtn);
    app.appendChild(nav);

    // Élő validáció + állapot szinkronizálása render nélkül, hogy a beírt érték
    // ne vesszen el, amikor a lokalizáció-választás újrarendereli a képernyőt.
    const sizeInput = document.getElementById("loc-size-input");
    sizeInput.oninput = () => {
      state.current.sizeMm = sizeInput.value ? parseFloat(sizeInput.value) : undefined;
      nextBtn.disabled = !(state.current.locationId && sizeInput.value);
    };
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
    sizeBox.innerHTML = `<label>Göb mérete (mm) — módosítható</label>
      <div class="size-input-row">
        <input type="number" inputmode="decimal" min="0" step="0.1" id="size-input-2" value="${nodule.sizeMm ?? ""}" placeholder="pl. 18" />
        <span class="size-unit">mm</span>
      </div>`;
    app.appendChild(sizeBox);
    document.getElementById("size-input-2").oninput = (e) => {
      const val = e.target.value;
      const sizeMm = val ? parseFloat(val) : undefined;
      updateLastNoduleSize(mod, sizeMm);
      const updated = state.nodules[state.nodules.length - 1];
      recBox.querySelector("p").textContent = updated.recommendation.action;
      recBox.querySelector(".detail").textContent = updated.recommendation.detail;
    };

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
