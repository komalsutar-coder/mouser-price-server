import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// =============================
// CONFIG
// =============================
const MOUSER_API_KEY = process.env.MOUSER_API_KEY;
const MOUSER_SEARCH_URL =
  "https://api.mouser.com/api/v1/search/partnumber";

// =============================
// PRICE ENDPOINT
// =============================
app.post("/price", async (req, res) => {
  try {
    let { partNumber } = req.body;

    if (!partNumber) {
      return res.json({ unit: "N/A", bulk: "N/A" });
    }

    // 🔹 CLEAN PART NUMBER
    partNumber = partNumber
      .replace(/^941-/, "")   // remove Mouser SKU
      .replace(/"/g, "")
      .trim();

    const payload = {
      SearchByPartRequest: {
        mouserPartNumber: partNumber,
        partSearchOptions: "string",
        apiKey: MOUSER_API_KEY
      }
    };

    const response = await fetch(
      `${MOUSER_SEARCH_URL}?apiKey=${MOUSER_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    const parts = data?.SearchResults?.Parts || [];

    if (!parts.length) {
      return res.json({ unit: "N/A", bulk: "N/A" });
    }

    const priceBreaks = parts[0].PriceBreaks || [];

    let unit = "N/A";
    let bulk = "N/A";

    priceBreaks.forEach(p => {
      if (p.Quantity === 1) unit = p.Price;
      if (p.Quantity === 10) bulk = p.Price;
    });

    res.json({ unit, bulk });

  } catch (err) {
    console.error(err);
    res.json({ unit: "N/A", bulk: "N/A" });
  }
});

// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Mouser API server running on port", PORT);
});
