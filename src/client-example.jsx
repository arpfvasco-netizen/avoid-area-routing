import { useState } from "react";


export default function Demo() {
const [out, setOut] = useState(null);
async function go() {
const body = {
origin: [4.895, 52.370],
destination: [5.121, 52.090],
profile: "car",
avoid_rules: [
{
type: "polygon",
strictness: "hard",
geometry: {
type: "Polygon",
coordinates: [ [ [5.088,52.083],[5.156,52.083],[5.156,52.130],[5.088,52.130],[5.088,52.083] ] ]
}
}
]
};
const res = await fetch("http://localhost:4000/route", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify(body) });
setOut(await res.json());
}
return (
<div style={{padding:20}}>
<button onClick={go}>Route with avoid</button>
<pre>{out ? JSON.stringify(out, null, 2) : "(click to run)"}</pre>
</div>
);
}
