import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const MOUSER_API_KEY = process.env.MOUSER_API_KEY;

app.post("/price", async (req, res) => {
  try {
    const partNumber = req.body.partNumber;
    if (!partNumber) {
      return res.status(400).json({ error: "No part number" });
    }

    const response = await fetch(
      "https://api.mouser.com/api/v1/search/partnumber?apiKey=" + MOUSER_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          SearchByPartRequest: {
            MouserPartNumber: partNumber,
            PartSearchOptions: "Exact"
          }
        })
      }
    );

    const data = await response.json();
    const breaks = data?.SearchResults?.Parts?.[0]?.PriceBreaks || [];

    const unit = breaks.find(b => b.Quantity === 1)?.Price || "N/A";
    const bulk = breaks.find(b => b.Quantity >= 10)?.Price || "N/A";

    res.json({ unit, bulk });

  } catch (err) {
    res.status(500).json({ error: "API failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
