# PPTX Generator API

A REST API that converts JSON presentations to PPTX files using LLM-powered code generation and PptxGenJS.

## Features

- **Full Flow API**: Single endpoint that handles image extraction, MongoDB storage, LLM code generation, and PPTX creation
- **Direct Generation**: Faster alternative that skips LLM and generates PPTX directly
- **Image Handling**: Automatically extracts base64 images and stores them in MongoDB
- **Scalable**: Each request gets a unique job ID for tracking

## Installation

```bash
cd api
npm install
```

## Configuration

Edit `config.js` or set environment variables:

```javascript
PORT=3000                           // Server port
MONGODB_URL=mongodb://localhost:27017/pptx_generator_db
LLM_API_KEY=your_api_key           // OpenAI/LLM API key
LLM_BASE_URL=https://your-llm-endpoint
LLM_MODEL=meta/llama-3.3-70b-instruct
```

## Running

```bash
# Start the server
npm start

# Or with auto-reload during development
npm run dev
```

## API Endpoints

### 1. Generate PPTX (with LLM)

**POST** `/api/generate-pptx`

Generates PPTX using LLM to create the code.

**Request Body:**

```json
{
  "json": {
    "slides": [
      {
        "background": "rgba(255,255,255,1)",
        "objects": [
          {
            "type": "Textbox",
            "text": "Hello World",
            "left": 100,
            "top": 100,
            "width": 400,
            "height": 50,
            "fontSize": 24,
            "color": "rgba(0,0,0,1)"
          }
        ]
      }
    ]
  },
  "options": {
    "useLLM": true,
    "name": "My Presentation"
  }
}
```

**Response:**

```json
{
  "success": true,
  "jobId": "uuid-here",
  "downloadUrl": "/output/presentation_uuid.pptx",
  "fileName": "presentation_uuid.pptx",
  "presentationId": "mongodb-id",
  "imageCount": 3
}
```

### 2. Generate PPTX (Direct - Faster)

**POST** `/api/generate-pptx-direct`

Generates PPTX directly without LLM (faster but less flexible).

**Request Body:**

```json
{
  "json": { ... },
  "name": "My Presentation"
}
```

### 3. Download File

**GET** `/api/download/:filename`

Download a generated PPTX file.

### 4. Health Check

**GET** `/health`

Returns server status.

## Supported Object Types

- **Textbox**: Text with font, color, alignment
- **Rect**: Rectangles with fill colors
- **Image**: Base64 images or external URLs
- **Video**: External video URLs (downloaded and embedded)

## Flow Diagram

```
Input JSON (with base64 images)
        │
        ▼
┌───────────────────┐
│  Extract Images   │  → vars: { var1: "data:image...", var2: ... }
│  (imageProcessor) │  → cleanJson: { slides: [...] }
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Store in MongoDB │  → presentations collection
│  (mongoService)   │  → imagemappings collection
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Generate Code    │  → JavaScript code for PptxGenJS
│  (llmService)     │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Execute Code     │  → presentation.pptx
│  (pptxGenerator)  │
└───────────────────┘
        │
        ▼
    Download URL
```

## Example Usage

### Using cURL:

```bash
curl -X POST http://localhost:3000/api/generate-pptx \
  -H "Content-Type: application/json" \
  -d @your-presentation.json
```

### Using JavaScript:

```javascript
const response = await fetch("http://localhost:3000/api/generate-pptx", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    json: presentationData,
    options: { useLLM: true },
  }),
});

const result = await response.json();
console.log("Download URL:", result.downloadUrl);
```

## Folder Structure

```
api/
├── config.js           # Configuration
├── server.js           # Express server & routes
├── package.json
├── README.md
├── services/
│   ├── mongoService.js    # MongoDB operations
│   ├── imageProcessor.js  # Image extraction
│   ├── llmService.js      # LLM code generation
│   └── pptxGenerator.js   # PPTX file generation
├── output/             # Generated PPTX files
└── media/              # Downloaded media files
```

## Notes

- Large JSON payloads (with base64 images) are supported up to 100MB
- Generated files are stored in the `output/` folder
- MongoDB must be running for image storage
- The LLM endpoint must be accessible for code generation
