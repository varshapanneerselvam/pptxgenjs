const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const presentation_json = require("./data").presentation_json;

// Step 1: Fetch documentation text
async function fetchDocText(url) {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  return $("body").text(); // get all text
}

// Your pptxgenjs docs link
const doc_link = "https://gitbrent.github.io/PptxGenJS/";

// Step 2: Base URL for your custom LLM
const BASE_URL =
  "https://infinitfmservice.sifymdp.digital/llama-3.3-70b-nim/v1";

// Step 3: Prepare LLM input
const llm_input = [
  {
    role: "system",
    content: `You are a professional pptxgenjs code generator. I will provide JSON representing a Y5T presentation. You MUST generate a working JavaScript output that creates a PPTX file - no blank slides allowed.  
Follow this structured reasoning process internally (DO NOT show these thoughts to the user):

Chain-of-Thought Reasoning:

Step through JSON parsing logically.
Decide correct conversions (pixels → inches, colors, scaling).
Decide correct async/await placements for MongoDB calls.
Plan slide creation in correct order.

ReAct Pattern:

THINK: Identify what the JSON requires and what helper functions (initializeMongoDB, fetchImageSmart) will be needed.
ACT: Write correct JavaScript code following the pattern below.

Reflection (Self-Check):

Before finalizing, mentally verify:

All imports present.
No missing await keywords where required.
All pixel values converted to inches (divide by 96).
Colors formatted without #.
Layout explicitly defined.
All object types handled (Textbox, Rect, Image).
MongoDB image variable handling correct using fetchImageSmart.

Refinement:

If the self-check fails any rule, rewrite the code until all rules pass.

🚨 CRITICAL SUCCESS REQUIREMENTS:
JavaScript Requirements (MOST IMPORTANT):
Use this EXACT STRUCTURE:
const fs = require("fs");
const https = require("https");
const path = require("path");
const PptxGenJS = require("pptxgenjs");
const { initializeMongoDB, fetchImageSmart } = require('./imageHelper.js');

// Helper to download video from URL to local file
async function downloadVideo(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => resolve(outputPath));
        });
      })
      .on("error", (err) => {
        fs.unlink(outputPath, () => reject(err));
      });
  });
}

// Ensure media folder exists
const mediaDir = path.join(__dirname, "media");
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir);
}

async function generatePresentation() {
  try {
    await initializeMongoDB();
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.warn('⚠️ MongoDB failed, continuing without images:', error);
  }

  const pptx = new PptxGenJS();
  const PPTX_LAYOUT_WIDTH_IN = 10;
  const PPTX_LAYOUT_HEIGHT_IN = 5.625;
  pptx.defineLayout({ name: 'LAYOUT_16x9', width: PPTX_LAYOUT_WIDTH_IN, height: PPTX_LAYOUT_HEIGHT_IN });
  pptx.layout = 'LAYOUT_16x9';

  const PPTX_PX_W = PPTX_LAYOUT_WIDTH_IN * 96;
  const PPTX_PX_H = PPTX_LAYOUT_HEIGHT_IN * 96;

  const pxToIn = (px) => px / 96;

  for (let i = 0; i < jsonData.slides.length; i++) {
    const slideData = jsonData.slides[i];
    const slide = pptx.addSlide();

    const stageRect = (slideData.objects || []).find(
      o => o.type === 'Rect' && o.left === 0 && o.top === 0 && o.width && o.height
    );a

    const designPxW = stageRect ? (stageRect.width * (stageRect.scaleX || 1)) : (slideData.width || PPTX_PX_W);
    const designPxH = stageRect ? (stageRect.height * (stageRect.scaleY || 1)) : (slideData.height || PPTX_PX_H);
    const scaleX = PPTX_PX_W / designPxW;
    const scaleY = PPTX_PX_H / designPxH;

    if (slideData.background) {
      const m = slideData.background?.match(/\\d+/g);
      if (m) {
        const rgb = m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
        slide.background = { color: rgb };
      }
    }

    for (const obj of slideData.objects || []) {
      const objLeftPx = (obj.left || 0) * scaleX;
      const objTopPx = (obj.top || 0) * scaleY;
      const objWpx = ((obj.width || 100) * (obj.scaleX || 1)) * scaleX;
      const objHpx = ((obj.height || 50) * (obj.scaleY || 1)) * scaleY;

      const x = pxToIn(objLeftPx);
      const y = pxToIn(objTopPx);
      const w = pxToIn(objWpx);
      const h = pxToIn(objHpx);

      if (obj.type === 'Textbox') {
        let rgb = '000000';
        try {
          const m = (obj.color || obj.fill || '').match(/\\d+/g);
          if (m) rgb = m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
        } catch (e) {}
        let align = 'left';
        if (obj.textAlign?.includes('center')) align = 'center';
        else if (obj.textAlign?.includes('right')) align = 'right';
        else if (obj.textAlign?.includes('justify')) align = 'justify';
        let valign = 'top';
        if (obj.originY === 'center' || obj.originY === 'middle') valign = 'middle';
        else if (obj.originY === 'bottom') valign = 'bottom';

        let adjX = x;
        let adjY = y;
        if (obj.originX === 'center') adjX -= w / 2;
        else if (obj.originX === 'right') adjX -= w;
        if (obj.originY === 'center' || obj.originY === 'middle') adjY -= h / 2;
        else if (obj.originY === 'bottom') adjY -= h;

        const fontPx = (obj.fontSize || 12) * (obj.scaleY || 1) * scaleY;
        const fontPt = Math.max(8, Math.round(fontPx * 0.75));

        slide.addText(obj.text || '', {
          x: adjX,
          y: adjY,
          w: w,
          h: h,
          fontSize: fontPt,
          fontFace: obj.fontFamily || 'Arial',
          color: rgb,
          align,
          valign,
          margin: [0, 0, 0, 0],
          fit: 'shrink',
          bold: obj.fontWeight === 'bold' || obj.fontWeight === '700'
        });
      }

      else if (obj.type === 'Rect') {
        const isStageRect =
          (obj.left === 0 && obj.top === 0) &&
          (((obj.width || 0) * (obj.scaleX || 1)) * scaleX >= (PPTX_PX_W * 0.95)) &&
          (((obj.height || 0) * (obj.scaleY || 1)) * scaleY >= (PPTX_PX_H * 0.95));
        if (isStageRect) {
          const m = (obj.fill || 'rgba(255,255,255,1)').match(/\\d+/g);
          if (m) {
            const bgRgb = m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
            slide.background = { color: bgRgb };
          }
          continue;
        }
        let rgb = 'FFFFFF';
        try {
          const m = (obj.fill || '').match(/\\d+/g);
          if (m) rgb = m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
        } catch (e) {}
        slide.addShape(pptx.ShapeType.rect, {
          x: x,
          y: y,
          w: w,
          h: h,
          fill: { color: rgb },
          line: { color: (obj.stroke || '000000').replace('#', ''), width: obj.strokeWidth || 0 }
        });
      }

      else if (obj.type === 'Image' && obj.src) {
        const imageIn = { x: x, y: y, w: w, h: h };
        if (obj.src.startsWith('http')) {
          // ✅ If obj.src is a video URL, download and embed
          const fileName = path.basename(obj.src);
          const localPath = path.join(mediaDir, fileName);
          await downloadVideo(obj.src, localPath);
          slide.addMedia({
            type: 'video',
            path: localPath,
            x: x,
            y: y,
            w: w,
            h: h
          });
        } else if (obj.src.startsWith('var') || obj.src.startsWith('$')) {
          const varKey = obj.src.startsWith('$') ? obj.src.substring(1) : obj.src;
          try {
            const imageData = await fetchImageSmart(varKey);
            if (imageData) {
              slide.addImage({ data: imageData, ...imageIn });
            }
          } catch (error) {
            console.error(\`Error loading image \${varKey}:\`, error);
          }
        } else {
          try {
            slide.addImage({ path: obj.src, ...imageIn });
          } catch (error) {
            console.error(\`Error loading regular image \${obj.src}:\`, error);
          }
        }
      }
    }
  }

  await pptx.writeFile({ fileName: 'presentation.pptx' });
  console.log('✅ PPTX generated successfully!');
}

generatePresentation().catch(console.error);

LAYOUT SAFETY RULES:
- Ensure all text, shapes, and images stay fully within the PPTX slide boundaries.
- For textboxes: use \`fit: 'shrink'\` or wrap text inside their width/height if content is too long.
- Do not alter text alignment, positioning, or formatting when shrinking/wrapping.
- If object coordinates would place it outside the slide, clamp its position so it remains visible.

SIZE CONVERSION RULES:
Divide all pixel values by 96 to get inches. Never use pixels directly.
COLOR HANDLING:
Remove # from hex colors.
Use 6-digit hex.
Default to black (000000) if missing.
ASYNC/AWAIT:
Use async function wrapping.
Await MongoDB calls and pptx.writeFile().
JSON PROCESSING RULES:
Parse each slide from jsonData.slides[].
Handle Textbox, Rect, Image.
IMAGE FETCHING:
ALWAYS use fetchImageSmart(varKey) - it automatically finds the correct presentation and image.
DO NOT use fetchImageFromDB or fetchAnyImageForVar.
DO NOT hardcode presentation IDs.
ERROR PREVENTION CHECKLIST:
✅ Imports correct (fetchImageSmart only)
✅ Async/await correct
✅ Pixel → inch conversion done
✅ Colors correct format
✅ Layout set explicitly
✅ All object types handled
✅ Smart image fetching used
✅ Proper error handling
✅ File saved

FINAL STEP:
Respond ONLY with one complete JavaScript code block.
Start with \`\`\`javascript
End with \`\`\`
Do not include anything else before or after the code.`,
  },
  {
    role: "user",
    content: `this is the presentation json: ${JSON.stringify(
      presentation_json
    )}`,
  },
];

