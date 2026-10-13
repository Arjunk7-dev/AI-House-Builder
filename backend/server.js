
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const apiKey = process.env.GEMINI_API_KEY?.trim();
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --------------------------------------------------
// 1. HEALTH CHECK
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI House Builder Backend Running",
    model: MODEL,
    geminiConfigured: Boolean(genAI),
  });
});

// --------------------------------------------------
// 2. HELPERS
// --------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatus(error) {
  const candidates = [
    error?.status,
    error?.statusCode,
    error?.code,
    error?.response?.status,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value >= 400 && value <= 599) {
      return value;
    }
  }

  const message = String(error?.message || "");
  const match = message.match(/\b(400|401|403|404|408|429|500|502|503|504)\b/);
  return match ? Number(match[1]) : null;
}

async function retryGeminiRequest(requestFn, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      const status = getErrorStatus(error);

      const retryable =
        status === 408 ||
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504;

      if (!retryable || attempt === maxRetries) {
        throw error;
      }

      // 1s, 2s, 4s; small jitter helps avoid synchronized retries.
      const delay = 1000 * 2 ** attempt + Math.floor(Math.random() * 300);

      console.warn(
        `Gemini returned ${status}. Retry ${attempt + 1}/${maxRetries} in ${delay}ms.`
      );

      await sleep(delay);
    }
  }

  throw new Error("Gemini request failed after retries.");
}

// --------------------------------------------------
// 3. PLOT DIMENSIONS
// --------------------------------------------------

function parsePlot(input = {}) {
  const width = Number(input.plotWidth);
  const length = Number(input.plotLength);

  if (
    Number.isFinite(width) &&
    Number.isFinite(length) &&
    width >= 10 &&
    width <= 500 &&
    length >= 10 &&
    length <= 500
  ) {
    return { width, length };
  }

  const plotText = String(input.plotSize || "");
  const match = plotText.match(
    /(\d+(?:\.\d+)?)\s*(?:ft|feet)?\s*[xX×]\s*(\d+(?:\.\d+)?)/i
  );

  if (match) {
    const w = Number(match[1]);
    const l = Number(match[2]);

    if (
      Number.isFinite(w) &&
      Number.isFinite(l) &&
      w >= 10 &&
      w <= 500 &&
      l >= 10 &&
      l <= 500
    ) {
      return { width: w, length: l };
    }
  }

  const error = new Error(
    "Enter valid plot dimensions, for example 30 x 40 feet."
  );
  error.status = 400;
  throw error;
}

// --------------------------------------------------
// 4. NORMALIZE USER REQUIREMENTS
// --------------------------------------------------

function normalizeRequirements(input = {}) {
  const number = (value, fallback, min, max) => {
    if (value === "" || value === null || value === undefined) {
      return fallback;
    }

    const n = Number(value);

    return Number.isFinite(n) && n >= min && n <= max
      ? n
      : fallback;
  };

  const boolean = (value, fallback = false) =>
    typeof value === "boolean" ? value : fallback;

  const styles = ["Modern", "Traditional", "Luxury", "Minimalist"];
  const facings = ["North", "South", "East", "West"];
  const kitchens = ["Open", "Closed"];

  return {
    plotSize: String(input.plotSize || ""),
    plotWidth: input.plotWidth,
    plotLength: input.plotLength,

    floors: Math.floor(number(input.floors, 1, 1, 3)),
    bedrooms: Math.floor(number(input.bedrooms, 2, 0, 12)),
    bathrooms: Math.floor(number(input.bathrooms, 2, 0, 12)),

    kitchenType: kitchens.includes(input.kitchenType)
      ? input.kitchenType
      : "Closed",

    livingRoom: boolean(input.livingRoom, true),
    parking: boolean(input.parking),
    garden: boolean(input.garden),
    poojaRoom: boolean(input.poojaRoom),
    balcony: boolean(input.balcony),

    facing: facings.includes(input.facing) ? input.facing : "East",

    budget: number(input.budget, 0, 0, 10000000000),

    designStyle: styles.includes(input.designStyle)
      ? input.designStyle
      : "Modern",

    additionalRequirements: String(
      input.additionalRequirements || ""
    ).slice(0, 2000),
  };
}

