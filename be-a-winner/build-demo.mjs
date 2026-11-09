// Baut eine einzelne Demo-Datei (ohne Supabase) für die Vorschau: ../demo/be-a-winner-demo.html
import { readFileSync, writeFileSync } from "node:fs";
const here = new URL(".", import.meta.url);
const read = (f) => readFileSync(new URL(f, here), "utf8");
const html = `<title>Be a Winner</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=Manrope:wght@400;600;700;800&display=swap">
<style>
${read("styles.css")}
</style>
<div id="app"></div>
<script>window.BAW_CONFIG = {};</script>
<script>
${read("app.js")}
</script>
`;
writeFileSync(new URL("../demo/be-a-winner-demo.html", here), html);
console.log("demo/be-a-winner-demo.html geschrieben");
