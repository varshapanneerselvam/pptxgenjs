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

  const jsonData = {
    "slides": [
      {
        "version": "6.0.0-beta12",
        "id": "APxCmQX_hz",
        "background": "rgba(0,0,0)",
        "objects": [
          {
            "rx": 0,
            "ry": 0,
            "id": "WorkSpaceDrawType",
            "name": "rect",
            "color": "#ffffff",
            "padding": 0,
            "fill": "#ffffff",
            "selectable": false,
            "evented": false,
            "fillType": 0,
            "lockMovementX": false,
            "lockMovementY": false,
            "objectCaching": true,
            "transparentCorners": false,
            "hasBorders": true,
            "globalCompositeOperation": "source-over",
            "type": "Rect",
            "version": "6.0.2",
            "originX": "left",
            "originY": "top",
            "left": 0,
            "top": 0,
            "width": 1070.5512,
            "height": 645.3543,
            "stroke": "",
            "strokeWidth": 1,
            "strokeDashArray": null,
            "strokeLineCap": "butt",
            "strokeDashOffset": 0,
            "strokeLineJoin": "miter",
            "strokeUniform": false,
            "strokeMiterLimit": 4,
            "scaleX": 1,
            "scaleY": 1,
            "angle": 0,
            "flipX": false,
            "flipY": false,
            "opacity": 1,
            "shadow": null,
            "visible": true,
            "backgroundColor": "rgba(0,0,0)",
            "fillRule": "nonzero",
            "paintFirst": "fill",
            "skewX": 0,
            "skewY": 0
          },
          {
            "cropX": 0,
            "cropY": 0,
            "id": "LCc2FAL85j",
            "name": "image",
            "padding": 0,
            "fill": "rgb(0,0,0)",
            "selectable": true,
            "evented": true,
            "lockMovementX": false,
            "lockMovementY": false,
            "objectCaching": false,
            "transparentCorners": false,
            "hasBorders": true,
            "globalCompositeOperation": "source-over",
            "type": "Image",
            "version": "6.0.2",
            "originX": "left",
            "originY": "top",
            "left": 222.8295,
            "top": 142.2794,
            "width": 1280,
            "height": 720,
            "stroke": null,
            "strokeWidth": 0,
            "strokeDashArray": null,
            "strokeLineCap": "butt",
            "strokeDashOffset": 0,
            "strokeLineJoin": "miter",
            "strokeUniform": false,
            "strokeMiterLimit": 4,
            "scaleX": 0.5543,
            "scaleY": 0.5543,
            "angle": 0,
            "flipX": false,
            "flipY": false,
            "opacity": 1,
            "shadow": null,
            "visible": true,
            "backgroundColor": "",
            "fillRule": "nonzero",
            "paintFirst": "fill",
            "skewX": 0,
            "skewY": 0,
            "src": "https://d1juzhbvb641ua.cloudfront.net/1080p/48d53691-633f-4b04-8670-ed766444106f.mp4",
            "crossOrigin": "anonymous",
            "filters": []
          }
        ],
        "workSpace": {
          "fillType": 0,
          "left": 0,
          "top": 0,
          "angle": 0,
          "scaleX": 1,
          "scaleY": 1,
          "color": "#ffffff",
          "fill": "#ffffff",
          "backgroundColor": "rgba(0,0,0)"
        },
        "zoom": 0.4298950822503346,
        "timer": 0,
        "width": 456.97508743145806,
        "height": 274.18505245887485
      },
      {
        "id": "kBnPAZHLCm",
        "version": "5.3.0",
        "zoom": 0.4298950822503346,
        "width": 456.97508743145806,
        "height": 274.18505245887485,
        "objects": [
          {
            "rx": 0,
            "ry": 0,
            "id": "WorkSpaceDrawType",
            "name": "rect",
            "color": "#ffffff",
            "padding": 0,
            "fill": "#ffffff",
            "selectable": false,
            "evented": false,
            "fillType": 0,
            "lockMovementX": false,
            "lockMovementY": false,
            "objectCaching": true,
            "transparentCorners": false,
            "hasBorders": true,
            "globalCompositeOperation": "source-over",
            "type": "Rect",
            "version": "6.0.2",
            "originX": "left",
            "originY": "top",
            "left": 0,
            "top": 0,
            "width": 1070.5512,
            "height": 645.3543,
            "stroke": "",
            "strokeWidth": 1,
            "strokeDashArray": null,
            "strokeLineCap": "butt",
            "strokeDashOffset": 0,
            "strokeLineJoin": "miter",
            "strokeUniform": false,
            "strokeMiterLimit": 4,
            "scaleX": 1,
            "scaleY": 1,
            "angle": 0,
            "flipX": false,
            "flipY": false,
            "opacity": 1,
            "shadow": null,
            "visible": true,
            "backgroundColor": "rgba(0,0,0)",
            "fillRule": "nonzero",
            "paintFirst": "fill",
            "skewX": 0,
            "skewY": 0
          },
          {
            "cropX": 0,
            "cropY": 0,
            "id": "YQsOsU8IDW",
            "name": "image",
            "padding": 0,
            "fill": "rgb(0,0,0)",
            "selectable": true,
            "evented": true,
            "lockMovementX": false,
            "lockMovementY": false,
            "objectCaching": false,
            "transparentCorners": false,
            "hasBorders": true,
            "globalCompositeOperation": "source-over",
            "type": "Image",
            "version": "6.0.2",
            "originX": "left",
            "originY": "top",
            "left": 329.9914,
            "top": 149.7065,
            "width": 1024,
            "height": 768,
            "stroke": null,
            "strokeWidth": 0,
            "strokeDashArray": null,
            "strokeLineCap": "butt",
            "strokeDashOffset": 0,
            "strokeLineJoin": "miter",
            "strokeUniform": false,
            "strokeMiterLimit": 4,
            "scaleX": 0.4517,
            "scaleY": 0.4517,
            "angle": 0,
            "flipX": false,
            "flipY": false,
            "opacity": 1,
            "shadow": null,
            "visible": true,
            "backgroundColor": "",
            "fillRule": "nonzero",
            "paintFirst": "fill",
            "skewX": 0,
            "skewY": 0,
            "src": "https://d1juzhbvb641ua.cloudfront.net/1080p/ad1a9e4f-8036-4852-b5f4-4324c74b504c.mp4",
            "crossOrigin": "anonymous",
            "filters": []
          }
        ],
        "workSpace": {
          "fillType": 0,
          "left": 0,
          "top": 0,
          "angle": 0,
          "scaleX": 1,
          "scaleY": 1
        },
        "background": "rgba(255,255,255,0)",
        "timer": 0
      }
    ]
  };

  for (let i = 0; i < jsonData.slides.length; i++) {
    const slideData = jsonData.slides[i];
    const slide = pptx.addSlide();

    const stageRect = (slideData.objects || []).find(
      o => o.type === 'Rect' && o.left === 0 && o.top === 0 && o.width && o.height
    );

    const designPxW = stageRect ? (stageRect.width * (stageRect.scaleX || 1)) : (slideData.width || PPTX_PX_W);
    const designPxH = stageRect ? (stageRect.height * (stageRect.scaleY || 1)) : (slideData.height || PPTX_PX_H);
    const scaleX = PPTX_PX_W / designPxW;
    const scaleY = PPTX_PX_H / designPxH;

    if (slideData.background) {
      const m = slideData.background?.match(/\d+/g);
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
          const m = (obj.color || obj.fill || '').match(/\d+/g);
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
          const m = (obj.fill || 'rgba(255,255,255,1)').match(/\d+/g);
          if (m) {
            const bgRgb = m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
            slide.background = { color: bgRgb };
          }
          continue;
        }
        let rgb = 'FFFFFF';
        try {
          const m = (obj.fill || '').match(/\d+/g);
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
          // If obj.src is a video URL, download and embed
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
            console.error(`Error loading image ${varKey}:`, error);
          }
        } else {
          try {
            slide.addImage({ path: obj.src, ...imageIn });
          } catch (error) {
            console.error(`Error loading regular image ${obj.src}:`, error);
          }
        }
      }
    }
  }

  await pptx.writeFile({ fileName: 'presentation.pptx' });
  console.log('✅ PPTX generated successfully!');
}

generatePresentation().catch(console.error);