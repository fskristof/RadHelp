// Rectum tumor MRI staging - strukturált leletezési segéd
// Forrás: ESGAR 2026 rectalis MRI staging guideline / Radiology Assistant
// https://radiologyassistant.nl/abdomen/rectum/rectal-cancer-mr-staging-1-1
(function (registry) {
  const rectum = {
    id: "rectum-mri",
    type: "structured",
    name: "Rectum MRI staging",
    fullName: "Rectumtumor MRI staging (elsődleges, ESGAR 2026)",
    organ: "Kismedence / rectum",
    intro:
      "Strukturált leletezési segéd rectumtumor elsődleges (primer) MRI stagingjéhez, a 2026-os ESGAR strukturált riport-sablon és a Radiology Assistant alapján. Lépésről lépésre végigvezet a jelentés elemein, a végén egy összegző stádium-sort és egy vágólapra másolható, strukturált lelettervezetet ad.",
    exceptions: [
      "Csak elsődleges (primer, kezelés előtti) stagingra vonatkozik",
      "Neoadjuváns kezelés utáni restaging (yT, yEMVI, yMRF, mrTRG) ebben a verzióban nem szerepel",
      "Nem helyettesíti a saját intézményi riport-sablont, csak segédeszköz",
    ],

    // Egy "section" a wizard egy lépése, benne 1-N mezővel.
    sections: [
      {
        id: "morphology",
        title: "1. Morfológia és szöveti jelleg",
        fields: [
          {
            id: "morph",
            type: "select",
            required: true,
            label: "Morfológia",
            options: [
              { id: "polypoid", label: "Polypoid (nyeles)" },
              { id: "sessile", label: "Sessile (széles alapú / annularis falvastagodás)" },
            ],
          },
          {
            id: "signal",
            type: "select",
            required: true,
            label: "Szöveti szignál (T2W)",
            options: [
              { id: "solid", label: "Solid (intermedier jelintenzitású)" },
              { id: "mucinous", label: "Mucinosus (T2 hyperintenz)" },
              { id: "mixed", label: "Kevert (solid + mucinosus komponens)" },
            ],
          },
          {
            id: "signetRing",
            type: "checkbox",
            label: "Signet-ring sejtes carcinoma gyanúja (diffúz falvastagodás, „target” jel, mesorectalis zsír infiltráció)",
          },
        ],
      },
      {
        id: "location",
        title: "2. Lokalizáció",
        fields: [
          {
            id: "circumferentialType",
            type: "select",
            label: "Kerületi kiterjedés",
            options: [
              { id: "circularis", label: "Circularis (a teljes kerületet érinti)" },
              { id: "semicircularis", label: "Semicircularis (a kerület egy részét érinti)" },
              { id: "polypoid", label: "Polypoid (fokális, nyeles)" },
            ],
          },
          {
            id: "clockPosition",
            type: "text",
            label: "Körkörös elhelyezkedés",
            placeholder: "pl. 3-7h, bal anterolateralisan",
          },
          {
            id: "distanceReference",
            type: "select",
            required: true,
            default: "ar",
            label: "Távolságmérés referenciapontja",
            options: [
              { id: "ar", label: "Anorectalis junctio", reportPhrase: "Távolság az anorectalis junctiótól" },
              { id: "av", label: "Anal verge", reportPhrase: "Távolság az anal verge-től" },
            ],
          },
          {
            id: "distanceCm",
            type: "number",
            unit: "cm",
            required: true,
            label: "Tumor alsó szélének távolsága a választott referenciaponttól",
          },
          {
            id: "tumorLengthCm",
            type: "number",
            unit: "cm",
            label: "Tumor hossza (cranio-caudalis kiterjedés)",
          },
          {
            id: "sigmoidTakeOffRelation",
            type: "select",
            label: "Tumor alsó szélének helyzete a sigmoid take-offhoz képest",
            options: [
              { id: "below", label: "Alatta (rectumtumor)" },
              { id: "at", label: "Szintjében" },
              { id: "above", label: "Felette (sigmoid tumor)" },
            ],
          },
          {
            id: "peritonealRelation",
            type: "select",
            required: true,
            label: "Viszony a peritonealis reflexióhoz",
            options: [
              { id: "below", label: "Peritonealis reflexió alatt" },
              { id: "at", label: "Peritonealis reflexió szintjében" },
              { id: "above", label: "Peritonealis reflexió felett" },
            ],
          },
        ],
      },
      {
        id: "tcategory",
        title: "3. cT-kategória",
        fields: [
          {
            id: "tstage",
            type: "select",
            required: true,
            label: "T-kategória",
            options: [
              { id: "t1t2", label: "cT1–T2 (a rectumfalra korlátozódik)", code: "cT1–2" },
              { id: "t3a", label: "cT3a (<1 mm terjedés az izomrétegen túl)", code: "cT3a" },
              { id: "t3b", label: "cT3b (1–5 mm terjedés)", code: "cT3b" },
              { id: "t3c", label: "cT3c (5–15 mm terjedés)", code: "cT3c" },
              { id: "t3d", label: "cT3d (>15 mm terjedés)", code: "cT3d" },
              { id: "t4a", label: "cT4a (peritoneum / peritonealis reflexió infiltrációja)", code: "cT4a" },
              { id: "t4b", label: "cT4b (szomszédos szerv/struktúra infiltrációja)", code: "cT4b" },
            ],
          },
          {
            id: "t4bOrganCount",
            type: "number",
            unit: "db",
            label: "Infiltrált szomszédos szervek/struktúrák száma",
            showIf: (a) => a.tstage === "t4b",
          },
          {
            id: "t4bStructure",
            type: "text",
            label: "Mely szervek/struktúrák érintettek",
            placeholder: "pl. prostata, hüvely, os sacrum, ér",
            showIf: (a) => a.tstage === "t4b",
          },
        ],
      },
      {
        id: "mrf",
        title: "4. Mesorectalis fascia (MRF)",
        fields: [
          {
            id: "mrfStatus",
            type: "select",
            required: true,
            label: "MRF státusz",
            options: [
              { id: "neg", label: "MRF negatív (>1 mm biztonsági zóna)" },
              { id: "pos", label: "MRF pozitív (≤1 mm vagy direkt infiltráció)" },
            ],
          },
          {
            id: "mrfDistanceMm",
            type: "number",
            unit: "mm",
            label: "Legkisebb tumor–MRF távolság",
            showIf: (a) => a.mrfStatus === "neg",
          },
          {
            id: "mrfLocation",
            type: "text",
            label: "MRF érintettség lokalizációja",
            placeholder: "pl. 10h, kp. harmad",
            showIf: (a) => a.mrfStatus === "pos",
          },
        ],
      },
      {
        id: "emvi",
        title: "5. Extramuralis vascularis invázió (EMVI)",
        fields: [
          {
            id: "emviGrade",
            type: "select",
            required: true,
            label: "EMVI grade",
            options: [
              { id: "g0", label: "0 – nincs extramuralis nodularis terjedés" },
              { id: "g1", label: "1 – minimális nodularis terjedés/kötegezettség, nem ér közelében" },
              { id: "g2", label: "2 – kötegezettség ér közelében, ép kaliberű ér, nincs tumorjel az érben" },
              { id: "g3", label: "3 – tumorjel az érben, ép/enyhén tágult ér kontúrral" },
              { id: "g4", label: "4 – tumorjel az érben, egyértelmű kontúr-megszakítással / nodularis tágulattal" },
            ],
          },
        ],
      },
      {
        id: "sphincter",
        title: "6. Analis sphincter / medencefenék",
        fields: [
          {
            id: "sphincterInvolvement",
            type: "multiselect",
            required: true,
            label: "Érintettség",
            options: [
              { id: "none", label: "Nincs sphincter/medencefenék érintettség", exclusiveWithOthers: true },
              { id: "internal", label: "Belső sphincter érintett (T-kategóriát nem módosítja)" },
              { id: "external", label: "Külső sphincter érintett (→ cT4b)" },
              { id: "puborectalis", label: "Puborectalis izom érintett (→ cT4b)" },
              { id: "levator", label: "Levator ani érintett (→ cT4b)" },
            ],
          },
          {
            id: "sphincterSide",
            type: "text",
            label: "Oldaliság / kiterjedés",
            placeholder: "pl. jobb oldali, az analis csatorna felső harmada",
            showIf: (a) => (a.sphincterInvolvement || []).some((v) => v !== "none"),
          },
        ],
      },
      {
        id: "ncategory",
        title: "7. cN-kategória",
        fields: [
          {
            id: "nStatus",
            type: "select",
            required: true,
            label: "Nyirokcsomó státusz",
            options: [
              { id: "n0", label: "cN0 – nincs gyanús nyirokcsomó" },
              { id: "possible", label: "Lehetséges cN+ (borderline / kétes nyirokcsomó)" },
              { id: "npos", label: "cN+ – egyértelműen kóros nyirokcsomó" },
            ],
          },
          {
            id: "mesorectalSizeMm",
            type: "number",
            unit: "mm",
            label: "Legnagyobb mesorectalis nyirokcsomó rövid átmérője",
            showIf: (a) => a.nStatus && a.nStatus !== "n0",
          },
          {
            id: "highestNodeLevel",
            type: "text",
            label: "Legproximálisabb pozitív nyirokcsomó szintje",
            placeholder: "pl. az a. mesenterica inferior eredésénél",
            showIf: (a) => a.nStatus && a.nStatus !== "n0",
          },
          {
            id: "nodeCount9mm",
            type: "number",
            unit: "db",
            label: "Gyanús nyirokcsomók száma: ≥9 mm (vagy mucinosus jel)",
            showIf: (a) => a.nStatus && a.nStatus !== "n0",
          },
          {
            id: "nodeCount5to9mm",
            type: "number",
            unit: "db",
            label: "Gyanús nyirokcsomók száma: 5–9 mm + 2 malignus morfológiával",
            showIf: (a) => a.nStatus && a.nStatus !== "n0",
          },
          {
            id: "nodeCountUnder5mm",
            type: "number",
            unit: "db",
            label: "Gyanús nyirokcsomók száma: <5 mm + 3 malignus morfológia vagy mucinosus",
            showIf: (a) => a.nStatus && a.nStatus !== "n0",
          },
          {
            id: "lateralNodes",
            type: "checkbox",
            label: "Lateralis (obturator / a. iliaca interna) nyirokcsomó érintettség (>7 mm vagy mucinosus)",
          },
          {
            id: "lateralNodesDetail",
            type: "text",
            label: "Lateralis nyirokcsomó oldalisága, mérete, lokalizációja",
            placeholder: "pl. bal obturator, 9 mm",
            showIf: (a) => a.lateralNodes === true,
          },
          {
            id: "nNote",
            type: "text",
            label: "Egyéb megjegyzés az N-kategóriához",
            placeholder: "pl. a szokottnál több 5 mm alatti nyirokcsomó",
          },
        ],
      },
      {
        id: "deposits",
        title: "8. Tumor depositum",
        fields: [
          {
            id: "tumorDeposits",
            type: "select",
            required: true,
            label: "Tumor depositum",
            options: [
              { id: "no", label: "Nincs tumor depositum" },
              { id: "yes", label: "Tumor depositum gyanúja" },
            ],
          },
          {
            id: "depositLocation",
            type: "text",
            label: "Tumor depositum lokalizációja",
            placeholder: "pl. 9h, kp. harmad",
            showIf: (a) => a.tumorDeposits === "yes",
          },
        ],
      },
      {
        id: "mstage",
        title: "9. cM-kategória",
        fields: [
          {
            id: "mNonRegionalNode",
            type: "checkbox",
            label: "Nem regionalis (pl. externa/communis iliaca, paraaortalis) pozitív nyirokcsomó",
          },
          {
            id: "mOtherOrganCount",
            type: "number",
            unit: "db",
            label: "Egyéb metastasis-gyanús szerv/lokalizáció száma (a fentin kívül, peritoneum nélkül)",
          },
          {
            id: "mOtherOrganDetail",
            type: "text",
            label: "Mely szervek/lokalizációk",
            placeholder: "pl. ovarium",
            showIf: (a) => a.mOtherOrganCount != null && a.mOtherOrganCount !== "" && Number(a.mOtherOrganCount) > 0,
          },
          {
            id: "peritoneumInvolved",
            type: "checkbox",
            label: "Peritoneum érintett (peritonealis metastasis)",
          },
        ],
      },
      {
        id: "notes",
        title: "10. Egyéb megjegyzés",
        fields: [
          {
            id: "freeNote",
            type: "textarea",
            label: "Szabad szöveges megjegyzés",
            placeholder: "pl. technikai megjegyzés, mellékleletek",
          },
        ],
      },
    ],

    // Az összes mező egy laposra hozott listája (segédfüggvényekhez)
    allFields() {
      return this.sections.flatMap((s) => s.fields);
    },

    findField(id) {
      return this.allFields().find((f) => f.id === id);
    },

    // cM-alkategória (AJCC8): a T4b-nél megadott szomszédos szervi infiltráció
    // (közvetlen ráterjedés) NEM azonos a metastasissal, ezért ettől teljesen
    // függetlenül számoljuk — csak a ténylegesen metastasis-gyanús
    // lokalizációk (nem regionalis nyirokcsomó + egyéb szerv) és a peritoneum
    // alapján:
    //   cM0  — nincs metastasis-gyanús lelet
    //   cM1a — 1 szervben/lokalizációban metastasis, peritoneum nélkül
    //   cM1b — ≥2 szervben/lokalizációban metastasis, peritoneum nélkül
    //   cM1c — peritonealis metastasis (egyéb szervi metastasissal együtt is lehet)
    computeMetastaticOrganCount(a) {
      const other =
        a.mOtherOrganCount != null && a.mOtherOrganCount !== "" && !isNaN(Number(a.mOtherOrganCount))
          ? Number(a.mOtherOrganCount)
          : 0;
      return (a.mNonRegionalNode === true ? 1 : 0) + other;
    },

    computeMStatus(a) {
      if (a.peritoneumInvolved === true) return "m1c";
      const organCount = this.computeMetastaticOrganCount(a);
      if (organCount >= 2) return "m1b";
      if (organCount >= 1) return "m1a";
      return "m0";
    },

    // Kockázati besorolás a cikk "Low-risk / High-risk" kritériumai alapján.
    // cT4a és önmagában álló mesorectalis N+ NEM számít magas kockázatúnak
    // (ld. holland guideline megjegyzés a forrás oldalon).
    computeRisk(a) {
      const highRisk =
        a.tstage === "t4b" ||
        ["external", "puborectalis", "levator"].some((id) => (a.sphincterInvolvement || []).includes(id)) ||
        a.mrfStatus === "pos" ||
        a.lateralNodes === true ||
        ["g3", "g4"].includes(a.emviGrade) ||
        a.tumorDeposits === "yes" ||
        this.computeMStatus(a) !== "m0";
      return highRisk
        ? { level: "high", label: "Magas kockázatú (lokálisan előrehaladott)" }
        : { level: "low", label: "Nem lokálisan előrehaladott (alacsonyabb kockázatú)" };
    },

    // Rövid, TNM-szerű összegző sor
    buildSummaryLine(a) {
      const tField = this.findField("tstage");
      const tOpt = tField.options.find((o) => o.id === a.tstage);
      const parts = [];

      // Ha a sphincter/medencefenék érintettség cT4b-re módosítja a stádiumot,
      // csak a magasabb (végleges) cT-kategória szerepeljen, ne mindkettő.
      const sphincterUpgrade = ["external", "puborectalis", "levator"].some((id) =>
        (a.sphincterInvolvement || []).includes(id)
      );
      if (sphincterUpgrade && a.tstage !== "t4b") {
        parts.push("cT4b (sphincter/medencefenék invázió miatt)");
      } else if (tOpt) {
        parts.push(tOpt.code);
      }

      if (a.mrfStatus === "pos") parts.push("MRF+");
      else if (a.mrfStatus === "neg") parts.push("MRF−");

      if (["g3", "g4"].includes(a.emviGrade)) parts.push(`EMVI+ (grade ${a.emviGrade.replace("g", "")})`);
      else if (a.emviGrade) parts.push(`EMVI− (grade ${a.emviGrade.replace("g", "")})`);

      if (a.nStatus === "n0") parts.push("cN0");
      else if (a.nStatus === "possible") parts.push("lehetséges cN+");
      else if (a.nStatus === "npos") parts.push("cN+");
      if (a.lateralNodes) parts.push("lateralis nyirokcsomó+");

      if (a.tumorDeposits === "yes") parts.push("tumor depositum+");

      const mStatus = this.computeMStatus(a);
      const mCode = { m0: "cM0", m1a: "cM1a", m1b: "cM1b", m1c: "cM1c" }[mStatus];
      parts.push(mCode);

      if (a.peritoneumInvolved) parts.push("PERITONEUM ÉRINTETT (cM1c)");

      return parts.join(", ");
    },

    // Mező érték -> ember-olvasható szöveg (riporthoz és összegzéshez)
    formatFieldValue(field, value) {
      if (field.type === "select") {
        const opt = field.options.find((o) => o.id === value);
        return opt ? opt.label : null;
      }
      if (field.type === "multiselect") {
        const ids = value || [];
        if (!ids.length || (ids.length === 1 && ids[0] === "none")) return null;
        return ids
          .map((id) => field.options.find((o) => o.id === id)?.label)
          .filter(Boolean)
          .join("; ");
      }
      if (field.type === "checkbox") {
        return value ? field.label : null;
      }
      if (field.type === "number") {
        return value != null && value !== "" ? `${value} ${field.unit || ""}`.trim() : null;
      }
      // text / textarea
      return value ? String(value).trim() || null : null;
    },

    // A "Lokalizáció" szakasz sorai — a referenciapont + távolság egy sorba
    // vonva, a kért sorrendben (kerületi kiterjedés, óra, távolság, hossz,
    // sigmoid take-off, peritonealis reflexió).
    buildLocationLines(a) {
      const section = this.sections.find((s) => s.id === "location");
      const byId = (id) => section.fields.find((f) => f.id === id);
      const lines = [];

      const circ = this.formatFieldValue(byId("circumferentialType"), a.circumferentialType);
      if (circ) lines.push(`Kerületi kiterjedés: ${circ}`);

      const clock = this.formatFieldValue(byId("clockPosition"), a.clockPosition);
      if (clock) lines.push(`Körkörös elhelyezkedés: ${clock}`);

      if (a.distanceCm != null && a.distanceCm !== "") {
        const refOpt = byId("distanceReference").options.find((o) => o.id === a.distanceReference);
        const phrase = refOpt ? refOpt.reportPhrase : "Távolság a referenciaponttól";
        lines.push(`${phrase}: ${a.distanceCm} cm`);
      }

      const length = this.formatFieldValue(byId("tumorLengthCm"), a.tumorLengthCm);
      if (length) lines.push(`Tumor hossza: ${length}`);

      const sigmoid = this.formatFieldValue(byId("sigmoidTakeOffRelation"), a.sigmoidTakeOffRelation);
      if (sigmoid) lines.push(`Tumor alsó szélének helyzete a sigmoid take-offhoz képest: ${sigmoid}`);

      const perit = this.formatFieldValue(byId("peritonealRelation"), a.peritonealRelation);
      if (perit) lines.push(`Viszony a peritonealis reflexióhoz: ${perit}`);

      return lines;
    },

    // A "Tumor depositum" szakasz egyetlen sorban: "Tumor depositum: van (lokalizáció)" / "nincs"
    buildDepositsLines(a) {
      if (a.tumorDeposits === "yes") {
        const loc = a.depositLocation ? ` (${a.depositLocation})` : "";
        return [`Tumor depositum: van${loc}`];
      }
      if (a.tumorDeposits === "no") {
        return ["Tumor depositum: nincs"];
      }
      return [];
    },

    // A "cM-kategória" szakasz sorai: a metastasis-gyanús lokalizációk
    // (nem regionalis nyirokcsomó, egyéb szerv, peritoneum) felsorolása,
    // majd az ezekből számított cM0/cM1a/cM1b/cM1c végeredmény.
    // Fontos: ez független a T4b-nél megadott szomszédos szervi
    // infiltrációtól (közvetlen ráterjedés ≠ metastasis).
    buildMCategoryLines(a) {
      const lines = [];
      const nonRegional = this.formatFieldValue(this.findField("mNonRegionalNode"), a.mNonRegionalNode);
      if (nonRegional) lines.push(nonRegional);

      const otherCount = this.formatFieldValue(this.findField("mOtherOrganCount"), a.mOtherOrganCount);
      if (otherCount) lines.push(`Egyéb metastasis-gyanús szerv/lokalizáció száma: ${otherCount}`);

      const otherDetail = this.formatFieldValue(this.findField("mOtherOrganDetail"), a.mOtherOrganDetail);
      if (otherDetail) lines.push(`Egyéb metastasis-gyanús lokalizáció: ${otherDetail}`);

      const perit = this.formatFieldValue(this.findField("peritoneumInvolved"), a.peritoneumInvolved);
      if (perit) lines.push(perit);

      const mStatus = this.computeMStatus(a);
      const mLabels = {
        m0: "cM0 – nincs metastasis-gyanús lelet a vizsgálható régióban",
        m1a: "cM1a – metastasis 1 szervben/lokalizációban, peritonealis érintettség nélkül",
        m1b: "cM1b – metastasis ≥2 szervben/lokalizációban, peritonealis érintettség nélkül",
        m1c: "cM1c – peritonealis metastasis (egyéb szervi metastasissal együtt is előfordulhat)",
      };
      lines.push(`A vizsgálható régióban észlelt metastasis alapján (számítva): ${mLabels[mStatus]}`);

      return lines;
    },

    // Strukturált, vágólapra másolható lelettervezet — a feltételezett
    // radiológiai stádium (összegzés) a lelet végén szerepel.
    buildReportText(answers) {
      const risk = this.computeRisk(answers);
      const lines = [];
      lines.push("RECTUMTUMOR MRI STAGING (elsődleges)");
      lines.push("");

      this.sections.forEach((section) => {
        let fieldLines;
        if (section.id === "location") {
          fieldLines = this.buildLocationLines(answers);
        } else if (section.id === "deposits") {
          fieldLines = this.buildDepositsLines(answers);
        } else if (section.id === "mstage") {
          fieldLines = this.buildMCategoryLines(answers);
        } else {
          fieldLines = section.fields
            .map((f) => {
              const val = this.formatFieldValue(f, answers[f.id]);
              if (!val) return null;
              return f.type === "checkbox" ? val : `${f.label}: ${val}`;
            })
            .filter(Boolean);
        }
        if (fieldLines.length) {
          lines.push(section.title.replace(/^\d+\.\s*/, ""));
          fieldLines.forEach((l) => lines.push(l));
          lines.push("");
        }
      });

      lines.push(`A feltételezett radiológiai stádium: ${this.buildSummaryLine(answers)}`);
      lines.push(`Kockázati besorolás: ${risk.label}`);

      return lines.join("\n").trim();
    },
  };

  registry.register(rectum);
})(window.RadHelpRegistry);
