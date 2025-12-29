const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const config = require("./config");
const {
  initializeMongoDB,
  storePresentation,
  closeMongoDB,
} = require("./services/mongoService");
const {
  extractImages,
  validatePresentationJson,
} = require("./services/imageProcessor");
const { generatePptxCode } = require("./services/llmService");
const { executePptxCode } = require("./services/pptxGenerator");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "100mb" })); // Large limit for base64 images
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Serve generated files
app.use("/output", express.static(path.resolve(config.OUTPUT_DIR)));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * Main API: Convert JSON to PPTX using LLM
 *
 * POST /api/generate-pptx
 * Body: { json: <presentation_json>, name?: string }
 */
app.post("/api/generate-pptx", async (req, res) => {
  const jobId = uuidv4();
  console.log(`\n🚀 Starting job: ${jobId}`);

  try {
    const { json: inputJson, name = "Presentation" } = req.body;

    // Validate input
    if (!inputJson) {
      return res.status(400).json({
        success: false,
        error: "Missing 'json' in request body",
      });
    }

    // Validate JSON structure
    const validation = validatePresentationJson(inputJson);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: "Invalid presentation JSON",
        details: validation.errors,
      });
    }

    console.log("Step 1: Extracting images from JSON...");
    const { cleanJson, imageVars, imageCount } = extractImages(inputJson);
    console.log(`   Extracted ${imageCount} images`);

    console.log("Step 2: Storing in MongoDB...");
    const { presentationId } = await storePresentation(
      cleanJson,
      imageVars,
      name
    );
    console.log(`   Presentation ID: ${presentationId}`);

    console.log("Step 3: Generating code with LLM...");
    const generatedCode = await generatePptxCode(cleanJson, presentationId);

    // Save generated code for debugging
    const codeDir = path.resolve(config.OUTPUT_DIR);
    if (!fs.existsSync(codeDir)) {
      fs.mkdirSync(codeDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(codeDir, `generated_${jobId}.js`),
      generatedCode,
      "utf-8"
    );

    console.log("Step 4: Executing generated code...");
    const outputPath = await executePptxCode(generatedCode, jobId);

    // Verify file exists
    if (!fs.existsSync(outputPath)) {
      throw new Error("PPTX file was not created");
    }

    const fileName = path.basename(outputPath);
    const downloadUrl = `/output/${fileName}`;

    console.log(`✅ Job ${jobId} completed successfully!`);
    console.log(`   Download: ${downloadUrl}\n`);

    res.json({
      success: true,
      jobId,
      downloadUrl,
      fileName,
      presentationId,
      imageCount,
    });
  } catch (error) {
    console.error(`❌ Job ${jobId} failed:`, error);
    res.status(500).json({
      success: false,
      jobId,
      error: error.message,
    });
  }
});

/**
 * Download endpoint
 * GET /api/download/:filename
 */
app.get("/api/download/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.resolve(config.OUTPUT_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: "File not found",
    });
  }

  res.download(filePath, filename);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// Start server
async function startServer() {
  try {
    // Initialize MongoDB connection
    console.log("🔌 Connecting to MongoDB...");
    await initializeMongoDB();

    // Create output directory
    const outputDir = path.resolve(config.OUTPUT_DIR);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Start listening
    app.listen(config.PORT, () => {
      console.log(
        `\n🚀 PPTX Generator API running on http://localhost:${config.PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down...");
  await closeMongoDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down...");
  await closeMongoDB();
  process.exit(0);
});

startServer();

module.exports = app;
