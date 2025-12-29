/**
 * Image Processor Service
 * Extracts base64 images from JSON and replaces them with variable references
 */

/**
 * Process presentation JSON to extract images
 * @param {Object} inputJson - Raw presentation JSON with base64 images
 * @returns {Object} - { cleanJson, imageVars, imageCount }
 */
function extractImages(inputJson) {
  // Deep clone to avoid mutating original
  const data = JSON.parse(JSON.stringify(inputJson));

  console.log(
    "📦 Processing JSON, type:",
    Array.isArray(data) ? "Array" : typeof data
  );

  // Determine slides array location
  let slides;
  if (Array.isArray(data)) {
    slides = data;
  } else {
    slides = data.slides || data.pages || null;
  }

  if (!slides || !Array.isArray(slides)) {
    console.error("❌ Error: Could not find slides array.");
    return { cleanJson: data, imageVars: {}, imageCount: 0 };
  }

  const imageVars = {};
  let counter = 1;

  // Process each slide
  slides.forEach((slide, slideIdx) => {
    const elements = slide.objects || slide.elements;
    if (!elements || !Array.isArray(elements)) {
      console.log(`⚠️ Slide ${slideIdx} has no objects/elements.`);
      return;
    }

    // Process each element in the slide
    elements.forEach((el, elIdx) => {
      if (
        el &&
        el.src &&
        typeof el.src === "string" &&
        el.src.startsWith("data:image")
      ) {
        const varName = `var${counter}`;
        imageVars[varName] = el.src;
        el.src = varName;
        counter++;
        console.log(
          `✅ Found image in slide ${slideIdx}, element ${elIdx} → replaced with ${varName}`
        );
      }
    });
  });

  // Construct clean presentation object
  const cleanJson = Array.isArray(data) ? { slides: data } : data;

  console.log(`✅ Done! Extracted ${counter - 1} images.`);

  return {
    cleanJson,
    imageVars,
    imageCount: counter - 1,
  };
}

/**
 * Validate presentation JSON structure
 * @param {Object} json - Presentation JSON to validate
 * @returns {Object} - { valid, errors }
 */
function validatePresentationJson(json) {
  const errors = [];

  if (!json) {
    errors.push("JSON is null or undefined");
    return { valid: false, errors };
  }

  // Check for slides
  let slides;
  if (Array.isArray(json)) {
    slides = json;
  } else {
    slides = json.slides || json.pages;
  }

  if (!slides || !Array.isArray(slides)) {
    errors.push("No slides array found in JSON");
    return { valid: false, errors };
  }

  if (slides.length === 0) {
    errors.push("Slides array is empty");
    return { valid: false, errors };
  }

  // Validate each slide has some structure
  slides.forEach((slide, idx) => {
    if (!slide.objects && !slide.elements) {
      errors.push(`Slide ${idx} has no objects or elements`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  extractImages,
  validatePresentationJson,
};
