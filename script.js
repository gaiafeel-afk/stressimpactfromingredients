const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_KEY_STORAGE = "openai_api_key";

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
const apiKeyInput = document.getElementById("apiKeyInput");

const resultPlaceholder = document.getElementById("resultPlaceholder");
const resultPanel = document.getElementById("resultPanel");
const aiVerdictSection = document.getElementById("aiVerdictSection");
const aiVerdictText = document.getElementById("aiVerdictText");
const scoreValue = document.getElementById("scoreValue");
const meterFill = document.getElementById("meterFill");
const riskBadge = document.getElementById("riskBadge");
const summaryText = document.getElementById("summaryText");
const triggerList = document.getElementById("triggerList");
const supportList = document.getElementById("supportList");
const recommendationList = document.getElementById("recommendationList");

let selectedPhotoFile = null;
let photoAnalysis = null;
let photoAnalysisInFlight = false;

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
  syncPhotoButtonState();
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

function setAiVerdict(text) {
  if (!text) {
    aiVerdictSection.hidden = true;
    aiVerdictText.textContent = "";
    return;
  }

  aiVerdictSection.hidden = false;
  aiVerdictText.textContent = text;
}

function getOpenAiApiKey() {
  return apiKeyInput.value.trim();
}

function hasOpenAiKey() {
  const key = getOpenAiApiKey();
  return Boolean(key && key.startsWith("sk-"));
}

function getPhotoSignature(file) {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

function syncPhotoButtonState() {
  if (photoAnalysisInFlight) {
    photoButton.textContent = "Analyzing Photo...";
    photoButton.disabled = true;
    return;
  }

  if (submitButton.disabled) {
    photoButton.disabled = true;
    return;
  }

  photoButton.disabled = false;

  if (!selectedPhotoFile) {
    photoButton.textContent = "Use Photo";
    return;
  }

  const selectedSignature = getPhotoSignature(selectedPhotoFile);
  const isAlreadyAnalyzed = photoAnalysis?.signature === selectedSignature;
  if (isAlreadyAnalyzed) {
    photoButton.textContent = "Photo Ready (Change Photo)";
    return;
  }

  photoButton.textContent = hasOpenAiKey() ? "Analyze Photo" : "Analyze Photo (Add API Key)";
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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected photo."));
    reader.readAsDataURL(file);
  });
}

function getAssistantText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
  }
  return "";
}

function tryParseJson(text) {
  if (!text) {
    return null;
  }

  const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const fromFence = blockMatch ? blockMatch[1].trim() : text.trim();

  const firstBrace = fromFence.indexOf("{");
  const lastBrace = fromFence.lastIndexOf("}");
  const candidate =
    firstBrace >= 0 && lastBrace > firstBrace ? fromFence.slice(firstBrace, lastBrace + 1) : fromFence;

  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function extractIngredientsFromText(text) {
  const match = text.match(/ingredients?\s*:\s*(.+)/i);
  if (!match) {
    return "";
  }
  return match[1].trim();
}

async function analyzePhotoWithOpenAi(file, apiKey) {
  if (!apiKey || !apiKey.startsWith("sk-")) {
    throw new Error("Add a valid OpenAI API key first.");
  }

  const imageDataUrl = await fileToDataUrl(file);
  const requestBody = {
    model: OPENAI_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You analyze ingredient photos and answer with compact JSON only. No markdown code fences.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Read this ingredient label photo. Return strict JSON with keys verdict and ingredients. " +
              "verdict must be a concise plain-language stress-impact verdict under 60 words. " +
              "ingredients must be a comma-separated ingredient list as seen in the image. " +
              "If text is unreadable, set ingredients to an empty string and explain that in verdict.",
          },
          {
            type: "image_url",
            image_url: {
              url: imageDataUrl,
            },
          },
        ],
      },
    ],
  };

  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorTextRaw = await response.text();
    if (response.status === 401) {
      throw new Error("OpenAI rejected this API key (401). Paste a valid OpenAI `sk-...` key and try again.");
    }
    throw new Error(
      `AI processing failed (${response.status}). ${errorTextRaw.slice(0, 140) || "Please try again."}`
    );
  }

  const payload = await response.json();
  const assistantText = getAssistantText(payload);
  if (!assistantText) {
    throw new Error("AI returned an empty response.");
  }

  const parsed = tryParseJson(assistantText);
  const verdict = typeof parsed?.verdict === "string" ? parsed.verdict.trim() : assistantText;
  const ingredients =
    typeof parsed?.ingredients === "string" ? parsed.ingredients.trim() : extractIngredientsFromText(assistantText);

  return {
    verdict,
    ingredients,
  };
}

