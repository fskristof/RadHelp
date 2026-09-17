// ACR TI-RADS (Thyroid Imaging Reporting and Data System)
// Forrás: ACR TI-RADS (2017) és https://radiologyassistant.nl/head-neck/ti-rads/ti-rads
(function (registry) {
  const tirads = {
    id: "tirads",
    name: "TI-RADS",
    fullName: "Pajzsmirigy göb – ACR TI-RADS",
    organ: "Pajzsmirigy",
    intro:
      "Az ACR TI-RADS 5 ultrahang-jellemző alapján pontozza a pajzsmirigy göböket: összetétel, echogenitás, alak, szél, echogén gócok. A pontok összeadódnak, az összpontszám adja a TI-RADS kategóriát és a méret alapján a javasolt teendőt.",

    // Minden kérdés egy lépés a wizardban.
    // type: "single" -> csak egy válasz választható
    // type: "multi"  -> több válasz is választható (pontok összeadódnak) - echogén gócoknál
    questions: [
      {
        id: "composition",
        title: "1. Összetétel (Composition)",
        help: "Ha a göb cysticus vagy szivacsos (spongiform), a többi kategóriát nem kell értékelni – automatikusan TI-RADS 1 (benignus).",
        type: "single",
        options: [
          { id: "cystic", label: "Cysticus vagy majdnem teljesen cysticus", points: 0, terminal: "benign" },
          { id: "spongiform", label: "Szivacsos (spongiform) – ≥50% apró cysticus komponens", points: 0, terminal: "benign" },
          { id: "mixed", label: "Kevert cysticus/solid", points: 1 },
          { id: "solid", label: "Solid vagy majdnem teljesen solid (≥95%)", points: 2 },
        ],
      },
      {
        id: "echogenicity",
        title: "2. Echogenitás (Echogenicity)",
        help: "A pajzsmirigy parenchymához viszonyítva ítéljük meg. Ha nem ítélhető meg (pl. meszesedés miatt), alapesetben 1 pont.",
        type: "single",
        options: [
          { id: "anechoic", label: "Anechogén (fekete, cysticus jellegű)", points: 0 },
          { id: "hyperiso", label: "Hyperechogén vagy isoechogén", points: 1 },
          { id: "hypo", label: "Hypoechogén", points: 2 },
          { id: "markedly_hypo", label: "Kifejezetten (markedly) hypoechogén – echoszegényebb, mint az izom", points: 3 },
          { id: "indeterminate", label: "Nem ítélhető meg (pl. meszesedés takarása miatt)", points: 1 },
        ],
      },
      {
        id: "shape",
        title: "3. Alak (Shape)",
        help: "Axiális síkban értékelendő.",
        type: "single",
        options: [
          { id: "wider", label: "Szélesebb, mint magas (nem taller-than-wide)", points: 0 },
          { id: "taller", label: "Magasabb, mint széles (taller-than-wide)", points: 3 },
        ],
      },
      {
        id: "margin",
        title: "4. Szél (Margin)",
        help: "A göb elülső (anterior) részén legjobban megítélhető.",
        type: "single",
        options: [
          { id: "smooth", label: "Sima (smooth)", points: 0 },
          { id: "illdefined", label: "Elmosódott (ill-defined) – jóindulatú jel", points: 0 },
          { id: "lobulated", label: "Lebenyezett vagy szabálytalan (lobulated/irregular)", points: 2 },
          { id: "extrathyroidal", label: "Extrathyreoidealis terjedés (egyértelmű infiltráció)", points: 3 },
        ],
      },
      {
        id: "foci",
        title: "5. Echogén gócok (Echogenic foci)",
        help: "Ebben a kategóriában TÖBB válasz is kiválasztható egyszerre, a pontok összeadódnak (pl. punktált góc + rim calcificatio = 3+2 = 5 pont).",
        type: "multi",
        options: [
          { id: "none", label: "Nincs echogén góc, vagy nagy (>1mm) comet-tail artefaktum", points: 0, exclusiveWithOthers: true },
          { id: "macro", label: "Macrocalcificatio", points: 1 },
          { id: "rim", label: "Perifériás (rim) calcificatio", points: 2 },
          { id: "punctate", label: "Punktált echogén gócok / microcalcificatio (ill. <1mm comet-tail)", points: 3 },
        ],
      },
    ],

    // Kategória meghatározása pontszám alapján
    categorize(points) {
      if (points <= 0) return { level: "TR1", label: "TI-RADS 1 – Benignus", risk: "0,3%" };
      if (points === 2) return { level: "TR2", label: "TI-RADS 2 – Nem szuszpekt (not suspicious)", risk: "1,5%" };
      if (points === 3) return { level: "TR3", label: "TI-RADS 3 – Enyhén szuszpekt (mildly suspicious)", risk: "4,8%" };
      if (points >= 4 && points <= 6) return { level: "TR4", label: "TI-RADS 4 – Közepesen szuszpekt (moderately suspicious)", risk: "9,1%" };
      return { level: "TR5", label: "TI-RADS 5 – Erősen szuszpekt (highly suspicious)", risk: "35%" };
    },

    // Méret alapú javaslat (mm-ben) az ACR TI-RADS ajánlás szerint
    recommendation(level, sizeMm) {
      if (level === "TR1") {
        return {
          action: "Nincs FNA, nincs rutin követés javasolt.",
          detail: "Benignus göb (cysta / szivacsos göb) – további ultrahang-jellemzés nem szükséges.",
        };
      }
      if (level === "TR2") {
        return {
          action: "Nincs FNA javasolt.",
          detail: "Nem szuszpekt göb; rutin követés nem szükséges specifikusan e lelet miatt.",
        };
      }

      if (sizeMm == null || isNaN(sizeMm)) {
        return {
          action: "A végleges javaslathoz add meg a göb legnagyobb átmérőjét (mm).",
          detail: "A FNA és követési küszöbök a göbméret függvényében változnak.",
        };
      }

      if (sizeMm < 5) {
        return {
          action: "5 mm alatti göb esetén – függetlenül a TI-RADS kategóriától – nincs javasolt követés.",
          detail: "A klinikailag jelentős malignitás valószínűsége ilyen kis méretnél elhanyagolható.",
        };
      }

      if (level === "TR3") {
        if (sizeMm >= 25) {
          return { action: "FNA javasolt (≥2,5 cm).", detail: "TR3 göbnél a biopszia küszöbe 2,5 cm." };
        }
        if (sizeMm >= 15) {
          return { action: "Követés javasolt (≥1,5 cm), FNA nem szükséges még.", detail: "Ultrahang-kontroll 1, 3 és 5 év múlva." };
        }
        return { action: "Nincs FNA, nincs rutin követés javasolt (< 1,5 cm).", detail: "TR3 göbnél 1,5 cm alatt nincs specifikus teendő." };
      }

      if (level === "TR4") {
        if (sizeMm >= 15) {
          return { action: "FNA javasolt (≥1,5 cm).", detail: "TR4 göbnél a biopszia küszöbe 1,5 cm." };
        }
        if (sizeMm >= 10) {
          return { action: "Követés javasolt (≥1 cm), FNA nem szükséges még.", detail: "Ultrahang-kontroll 1, 2, 3 és 5 év múlva." };
        }
        return { action: "Nincs FNA, nincs rutin követés javasolt (< 1 cm).", detail: "TR4 göbnél 1 cm alatt nincs specifikus teendő." };
      }

      // TR5
      if (sizeMm >= 10) {
        return { action: "FNA javasolt (≥1 cm).", detail: "TR5 göbnél a biopszia küszöbe 1 cm." };
      }
      if (sizeMm >= 5) {
        return { action: "Követés javasolt (≥0,5 cm), FNA nem szükséges még.", detail: "Ultrahang-kontroll évente, 5 éven át." };
      }
      return { action: "Nincs FNA, nincs rutin követés javasolt (< 0,5 cm).", detail: "TR5 göbnél 0,5 cm alatt nincs specifikus teendő." };
    },

    exceptions: [
      "Gyermekkori páciens",
      "FDG-PET pozitív pajzsmirigy göb",
      "Nyaki lymphadenopathia jelenléte",
      "Ismert malignitási rizikófaktor (pl. MEN2 szindróma)",
    ],

    // Minden göbnél elsőként bekért méret + lokalizáció
    location: {
      sizeLabel: "Göb legnagyobb átmérője",
      options: [
        { id: "jobb_felso", label: "Jobb lebeny – felső harmad" },
        { id: "jobb_kozepso", label: "Jobb lebeny – középső harmad" },
        { id: "jobb_also", label: "Jobb lebeny – alsó harmad" },
        { id: "bal_felso", label: "Bal lebeny – felső harmad" },
        { id: "bal_kozepso", label: "Bal lebeny – középső harmad" },
        { id: "bal_also", label: "Bal lebeny – alsó harmad" },
        { id: "isthmus_jobb", label: "Isthmus – jobb oldal" },
        { id: "isthmus_bal", label: "Isthmus – bal oldal" },
      ],
    },

    locationLabel(locationId) {
      const opt = this.location.options.find((o) => o.id === locationId);
      return opt ? opt.label : "lokalizáció nem megadva";
    },

    // Strukturált szöveges összegzés egy göbről (vágólapra másoláshoz)
    buildReportText(nodule, index) {
      const sizeText =
        nodule.sizeMm != null && !isNaN(nodule.sizeMm) ? `${nodule.sizeMm} mm` : "méret nem megadva";
      const header = `${index}. göb – ${this.locationLabel(nodule.locationId)}, ${sizeText}`;
      const scoreLine = `${nodule.category.level}, malignitási kockázat ${nodule.category.risk}`;

      let featureLine;
      if (nodule.forcedTerminal) {
        featureLine = "Cysticus / szivacsos göb – a többi jellemző értékelése nem szükséges.";
      } else {
        const parts = this.questions
          .map((q) => {
            const chosen = nodule.answers[q.id] || [];
            const labels = chosen
              .map((id) => q.options.find((o) => o.id === id)?.label)
              .filter(Boolean);
            return labels.length ? labels.join(" + ") : null;
          })
          .filter(Boolean);
        featureLine = `Jellemzők: ${parts.join("; ")}`;
      }

      const recLine = `Javaslat: ${nodule.recommendation.action}`;

      return [header, scoreLine, featureLine, recLine].join("\n");
    },
  };

  registry.register(tirads);
})(window.RadHelpRegistry);