// --------------------------------------------------
// 5. AI PROMPT
// --------------------------------------------------

function buildPrompt(requirements, plot) {
  return `
You are an experienced residential floor-plan concept assistant.

Create a practical house layout based on these requirements:
${JSON.stringify({ ...requirements, plot }, null, 2)}

IMPORTANT RULES:
1. Return valid JSON only. Do not use Markdown fences.
2. All dimensions and coordinates must be in feet.
3. The plot origin is the top-left corner.
4. X increases across plot width.
5. Y increases along plot length.
6. Every room must remain inside the plot boundaries.
7. Room floor values must be integers from 0 to floors - 1.
8. Rooms on the same floor must not overlap.
9. Generate the requested number of bedrooms and bathrooms.
10. Include a kitchen.
11. Include the living room if requested.
12. Include optional rooms only when requested.
13. Include parking, garden, pooja room and balcony only when enabled.
14. Each room must have positive width, length and height.
15. Keep a reasonable walking area and practical room sizes.
16. Do not invent extra bedrooms or bathrooms.
17. Return warnings if the requirements cannot fit.
18. This is a conceptual plan, not a construction-ready drawing.
19. Use the requested design style in the summary.
20. The kitchen type is ${requirements.kitchenType}.

Use this exact JSON structure:
{
  "title": "Personalized House Plan",
  "summary": "Short design summary",
  "warnings": [],
  "rooms": [
    {
      "name": "Living Room",
      "type": "living",
      "floor": 0,
      "x": 0,
      "y": 0,
      "width": 12,
      "length": 10,
      "height": 10
    }
  ]
}

Allowed room types:
living, kitchen, dining, bedroom, bathroom, parking, garden,
balcony, pooja, study, store, utility.

Return the rooms array even if some requested rooms cannot fit.
`;
}

// --------------------------------------------------
// 6. PARSE AI JSON
// --------------------------------------------------

function extractJson(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // Continue to the useful error below.
      }
    }

    const error = new Error(
      "The AI returned an invalid response. Please try generating again."
    );
    error.status = 502;
    throw error;
  }
}

// --------------------------------------------------
// 7. GENERATE PLAN WITH GEMINI
// --------------------------------------------------

async function generateAIPlan(requirements, plot) {
  if (!genAI) {
    const error = new Error(
      "GEMINI_API_KEY is missing from Backend/.env."
    );
    error.status = 503;
    throw error;
  }

  const response = await retryGeminiRequest(() =>
    genAI.models.generateContent({
      model: MODEL,
      contents: buildPrompt(requirements, plot),
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    })
  );

  const result = extractJson(response.text);

  if (!result || !Array.isArray(result.rooms)) {
    const error = new Error(
      "The AI response does not contain a valid rooms array."
    );
    error.status = 502;
    throw error;
  }

  return result;
}

// --------------------------------------------------
// 8. ROOM OVERLAP CHECK
// --------------------------------------------------

function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.length &&
    a.y + a.length > b.y
  );
}

// --------------------------------------------------
// 9. VALIDATE GENERATED ROOMS
// --------------------------------------------------

