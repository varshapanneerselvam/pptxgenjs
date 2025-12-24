const { MongoClient, ObjectId } = require("mongodb");

const mongoConfig = {
  url: "mongodb://localhost:27017/sample_presentation_db",
  dbName: "sample_presentation_db",
  // Remove hardcoded presentationId since it should be dynamic
};

let mongoClient = null;
let db = null;

// Initialize MongoDB connection
async function initializeMongoDB() {
  try {
    mongoClient = new MongoClient(mongoConfig.url);
    await mongoClient.connect();
    db = mongoClient.db(mongoConfig.dbName);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

// Debug function to see what's in the database
async function debugDatabase() {
  try {
    console.log("\n🔍 DEBUGGING DATABASE CONTENTS:");

    // Check imagemapping collection
    const imageMappingCollection = db.collection("imagemapping");
    const imageMappingDocs = await imageMappingCollection.find({}).toArray();
    console.log(
      `\n📁 imagemapping collection has ${imageMappingDocs.length} documents:`
    );

    imageMappingDocs.forEach((doc, index) => {
      console.log(`  Doc ${index + 1}:`);
      console.log(`    _id: ${doc._id}`);
      console.log(`    presentationId: ${doc.presentationId}`);
      if (doc.vars) {
        console.log(`    vars keys: ${Object.keys(doc.vars).join(", ")}`);
        Object.keys(doc.vars).forEach((key) => {
          const dataLength = doc.vars[key] ? doc.vars[key].length : 0;
          console.log(`      ${key}: ${dataLength} characters`);
        });
      } else {
        console.log(`    vars: NOT FOUND`);
      }
    });

    // Check slidepresentation collection
    const slidePresentationCollection = db.collection("slidepresentation");
    const slideDocs = await slidePresentationCollection.find({}).toArray();
    console.log(
      `\n📁 slidepresentation collection has ${slideDocs.length} documents:`
    );

    slideDocs.forEach((doc, index) => {
      console.log(`  Doc ${index + 1}:`);
      console.log(`    _id: ${doc._id}`);
      console.log(`    name: ${doc.name}`);
    });
  } catch (error) {
    console.error("❌ Error debugging database:", error);
  }
}

// Fixed function to fetch image from DB with better debugging
async function fetchImageFromDB(presentationId, varKey) {
  try {
    const collection = db.collection("imagemapping");

    console.log(
      `🔍 Looking for presentationId: ${presentationId}, varKey: ${varKey}`
    );

    // First, let's see what presentationIds actually exist
    const allMappings = await collection
      .find({}, { presentationId: 1 })
      .toArray();
    console.log(`📋 Available presentationIds in database:`);
    allMappings.forEach((doc, index) => {
      console.log(
        `  ${index + 1}. ${
          doc.presentationId
        } (type: ${typeof doc.presentationId})`
      );
    });

    let imageMapping = null;

    // Try 1: Exact match as string
    console.log(`  🔍 Try 1: Exact string match`);
    imageMapping = await collection.findOne({
      presentationId: presentationId,
      [`vars.${varKey}`]: { $exists: true },
    });

    // Try 2: Convert to ObjectId if it's a valid ObjectId string
    if (
      !imageMapping &&
      typeof presentationId === "string" &&
      ObjectId.isValid(presentationId)
    ) {
      console.log(`  🔍 Try 2: Convert to ObjectId`);
      try {
        const objectId = new ObjectId(presentationId);
        imageMapping = await collection.findOne({
          presentationId: objectId,
          [`vars.${varKey}`]: { $exists: true },
        });
      } catch (e) {
        console.log(`  ❌ ObjectId conversion failed: ${e.message}`);
      }
    }

    // Try 3: If presentationId is ObjectId, convert to string
    if (!imageMapping && presentationId instanceof ObjectId) {
      console.log(`  🔍 Try 3: Convert ObjectId to string`);
      imageMapping = await collection.findOne({
        presentationId: presentationId.toString(),
        [`vars.${varKey}`]: { $exists: true },
      });
    }

    // Try 4: Search by ObjectId string representation in different formats
    if (!imageMapping && typeof presentationId === "string") {
      console.log(`  🔍 Try 4: Search all documents manually`);
      const allDocs = await collection.find({}).toArray();

      for (const doc of allDocs) {
        const docPresentationId = doc.presentationId;
        let matches = false;

        // Check various formats
        if (docPresentationId === presentationId) matches = true;
        if (
          docPresentationId &&
          docPresentationId.toString() === presentationId
        )
          matches = true;
        if (
          ObjectId.isValid(presentationId) &&
          docPresentationId &&
          docPresentationId.equals &&
          docPresentationId.equals(new ObjectId(presentationId))
        )
          matches = true;

        if (matches && doc.vars && doc.vars[varKey]) {
          console.log(`  ✅ Found matching document with _id: ${doc._id}`);
          imageMapping = doc;
          break;
        }
      }
    }

    if (imageMapping && imageMapping.vars && imageMapping.vars[varKey]) {
      console.log(
        `✅ Found image data for ${varKey} (length: ${imageMapping.vars[varKey].length} chars)`
      );
      return imageMapping.vars[varKey];
    }

    console.warn(
      `⚠️ No image found for presentationId: ${presentationId}, varKey: ${varKey}`
    );

    // Additional debugging: show what vars are available for this presentationId
    const debugDoc = await collection.findOne({
      $or: [
        { presentationId: presentationId },
        {
          presentationId: ObjectId.isValid(presentationId)
            ? new ObjectId(presentationId)
            : null,
        },
      ].filter(Boolean),
    });

    if (debugDoc && debugDoc.vars) {
      console.log(
        `📝 Available vars for this presentationId: ${Object.keys(
          debugDoc.vars
        ).join(", ")}`
      );
    }

    return null;
  } catch (error) {
    console.error(`❌ Error fetching image for ${varKey}:`, error);
    return null;
  }
}

// Simple function to get any image for a var key (fallback)
async function fetchAnyImageForVar(varKey) {
  try {
    const collection = db.collection("imagemapping");

    console.log(`🔍 Looking for any document with ${varKey}`);

    const imageMapping = await collection.findOne({
      [`vars.${varKey}`]: { $exists: true },
    });

    if (imageMapping && imageMapping.vars && imageMapping.vars[varKey]) {
      console.log(`✅ Found image data for ${varKey}`);
      return imageMapping.vars[varKey];
    }

    console.warn(`⚠️ No document found with ${varKey}`);
    return null;
  } catch (error) {
    console.error(`❌ Error fetching any image for ${varKey}:`, error);
    return null;
  }
}

// Smart function to fetch image without specifying presentation ID
async function fetchImageSmart(varKey, presentationName = null) {
  try {
    const collection = db.collection("imagemapping");

    console.log(`🧠 Smart fetch for varKey: ${varKey}`);

    let imageMapping = null;

    // Strategy 1: If presentation name is provided, find by name first
    if (presentationName) {
      console.log(`  🔍 Looking for presentation named: ${presentationName}`);
      const presentationCollection = db.collection("slidepresentation");
      const presentation = await presentationCollection.findOne({
        name: presentationName,
      });

      if (presentation) {
        console.log(`  ✅ Found presentation: ${presentation._id}`);
        imageMapping = await collection.findOne({
          presentationId: presentation._id,
          [`vars.${varKey}`]: { $exists: true },
        });
      }
    }

    // Strategy 2: Try to load from saved current presentation
    if (!imageMapping) {
      console.log(`  🔍 Checking current_presentation.json`);
      try {
        const fs = require("fs");
        if (fs.existsSync("current_presentation.json")) {
          const currentInfo = JSON.parse(
            fs.readFileSync("current_presentation.json", "utf-8")
          );
          console.log(
            `  📋 Found current presentation ID: ${currentInfo.presentationId}`
          );

          const { ObjectId } = require("mongodb");
          const presentationId = ObjectId.isValid(currentInfo.presentationId)
            ? new ObjectId(currentInfo.presentationId)
            : currentInfo.presentationId;

          imageMapping = await collection.findOne({
            presentationId: presentationId,
            [`vars.${varKey}`]: { $exists: true },
          });
        }
      } catch (e) {
        console.log(
          `  ⚠️ Could not read current_presentation.json: ${e.message}`
        );
      }
    }

    // Strategy 3: Find the most recent presentation that has this varKey
    if (!imageMapping) {
      console.log(`  🔍 Looking for most recent presentation with ${varKey}`);
      const imageMappings = await collection
        .find({
          [`vars.${varKey}`]: { $exists: true },
        })
        .sort({ _id: -1 })
        .limit(1)
        .toArray();

      if (imageMappings.length > 0) {
        imageMapping = imageMappings[0];
        console.log(
          `  ✅ Found in recent presentation: ${imageMapping.presentationId}`
        );
      }
    }

    // Strategy 4: Fallback to any document with this varKey
    if (!imageMapping) {
      console.log(`  🔍 Fallback: Looking for any document with ${varKey}`);
      imageMapping = await collection.findOne({
        [`vars.${varKey}`]: { $exists: true },
      });
    }

    if (imageMapping && imageMapping.vars && imageMapping.vars[varKey]) {
      console.log(`✅ Smart fetch successful for ${varKey}`);
      return imageMapping.vars[varKey];
    }

    console.warn(`⚠️ Smart fetch failed for ${varKey}`);
    return null;
  } catch (error) {
    console.error(`❌ Error in smart fetch for ${varKey}:`, error);
    return null;
  }
}

// Get current presentation ID from saved file
async function getCurrentPresentationId() {
  try {
    const fs = require("fs");
    if (fs.existsSync("current_presentation.json")) {
      const currentInfo = JSON.parse(
        fs.readFileSync("current_presentation.json", "utf-8")
      );
      return currentInfo.presentationId;
    }
    return null;
  } catch (error) {
    console.error("❌ Error reading current presentation ID:", error);
    return null;
  }
}

// Fetch image from current presentation
async function fetchImageFromCurrent(varKey) {
  const currentId = await getCurrentPresentationId();
  if (!currentId) {
    console.warn(
      "⚠️ No current presentation found, falling back to smart fetch"
    );
    return await fetchImageSmart(varKey);
  }

  return await fetchImageFromDB(currentId, varKey);
}

module.exports = {
  initializeMongoDB,
  debugDatabase,
  fetchImageFromDB,
  fetchImageSmart, // New smart function - recommended
  fetchImageFromCurrent, // Fetch from current presentation
  fetchAnyImageForVar,
  getCurrentPresentationId,
};
