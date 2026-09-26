require("dotenv").config({ path: ".env.local" });

const API_KEY = process.env.GEMINI_API_KEY;

console.log("\n=== DEBUG ===\n");
console.log("API Key ada?", API_KEY ? "YA" : "TIDAK");
console.log("API Key preview:", API_KEY ? API_KEY.substring(0, 15) + "..." : "kosong");

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    console.log("\nFetching:", url.replace(API_KEY, "AIza...HIDDEN"));
    
    const response = await fetch(url);
    console.log("Status:", response.status, response.statusText);
    
    const data = await response.json();
    
    if (data.error) {
      console.log("\n❌ ERROR dari Google:");
      console.log(JSON.stringify(data.error, null, 2));
      return;
    }
    
    if (!data.models || data.models.length === 0) {
      console.log("\n⚠ Tidak ada model yang ditemukan");
      console.log("Response lengkap:", JSON.stringify(data, null, 2));
      return;
    }
    
    console.log(`\n✅ Total ${data.models.length} model ditemukan:\n`);
    
    data.models.forEach((m) => {
      const methods = m.supportedGenerationMethods?.join(", ") || "-";
      console.log(`  📦 ${m.name}`);
      console.log(`     Display: ${m.displayName}`);
      console.log(`     Methods: ${methods}`);
      console.log("");
    });
  } catch (err) {
    console.error("\n❌ FETCH ERROR:", err.message);
    console.error(err.stack);
  }
}

listModels();