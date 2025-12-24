const fs = require("fs");
const { MongoClient } = require("mongodb");

async function splitAndUpload() {
  const raw = fs.readFileSync("rawinput.json", "utf-8");
  const data = JSON.parse(raw);

  console.log("Parsed JSON type:", Array.isArray(data) ? "Array" : typeof data);

  let slides;
  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.error("❌ Error: JSON array is empty.");
      return null;
    }
    console.log("First object keys:", Object.keys(data[0]));
    slides = data; // your JSON itself is array of slides
  } else {
    slides = data.slides || data.pages || null;
  }

  if (!slides || !Array.isArray(slides)) {
    console.error("❌ Error: Could not find slides array.");
    return null;
  }

  let vars = {};
  let counter = 1;

  slides.forEach((slide, slideIdx) => {
    const elements = slide.objects || slide.elements;
    if (!elements || !Array.isArray(elements)) {
      console.log(`⚠ Slide ${slideIdx} has no objects/elements.`);
      return;
    }

    elements.forEach((el, elIdx) => {
      if (
        el &&
        el.src &&
        typeof el.src === "string" &&
        el.src.startsWith("data:image")
      ) {
        const varName = `var${counter}`;
        vars[varName] = el.src;
        el.src = `${varName}`;
        counter++;
        console.log(
          `✅ Found image in slide ${slideIdx}, element ${elIdx} → replaced with ${varName}`
        );
      } else {
        console.log(
          `ℹ Skipped element in slide ${slideIdx}, element ${elIdx} → type=${el.type}`
        );
      }
    });
  });

  const presentationObject = { slides: slides };

  fs.writeFileSync(
    "presentation_clean.json",
    JSON.stringify(presentationObject, null, 2)
  );
  fs.writeFileSync("vars.json", JSON.stringify(vars, null, 2));

  console.log(`✅ Done! Extracted ${counter - 1} images.`);
  console.log("Created: presentation_clean.json & vars.json");

  // Upload to MongoDB
  const uri = "mongodb://localhost:27017/sample_presentation_db";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("sample_presentation_db");

    const presResult = await db.collection("slidepresentation").insertOne({
      name: "My Presentation",
      json: presentationObject,
    });
    console.log("✅ Uploaded presentation:", presResult.insertedId);

    const mapResult = await db.collection("imagemapping").insertOne({
      presentationId: presResult.insertedId,
      vars: vars,
    });
    console.log("✅ Uploaded asset mappings:", mapResult.insertedId);

    // Return the presentation ID for later use
    const result = {
      presentationId: presResult.insertedId.toString(),
      imageMappingId: mapResult.insertedId.toString(),
      imageCount: counter - 1,
    };

    // Save the presentation ID to a file for easy access
    fs.writeFileSync(
      "current_presentation.json",
      JSON.stringify(result, null, 2)
    );
    console.log(
      "💾 Saved current presentation info to current_presentation.json"
    );

    return result;
  } finally {
    await client.close();
  }
}
splitAndUpload().catch(console.error);
module.exports = { splitAndUpload };
