import express from "express";
method: "POST",
headers: { "content-type": "application/json" },
body: JSON.stringify({ json: JSON.stringify(body) })
});


if (!res.ok) {
const text = await res.text();
throw new Error(`Valhalla error: ${res.status} ${text}`);
}
const data = await res.json();
return data;
}


async function routeWithGraphHopper({ origin, destination, profile, hardPolygons, softPolygons }) {
// GraphHopper accepts a block area param for polygons. We'll convert hard polygons to WKT.
const params = new URLSearchParams();
params.set("point", `${origin[1]},${origin[0]}`); // lat,lon
params.append("point", `${destination[1]},${destination[0]}`);
params.set("profile", profile || "car");
params.set("points_encoded", "true");


if (hardPolygons.length) {
const wkts = hardPolygons.map(polygonToWKT);
// Multiple polygons separated by semicolons is commonly supported in GH block_area
params.set("block_area", wkts.join(";"));
}


const url = `${GH_URL}/route?${params.toString()}`;
const res = await fetch(url);
if (!res.ok) {
const text = await res.text();
throw new Error(`GraphHopper error: ${res.status} ${text}`);
}
const data = await res.json();


// If GH finds no route due to hard blocks, try soft handling by omitting them (or lowering penalties if using Custom Models)
if (!data.paths?.length && softPolygons.length) {
const retry = new URLSearchParams(params);
retry.delete("block_area");
const res2 = await fetch(`${GH_URL}/route?${retry.toString()}`);
const data2 = await res2.json();
data2._note = "Soft avoid used: Removed soft polygons to find a fallback route";
return data2;
}
return data;
}


// --- API -------------------------------------------------------------------
app.post("/route", async (req, res) => {
try {
const { origin, destination, profile = "car", avoid_rules = [] } = req.body || {};
if (!origin || !destination) return res.status(400).json({ error: "origin and destination are required [lon,lat]" });


const { hardPolygons, softPolygons } = normalizeRules(avoid_rules);


let data;
if (ENGINE === "graphhopper") {
data = await routeWithGraphHopper({ origin, destination, profile, hardPolygons, softPolygons });
} else {
data = await routeWithValhalla({ origin, destination, profile, hardPolygons, softPolygons });
}


res.json({ engine: ENGINE, data });
} catch (err) {
console.error(err);
res.status(500).json({ error: String(err?.message || err) });
}
});


app.get("/health", (_, res) => res.json({ ok: true, engine: ENGINE }));


const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`Avoid-area router
