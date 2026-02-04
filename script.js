const TRIGGERS = [
  {
    id: "sugars",
    label: "Added sugars",
    impact: 14,
    why: "Can create blood-sugar spikes and crashes linked with tension and mood swings.",
    tip: "Choose products with lower added sugar or natural sweetness from whole foods.",
    keywords: [
      "sugar",
      "sucrose",
      "dextrose",
      "maltose",
      "high fructose corn syrup",
      "corn syrup",
      "glucose syrup",
      "invert sugar",
      "fructose syrup",
    ],
  },
  {
    id: "caffeine",
    label: "Stimulants (caffeine family)",
    impact: 12,
    why: "May push alertness too high, which can worsen anxious or wired feelings.",
    tip: "Switch to low-caffeine alternatives, especially later in the day.",
    keywords: ["caffeine", "guarana", "yerba mate", "coffee extract", "green coffee", "kola nut"],
  },
  {
    id: "sweeteners",
    label: "Artificial sweeteners",
    impact: 10,
    why: "Some people report headaches, cravings, or nervous-system sensitivity.",
    tip: "Test short periods without artificial sweeteners and compare how you feel.",
    keywords: ["aspartame", "sucralose", "acesulfame", "saccharin", "neotame"],
  },
  {
    id: "flavors",
    label: "Flavor enhancers",
    impact: 7,
    why: "Highly processed flavor systems can increase overall additive load.",
    tip: "Look for simpler ingredient decks with fewer flavor additives.",
    keywords: ["msg", "monosodium glutamate", "disodium inosinate", "yeast extract", "artificial flavor"],
  },
  {
    id: "dyes",
    label: "Synthetic colors",
    impact: 6,
    why: "Certain synthetic dyes are often flagged by sensitive consumers.",
    tip: "Prefer products colored with fruit, vegetable, or spice extracts.",
    keywords: ["red 40", "yellow 5", "yellow 6", "blue 1", "blue 2", "caramel color"],
  },
  {
    id: "preservatives",
    label: "Preservative-heavy profile",
    impact: 6,
    why: "A higher preservative load can signal a more ultra-processed formulation.",
    tip: "When possible, choose fresher options with shorter ingredient lists.",
    keywords: ["sodium benzoate", "potassium sorbate", "bht", "bha", "propyl gallate"],
  },
  {
    id: "alcohol",
    label: "Alcohol-based ingredients",
    impact: 11,
    why: "Alcohol can disrupt sleep quality and next-day stress resilience.",
    tip: "Use lower-alcohol alternatives when stress and sleep are a priority.",
    keywords: ["alcohol", "ethanol", "wine", "vodka", "rum", "beer"],
  },
];

const SUPPORTERS = [
  {
    id: "magnesium",
    label: "Magnesium source",
    impact: 8,
    why: "Often used in stress-support formulas for relaxation support.",
    tip: "Keep this ingredient and pair it with sleep-friendly habits.",
    keywords: ["magnesium glycinate", "magnesium citrate", "magnesium"],
  },
  {
    id: "theanine",
    label: "L-theanine",
    impact: 9,
    why: "Can support calm focus without heavy sedation for many people.",
    tip: "This is a positive ingredient for many stress-management formulas.",
    keywords: ["l-theanine", "theanine"],
  },
  {
    id: "chamomile",
    label: "Chamomile",
    impact: 7,
    why: "Traditionally used to support relaxation and better wind-down.",
    tip: "A useful calming botanical to keep in evening products.",
    keywords: ["chamomile", "matricaria"],
  },
  {
    id: "ashwagandha",
    label: "Ashwagandha",
    impact: 7,
    why: "Common adaptogen in stress-support products.",
    tip: "Can be a strong marketing-friendly calm-support ingredient.",
    keywords: ["ashwagandha", "withania"],
  },
  {
    id: "fiber",
    label: "Fiber-rich base ingredients",
    impact: 5,
    why: "Fiber and complex carbs can support steadier energy patterns.",
    tip: "Keep these as lead ingredients where possible.",
    keywords: ["oat", "quinoa", "lentil", "chickpea", "flaxseed", "chia seed", "psyllium", "inulin"],
  },
];

const STOP_WORDS = new Set([
  "ingredients",
  "contains",
  "may contain",
  "nutrition facts",
  "serving size",
  "daily value",
  "recommended use",
]);