// Step 4: Extract code from LLM response
function extractCode(outputText, contentType, fallbackLang) {
  // Try <xaiArtifact> first
  let match = outputText.match(
    new RegExp(
      `<xaiArtifact[^>]*contentType\\s*=\\s*"${contentType}"[^>]*>([\\s\\S]*?)<\\/xaiArtifact>`,
      "i"
    )
  );
  if (match) return match[1].trim();

  // Fallback to ```lang``` code block
  match = outputText.match(
    new RegExp("```" + fallbackLang + "([\\s\\S]*?)```", "i")
  );
  if (match) return match[1].trim();

  return null;
}

// Step 5: Main function to call your LLM API
async function main() {
  try {
    // Fetch documentation text
    const docText = await fetchDocText(doc_link);
    console.log("✅ Documentation fetched");

    // Call custom LLM server
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: "meta/llama-3.3-70b-instruct", // adjust if your server uses a different name
        messages: llm_input,
        max_tokens: 4096,
        temperature: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          // ⚠️ if your server requires a token, add it here:
          // "Authorization": "Bearer <your_token>"
        },
      }
    );

    const outputText = response.data.choices[0].message.content;
    console.log(
      "Raw LLM Response (Preview):\n",
      outputText.slice(0, 500),
      "..."
    );

    const jsCode = extractCode(
      outputText,
      "application/javascript",
      "javascript"
    );
    if (jsCode) {
      fs.writeFileSync("presentation.js", jsCode, "utf-8");
      console.log("✅ Saved presentation.js");
    } else {
      console.warn("⚠️ No JavaScript code found.");
    }
  } catch (error) {
    console.error(
      "❌ LLM request failed:",
      error.response?.data || error.message
    );
  }
}

// Run main
main();