async function analyzeSelectedPhoto() {
  if (!selectedPhotoFile) {
    throw new Error("Please select a photo first.");
  }

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("Paste your OpenAI API key above, then tap Analyze Photo.");
  }

  const signature = getPhotoSignature(selectedPhotoFile);
  if (photoAnalysis?.signature === signature) {
    return photoAnalysis.result;
  }

  photoAnalysisInFlight = true;
  syncPhotoButtonState();

  try {
    setPhotoStatus("Uploading photo for AI processing...");
    const aiResult = await analyzePhotoWithOpenAi(selectedPhotoFile, apiKey);

    photoAnalysis = {
      signature,
      result: aiResult,
    };

    if (aiResult.verdict) {
      setAiVerdict(aiResult.verdict);
    }

    if (aiResult.ingredients) {
      ingredientsInput.value = aiResult.ingredients.trim();
    }

    setPhotoStatus("Photo processed by AI. Review ingredients and press Submit.");
    return aiResult;
  } finally {
    photoAnalysisInFlight = false;
    syncPhotoButtonState();
  }
}

photoButton.addEventListener("click", async () => {
  hideError();

  if (!selectedPhotoFile) {
    photoInput.click();
    return;
  }

  const selectedSignature = getPhotoSignature(selectedPhotoFile);
  const isAlreadyAnalyzed = photoAnalysis?.signature === selectedSignature;

  if (isAlreadyAnalyzed) {
    photoInput.click();
    return;
  }

  try {
    await analyzeSelectedPhoto();
  } catch (error) {
    showError(error.message || "Could not process the photo. Please try again.");
    setPhotoStatus("");
  }
});

photoInput.addEventListener("change", () => {
  selectedPhotoFile = photoInput.files?.[0] || null;
  photoAnalysis = null;
  setAiVerdict("");

  if (selectedPhotoFile) {
    photoMeta.hidden = false;
    photoMeta.textContent = `Selected photo: ${selectedPhotoFile.name}`;
    setPhotoStatus("Photo selected. Click Analyze Photo.");
  } else {
    photoMeta.hidden = true;
    photoMeta.textContent = "";
    setPhotoStatus("");
  }

  syncPhotoButtonState();
});

apiKeyInput.addEventListener("input", () => {
  const value = apiKeyInput.value.trim();
  if (value) {
    localStorage.setItem(OPENAI_KEY_STORAGE, value);
  } else {
    localStorage.removeItem(OPENAI_KEY_STORAGE);
  }
  syncPhotoButtonState();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError();
  setLoading(true);

  try {
    let rawText = ingredientsInput.value.trim();
    let verdictFromPhoto = "";

    if (selectedPhotoFile && hasOpenAiKey()) {
      const aiResult = await analyzeSelectedPhoto();
      verdictFromPhoto = aiResult.verdict;

      if (verdictFromPhoto) {
        setAiVerdict(verdictFromPhoto);
      }

      if (!rawText && aiResult.ingredients) {
        rawText = aiResult.ingredients.trim();
        ingredientsInput.value = rawText;
      }

      setPhotoStatus("Photo processed by AI.");
    } else if (selectedPhotoFile && !hasOpenAiKey() && !rawText) {
      showError("Add a valid OpenAI API key to analyze the photo, or paste ingredients manually.");
      setPhotoStatus("");
      return;
    } else if (selectedPhotoFile && !hasOpenAiKey() && rawText) {
      setPhotoStatus("Photo skipped because API key is missing. Used pasted ingredients.");
    } else {
      setAiVerdict("");
    }

    if (!rawText) {
      if (verdictFromPhoto) {
        showError("Photo verdict is ready. Paste or correct ingredients to generate the full score.");
      } else {
        showError("Add ingredients or upload a clear photo before submitting.");
      }
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
    showError(error.message || "Could not process the photo. Please try again or paste ingredients.");
    setPhotoStatus("");
  } finally {
    setLoading(false);
  }
});

apiKeyInput.value = localStorage.getItem(OPENAI_KEY_STORAGE) || "";
syncPhotoButtonState();