const form = document.getElementById("checkerForm");
const ingredientsInput = document.getElementById("ingredientsInput");
const jarCheckbox = document.getElementById("jarCheckbox");
const submitButton = document.getElementById("submitButton");
const errorText = document.getElementById("errorText");

const photoInput = document.getElementById("photoInput");
const photoButton = document.getElementById("photoButton");
const photoMeta = document.getElementById("photoMeta");
const photoStatus = document.getElementById("photoStatus");

const resultPlaceholder = document.getElementById("resultPlaceholder");
const resultPanel = document.getElementById("resultPanel");
const scoreValue = document.getElementById("scoreValue");
const meterFill = document.getElementById("meterFill");
const riskBadge = document.getElementById("riskBadge");
const summaryText = document.getElementById("summaryText");
const triggerList = document.getElementById("triggerList");
const supportList = document.getElementById("supportList");
const recommendationList = document.getElementById("recommendationList");

let selectedPhotoFile = null;

function showError(message) {
  errorText.hidden = false;
  errorText.textContent = message;
}

function hideError() {
  errorText.hidden = true;
  errorText.textContent = "";
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Analyzing..." : "Submit";
}

function setPhotoStatus(message) {
  if (!message) {
    photoStatus.hidden = true;
    photoStatus.textContent = "";
    return;
  }
  photoStatus.hidden = false;
  photoStatus.textContent = message;
}

function parseIngredients(rawText) {
  const dedupe = new Set();
  let cleaned = rawText.replace(/\r/g, "\n");

  const markerMatch = cleaned.match(/ingredients\s*:/i);
  if (markerMatch && markerMatch.index !== undefined) {
    cleaned = cleaned.slice(markerMatch.index + markerMatch[0].length);
  }

  cleaned = cleaned.replace(/[()]/g, ",");

  return cleaned
    .split(/[\n,;]+/)
    .map((item) => item.replace(/^[\-\u2022\s\d.]+/, "").trim())
    .map((item) => item.replace(/\s+/g, " "))
    .filter((item) => item.length > 1)
    .filter((item) => !STOP_WORDS.has(item.toLowerCase()))
    .filter((item) => {
      const key = normalizeIngredient(item);
      if (!key || dedupe.has(key)) {
        return false;
      }
      dedupe.add(key);
      return true;
    });
}

