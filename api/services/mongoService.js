const { MongoClient, ObjectId } = require("mongodb");
const config = require("../config");

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

    mongoClient = new MongoClient(config.MONGODB_URL);
    await mongoClient.connect();
    db = mongoClient.db(config.DB_NAME);
    console.log("✅ MongoDB connected successfully");
    return { client: mongoClient, db };
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

/**
 * Get database instance
 */
function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initializeMongoDB first.");
  }
  return db;
}

/**
 * Store presentation and image mappings in MongoDB
 */
async function storePresentation(
  presentationJson,
  imageVars,
  name = "Presentation"
) {
  const database = getDb();

  // Store clean presentation JSON
  const presResult = await database.collection("presentations").insertOne({
    name: name,
    json: presentationJson,
    createdAt: new Date(),
  });

  // Store image mappings
  const mapResult = await database.collection("imagemappings").insertOne({
    presentationId: presResult.insertedId,
    vars: imageVars,
    createdAt: new Date(),
  });

  console.log("✅ Stored presentation:", presResult.insertedId);
  console.log("✅ Stored image mappings:", mapResult.insertedId);

  return {
    presentationId: presResult.insertedId.toString(),
    imageMappingId: mapResult.insertedId.toString(),
  };
}

/**
 * Smart fetch image from MongoDB
 */
async function fetchImageSmart(varKey, presentationId = null) {
  try {
    const database = getDb();
    const collection = database.collection("imagemappings");

    console.log(`🧠 Smart fetch for varKey: ${varKey}`);

    let imageMapping = null;

    // Strategy 1: If presentation ID is provided, use it directly
    if (presentationId) {
      console.log(`  🔍 Looking for presentationId: ${presentationId}`);
      const objectId = ObjectId.isValid(presentationId)
        ? new ObjectId(presentationId)
        : presentationId;

      imageMapping = await collection.findOne({
        presentationId: objectId,
        [`vars.${varKey}`]: { $exists: true },
      });
    }

    // Strategy 2: Find the most recent presentation that has this varKey
    if (!imageMapping) {
      console.log(`  🔍 Looking for most recent presentation with ${varKey}`);
      const imageMappings = await collection
        .find({ [`vars.${varKey}`]: { $exists: true } })
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
 * Get all images for a presentation
 */
async function getImagesForPresentation(presentationId) {
  const database = getDb();
  const objectId = ObjectId.isValid(presentationId)
    ? new ObjectId(presentationId)
    : presentationId;

  const mapping = await database.collection("imagemappings").findOne({
    presentationId: objectId,
  });

  return mapping ? mapping.vars : {};
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
  getDb,
  storePresentation,
  fetchImageSmart,
  getImagesForPresentation,
  closeMongoDB,
};