function validateRooms(aiRooms, requirements, plot) {
  const validTypes = new Set([
    "living",
    "kitchen",
    "dining",
    "bedroom",
    "bathroom",
    "parking",
    "garden",
    "balcony",
    "pooja",
    "study",
    "store",
    "utility",
  ]);

  const rooms = [];
  const warnings = [];
  const counts = {};

  for (const room of aiRooms) {
    if (!room || typeof room !== "object") continue;

    const type = String(room.type || "").toLowerCase();

    if (!validTypes.has(type)) {
      warnings.push("An unsupported room type was skipped.");
      continue;
    }

    if (
      type === "bedroom" &&
      (counts.bedroom || 0) >= requirements.bedrooms
    ) {
      continue;
    }

    if (
      type === "bathroom" &&
      (counts.bathroom || 0) >= requirements.bathrooms
    ) {
      continue;
    }

    if (type === "living" && !requirements.livingRoom) continue;
    if (type === "parking" && !requirements.parking) continue;
    if (type === "garden" && !requirements.garden) continue;
    if (type === "pooja" && !requirements.poojaRoom) continue;
    if (type === "balcony" && !requirements.balcony) continue;

    const item = {
      name: String(room.name || type).slice(0, 60),
      type,
      floor: Number(room.floor ?? 0),
      x: Number(room.x),
      y: Number(room.y),
      width: Number(room.width),
      length: Number(room.length),
      height: Number(room.height ?? 10),
    };

    const values = [
      item.floor,
      item.x,
      item.y,
      item.width,
      item.length,
      item.height,
    ];

    if (
      !values.every(Number.isFinite) ||
      !Number.isInteger(item.floor) ||
      item.floor < 0 ||
      item.floor >= requirements.floors ||
      item.x < 0 ||
      item.y < 0 ||
      item.width <= 0 ||
      item.length <= 0 ||
      item.height <= 0 ||
      item.x + item.width > plot.width ||
      item.y + item.length > plot.length
    ) {
      warnings.push(`Invalid room dimensions: ${item.name}`);
      continue;
    }

    if (
      rooms.some(
        (other) =>
          other.floor === item.floor && overlaps(item, other)
      )
    ) {
      warnings.push(`Room overlap detected: ${item.name}`);
      continue;
    }

    rooms.push(item);
    counts[type] = (counts[type] || 0) + 1;
  }

  for (const type of ["bedroom", "bathroom"]) {
    const expected = requirements[type];
    const actual = rooms.filter((room) => room.type === type).length;

    if (actual !== expected) {
      warnings.push(
        `Requested ${expected} ${type}(s), but ${actual} valid room(s) were generated.`
      );
    }
  }

  if (
    requirements.livingRoom &&
    !rooms.some((room) => room.type === "living")
  ) {
    warnings.push("The requested living room is missing.");
  }

  if (!rooms.some((room) => room.type === "kitchen")) {
    warnings.push("The requested kitchen is missing.");
  }

  return { rooms, warnings };
}

// --------------------------------------------------
// 10. FORMAT ROOMS FOR FRONTEND
// --------------------------------------------------

function formatRooms(rooms) {
  return rooms.map((room) => ({
    ...room,

    // Preserve the frontend's existing canvas coordinate format.
    x: Math.round(room.x * 10),
    y: Math.round(room.y * 10),
    width: Math.round(room.width * 10),
    canvasHeight: Math.round(room.length * 10),

    breadth: room.width,
    area: Number((room.width * room.length).toFixed(1)),

    doors: [{ side: "south", width: 3 }],
    windows: [{ side: "east", width: 4, height: 4 }],
  }));
}

// --------------------------------------------------
// 11. COST ESTIMATE
// --------------------------------------------------

function calculateCost(rooms, budget, style) {
  const rates = {
    Luxury: 2600,
    Minimalist: 1700,
    Modern: 1900,
    Traditional: 1900,
  };

  const rate = rates[style] || 1900;

  const included = rooms.filter(
    (room) => !["garden", "parking", "balcony"].includes(room.type)
  );

  const area = included.reduce(
    (sum, room) => sum + room.width * room.length,
    0
  );

  const estimatedCost = Math.round(area * rate);

  return {
    currency: "INR",
    ratePerSqFt: rate,
    builtUpArea: Number(area.toFixed(1)),
    estimatedCost,
    userBudget: budget,
    withinBudget: budget > 0 ? estimatedCost <= budget : null,
    disclaimer:
      "Indicative room-area estimate only. Not a construction quotation. Actual costs vary with walls, stairs, services, site conditions and local rates.",
  };
}

