/**
 * Image Helper for generated PPTX code
 * This file is used by LLM-generated presentation.js files
 */

const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

const mongoConfig = {
  url: process.env.MONGODB_URL || "mongodb://localhost:27017/pptx_generator_db",
  dbName: process.env.DB_NAME || "pptx_generator_db",
};

let mongoClient = null;
let db = null;

/**
 * Initialize MongoDB connection
 */
async function initializeMongoDB() {
  try {
    if (mongoClient && db) {
      return { client: mongoClient, db };
    }

    mongoClient = new MongoClient(mongoConfig.url);
    await mongoClient.connect();
    db = mongoClient.db(mongoConfig.dbName);
    console.log("✅ MongoDB connected successfully");
    return { client: mongoClient, db };
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

/**
 * Smart function to fetch image without specifying presentation ID
 * Uses multiple strategies to find the image
 */
async function fetchImageSmart(varKey, presentationName = null) {
  try {
    if (!db) {
      await initializeMongoDB();
    }

    const collection = db.collection("imagemappings");
    console.log(`🧠 Smart fetch for varKey: ${varKey}`);

    let imageMapping = null;

    // Strategy 1: If presentation name is provided, find by name first
    if (presentationName) {
      console.log(`  🔍 Looking for presentation named: ${presentationName}`);
      const presentationCollection = db.collection("presentations");
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
        const currentPresentationPath = path.join(
          __dirname,
          "current_presentation.json"
        );
        if (fs.existsSync(currentPresentationPath)) {
          const currentInfo = JSON.parse(
            fs.readFileSync(currentPresentationPath, "utf-8")
          );
          console.log(
            `  📋 Found current presentation ID: ${currentInfo.presentationId}`
          );

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

/**
 * Fetch image from DB with specific presentation ID
 */
async function fetchImageFromDB(presentationId, varKey) {
  try {
    if (!db) {
      await initializeMongoDB();
    }

    const collection = db.collection("imagemappings");

    const objectId = ObjectId.isValid(presentationId)
      ? new ObjectId(presentationId)
      : presentationId;

    const imageMapping = await collection.findOne({
      presentationId: objectId,
      [`vars.${varKey}`]: { $exists: true },
    });

    if (imageMapping && imageMapping.vars && imageMapping.vars[varKey]) {
      return imageMapping.vars[varKey];
    }

    return null;
  } catch (error) {
    console.error(`❌ Error fetching image for ${varKey}:`, error);
    return null;
  }
}

/**
 * Close MongoDB connection
 */
async function closeMongoDB() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    db = null;
    console.log("✅ MongoDB connection closed");
  }
}

module.exports = {
  initializeMongoDB,
  fetchImageSmart,
  fetchImageFromDB,
  closeMongoDB,
};
