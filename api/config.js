// Configuration for the PPTX Generator API

module.exports = {
  // Server config
  PORT: process.env.PORT || 3000,

  // MongoDB config
  MONGODB_URL:
    process.env.MONGODB_URL || "mongodb://localhost:27017/pptx_generator_db",
  DB_NAME: process.env.DB_NAME || "pptx_generator_db",

  // OpenAI/LLM config
  LLM_API_KEY:
    process.env.LLM_API_KEY ||
    "sk-7Yf2mHqP0bRx1nLtW8kzQe6uCpD4aVjFsLrMgNtHyZwBx",
  LLM_BASE_URL:
    process.env.LLM_BASE_URL || "https://infinitai.sifymdp.digital/maas/v1",
  LLM_MODEL: process.env.LLM_MODEL || "meta/llama-3.3-70b-instruct",

  // Output config
  OUTPUT_DIR: process.env.OUTPUT_DIR || "./output",
  MEDIA_DIR: process.env.MEDIA_DIR || "./media",
};