// --------------------------------------------------
// 12. BUILD FINAL RESPONSE
// --------------------------------------------------

function buildResult(requirements, plot, validated, ai) {
  const rooms = formatRooms(validated.rooms);

  return {
    title: String(ai.title || "Personalized House Plan"),

    plotSize: `${plot.width} x ${plot.length} feet`,
    plotWidth: plot.width,
    plotLength: plot.length,

    floors: requirements.floors,
    bedrooms: rooms.filter((room) => room.type === "bedroom").length,
    bathrooms: rooms.filter((room) => room.type === "bathroom").length,

    facing: requirements.facing,
    designStyle: requirements.designStyle,

    rooms,

    summary: String(
      ai.summary ||
        "Personalized house concept generated from your inputs."
    ),

    warnings: [
      ...(Array.isArray(ai.warnings)
        ? ai.warnings
            .filter((item) => typeof item === "string")
            .slice(0, 20)
        : []),
      ...validated.warnings,
    ],

    mainGate: {
      side: requirements.facing,
      width: 10,
    },

    road: {
      side: requirements.facing,
    },

    costEstimate: calculateCost(
      validated.rooms,
      requirements.budget,
      requirements.designStyle
    ),
  };
}

// --------------------------------------------------
// 13. GENERATE HOUSE PLAN API
// --------------------------------------------------

app.post("/generate", async (req, res) => {
  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        error: "Send house requirements as a JSON object.",
      });
    }

    const requirements = normalizeRequirements(req.body);
    const plot = parsePlot(requirements);

    console.log("House plan request received:", {
      plotSize: `${plot.width} x ${plot.length}`,
      floors: requirements.floors,
      bedrooms: requirements.bedrooms,
      bathrooms: requirements.bathrooms,
      model: MODEL,
    });

    const ai = await generateAIPlan(requirements, plot);
    const validated = validateRooms(ai.rooms, requirements, plot);
    const result = buildResult(requirements, plot, validated, ai);

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("House generation error:", {
      status: getErrorStatus(error),
      message: error?.message,
    });

    let status = getErrorStatus(error) || 500;
    let message = error?.message || "House generation failed.";

    if (
      /API key not valid|API_KEY_INVALID|invalid api key/i.test(message)
    ) {
      status = 502;
      message =
        "Gemini API key is invalid. Check GEMINI_API_KEY in Backend/.env.";
    } else if (
      /model.*not found|not supported|models\/.*not found/i.test(message) ||
      status === 404
    ) {
      status = 502;
      message =
        `Gemini model "${MODEL}" is unavailable to this API key. ` +
        "Set GEMINI_MODEL in Backend/.env to a model supported by your API key.";
    } else if (
      /quota|rate limit/i.test(message) ||
      status === 429
    ) {
      status = 429;
      message =
        "Gemini API quota or rate limit reached. Check your Google AI Studio usage and try again later.";
    } else if (
      status === 503 ||
      status === 502 ||
      status === 504 ||
      status === 500
    ) {
      status = 503;
      message =
        "Gemini is temporarily unavailable or overloaded. The server retried the request; please wait a little and try again.";
    } else if (!genAI) {
      status = 503;
      message = "GEMINI_API_KEY is missing from Backend/.env.";
    }

    return res.status(status).json({
      success: false,
      error: message,
    });
  }
});

// --------------------------------------------------
// 14. UNKNOWN ROUTES
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found.",
  });
});

// --------------------------------------------------
// 15. START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`AI House Builder backend: http://localhost:${PORT}`);
  console.log(`Gemini model: ${MODEL}`);
  console.log(`Gemini API key configured: ${Boolean(genAI)}`);
});