function normalizeIngredient(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+\-\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getConcentrationFactor(index, total) {
  if (total <= 1) return 1;
  const ratio = index / (total - 1);
  return 1.35 - ratio * 0.7;
}

function findRule(ingredient, library) {
  return library.find((rule) =>
    rule.keywords.some((keyword) => ingredient.includes(keyword.toLowerCase()))
  );
}

function createFallbackMessage(type) {
  if (type === "trigger") {
    return ["No major stress-linked trigger ingredients were confidently detected."];
  }
  return ["No clear calming or stress-support ingredients were detected."];
}

function deriveRisk(score) {
  if (score < 25) {
    return {
      id: "low",
      label: "Low stress impact",
      summary: "This formula appears relatively stress-friendly for most consumers.",
    };
  }
  if (score < 45) {
    return {
      id: "mild",
      label: "Mild stress impact",
      summary: "This product has a few ingredients that may slightly raise stress load.",
    };
  }
  if (score < 70) {
    return {
      id: "elevated",
      label: "Elevated stress impact",
      summary: "This formula includes multiple ingredients commonly linked to stress sensitivity.",
    };
  }
  return {
    id: "high",
    label: "High stress impact",
    summary: "This ingredient list is likely to feel activating for stress-sensitive consumers.",
  };
}

function scoreIngredients(ingredients, comesInJar) {
  const triggerHits = [];
  const supportHits = [];

  let triggerScore = 0;
  let supportScore = 0;

  ingredients.forEach((ingredient, index) => {
    const normalized = normalizeIngredient(ingredient);
    const concentrationFactor = getConcentrationFactor(index, ingredients.length);

    const trigger = findRule(normalized, TRIGGERS);
    if (trigger) {
      const points = trigger.impact * concentrationFactor;
      triggerScore += points;
      if (!triggerHits.some((item) => item.rule.id === trigger.id)) {
        triggerHits.push({ ingredient, rule: trigger, points });
      }
      return;
    }

    const supporter = findRule(normalized, SUPPORTERS);
    if (supporter) {
      const points = supporter.impact * concentrationFactor;
      supportScore += points;
      if (!supportHits.some((item) => item.rule.id === supporter.id)) {
        supportHits.push({ ingredient, rule: supporter, points });
      }
    }
  });

  if (comesInJar) {
    triggerScore += 3;
  }

  let rawScore = 18 + triggerScore - supportScore * 0.85;
  if (triggerHits.length === 0 && supportHits.length === 0) {
    rawScore = 22;
  }

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const risk = deriveRisk(score);

  const recommendations = new Set();
  triggerHits.slice(0, 3).forEach((item) => recommendations.add(item.rule.tip));
  supportHits.slice(0, 2).forEach((item) => recommendations.add(item.rule.tip));
  if (comesInJar) {
    recommendations.add("Jar packaging can increase air and light exposure after opening.");
  }

  if (risk.id === "elevated" || risk.id === "high") {
    recommendations.add("Prioritize shorter ingredient lists and fewer stimulant additives.");
  } else {
    recommendations.add("Keep testing lower-additive alternatives to maintain a stress-friendly profile.");
  }

  const topTrigger = triggerHits[0];
  const summary = topTrigger
    ? `${risk.summary} Top concern detected: ${topTrigger.rule.label.toLowerCase()}.`
    : risk.summary;

  return {
    score,
    risk,
    summary,
    triggerItems:
      triggerHits.length > 0
        ? triggerHits
            .sort((a, b) => b.points - a.points)
            .slice(0, 5)
            .map((hit) => `${hit.rule.label}: ${hit.rule.why}`)
        : createFallbackMessage("trigger"),
    supportItems:
      supportHits.length > 0
        ? supportHits
            .sort((a, b) => b.points - a.points)
            .slice(0, 5)
            .map((hit) => `${hit.rule.label}: ${hit.rule.why}`)
        : createFallbackMessage("support"),
    recommendationItems: Array.from(recommendations).slice(0, 5),
  };
}

function renderList(target, items) {
  target.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function renderResult(result) {
  resultPlaceholder.hidden = true;
  resultPanel.hidden = false;

  scoreValue.textContent = `${result.score}/100`;
  meterFill.style.width = `${result.score}%`;

  riskBadge.className = `risk-badge ${result.risk.id}`;
  riskBadge.textContent = result.risk.label;
  summaryText.textContent = result.summary;

  renderList(triggerList, result.triggerItems);
  renderList(supportList, result.supportItems);
  renderList(recommendationList, result.recommendationItems);
}

async function extractTextFromPhoto(file) {
  if (!window.Tesseract) {
    throw new Error("OCR is unavailable in this browser. Please paste ingredients manually.");
  }

  const result = await window.Tesseract.recognize(file, "eng", {
    logger: (message) => {
      if (message.status === "recognizing text") {
        const pct = Math.round((message.progress || 0) * 100);
        setPhotoStatus(`Reading photo text... ${pct}%`);
      }
    },
  });

  return result?.data?.text || "";
}

photoButton.addEventListener("click", () => {
  photoInput.click();
});

photoInput.addEventListener("change", () => {
  selectedPhotoFile = photoInput.files?.[0] || null;
  if (selectedPhotoFile) {
    photoMeta.hidden = false;
    photoMeta.textContent = `Selected photo: ${selectedPhotoFile.name}`;
  } else {
    photoMeta.hidden = true;
    photoMeta.textContent = "";
  }
  setPhotoStatus("");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError();
  setLoading(true);

  try {
    let rawText = ingredientsInput.value.trim();

    if (!rawText && selectedPhotoFile) {
      setPhotoStatus("Reading ingredient text from your photo...");
      rawText = (await extractTextFromPhoto(selectedPhotoFile)).trim();
      if (rawText) {
        ingredientsInput.value = rawText;
        setPhotoStatus("Photo read complete. Review the text and edit if needed.");
      }
    }

    if (!rawText) {
      showError("Add ingredients or upload a clear photo before submitting.");
      setPhotoStatus("");
      return;
    }

    const parsedIngredients = parseIngredients(rawText);
    if (parsedIngredients.length === 0) {
      showError("Could not detect ingredient names. Please paste a clearer list.");
      setPhotoStatus("");
      return;
    }

    const result = scoreIngredients(parsedIngredients, jarCheckbox.checked);
    renderResult(result);
    setPhotoStatus("");
  } catch (error) {
    showError(error.message || "Could not read the photo. Please paste ingredients manually.");
    setPhotoStatus("");
  } finally {
    setLoading(false);
  }
});
