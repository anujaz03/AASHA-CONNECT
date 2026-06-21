// ocr-processor.js
// Client-side canvas-based image processing algorithms, quality checks, and post-processing tools

const OCRProcessor = {
  // Verhoeff Checksum Tables
  verhoeff_d: [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ],

  verhoeff_p: [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ],

  verhoeff_inv: [0, 4, 3, 2, 1, 5, 6, 7, 8, 9],

  // Validate a 12-digit Aadhaar number using the Verhoeff algorithm
  validateVerhoeff: function(aadhaarStr) {
    const cleanStr = aadhaarStr.replace(/\D/g, "");
    if (cleanStr.length !== 12) return false;
    
    let c = 0;
    const digits = cleanStr.split("").map(Number).reverse();
    for (let i = 0; i < digits.length; i++) {
      c = this.verhoeff_d[c][this.verhoeff_p[i % 8][digits[i]]];
    }
    return c === 0;
  },

  // Perform Image Quality Guard check: returns stats and true/false on acceptance
  checkImageQuality: function(canvasElement) {
    const ctx = canvasElement.getContext('2d');
    const w = canvasElement.width;
    const h = canvasElement.height;
    
    // Sample dynamic range and brightness
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    
    let sumBrightness = 0;
    let minVal = 255;
    let maxVal = 0;
    let count = 0;
    
    // Sample every 40th pixel to keep it fast
    const sampleStep = 40 * 4;
    for (let i = 0; i < data.length; i += sampleStep) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      sumBrightness += gray;
      if (gray < minVal) minVal = gray;
      if (gray > maxVal) maxVal = gray;
      count++;
    }
    
    const avgBrightness = sumBrightness / count;
    const contrastRange = maxVal - minVal;
    
    const isDark = avgBrightness < 45;
    const isBright = avgBrightness > 225;
    const isLowContrast = contrastRange < 60;
    
    // Blur check using Laplacian variance approximation over a 200x200 central patch
    const patchSize = Math.min(200, w, h);
    const startX = Math.floor((w - patchSize) / 2);
    const startY = Math.floor((h - patchSize) / 2);
    
    const patchImgData = ctx.getImageData(startX, startY, patchSize, patchSize);
    const pData = patchImgData.data;
    
    let lapVals = [];
    let sumLap = 0;
    
    for (let y = 1; y < patchSize - 1; y += 2) {
      for (let x = 1; x < patchSize - 1; x += 2) {
        const getGray = (px, py) => {
          const idx = (py * patchSize + px) * 4;
          return 0.299 * pData[idx] + 0.587 * pData[idx+1] + 0.114 * pData[idx+2];
        };
        
        const c = getGray(x, y);
        const n = getGray(x, y-1);
        const s = getGray(x, y+1);
        const e = getGray(x+1, y);
        const wVal = getGray(x-1, y);
        
        const lap = n + s + e + wVal - 4 * c;
        lapVals.push(lap);
        sumLap += lap;
      }
    }
    
    const meanLap = sumLap / lapVals.length;
    let sumSquareDiff = 0;
    for (let i = 0; i < lapVals.length; i++) {
      sumSquareDiff += (lapVals[i] - meanLap) ** 2;
    }
    const variance = sumSquareDiff / lapVals.length;
    const isBlurry = variance < 12; // lower = blurrier
    
    return {
      avgBrightness: Math.round(avgBrightness),
      contrastRange: Math.round(contrastRange),
      variance: Math.round(variance),
      isDark,
      isBright,
      isLowContrast,
      isBlurry,
      passed: !isDark && !isBright && !isLowContrast && !isBlurry
    };
  },

  // Crop a specific bounding box from source canvas onto target canvas with margin padding
  cropRegion: function(sourceCanvas, bbox, targetCanvas, pad = 15) {
    const sW = sourceCanvas.width;
    const sH = sourceCanvas.height;
    
    let x0 = Math.max(0, bbox.x0 - pad);
    let y0 = Math.max(0, bbox.y0 - pad);
    let x1 = Math.min(sW, bbox.x1 + pad);
    let y1 = Math.min(sH, bbox.y1 + pad);
    
    const cropW = x1 - x0;
    const cropH = y1 - y0;
    
    targetCanvas.width = cropW;
    targetCanvas.height = cropH;
    
    const ctx = targetCanvas.getContext('2d');
    if (cropW > 0 && cropH > 0) {
      ctx.drawImage(sourceCanvas, x0, y0, cropW, cropH, 0, 0, cropW, cropH);
    }
  },

  // Preprocessor for Pass 1: Grayscale & Contrast stretching
  applyGrayscaleStretch: function(canvasElement) {
    const ctx = canvasElement.getContext('2d');
    const w = canvasElement.width;
    const h = canvasElement.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    
    // Grayscale
    for (let i = 0; i < data.length; i += 4) {
      const g = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      data[i] = g; data[i+1] = g; data[i+2] = g;
    }
    
    // Stretch
    let min = 255, max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const val = data[i];
      if (val < min) min = val;
      if (val > max) max = val;
    }
    if (max > min) {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = ((data[i] - min) / (max - min)) * 255;
        data[i+1] = data[i];
        data[i+2] = data[i];
      }
    }
    ctx.putImageData(imgData, 0, 0);
  },

  // Preprocessor for Pass 2: Sharpening filter
  applySharpenFilter: function(canvasElement) {
    this.applyGrayscaleStretch(canvasElement);
    const ctx = canvasElement.getContext('2d');
    const w = canvasElement.width;
    const h = canvasElement.height;
    
    const weights = [
       0, -1,  0,
      -1,  5, -1,
       0, -1,  0
    ];
    
    const side = 3;
    const halfSide = 1;
    
    const srcData = ctx.getImageData(0, 0, w, h);
    const src = srcData.data;
    const output = ctx.createImageData(w, h);
    const dst = output.data;
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dstOff = (y * w + x) * 4;
        let r = 0, g = 0, b = 0;
        
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = y + cy - halfSide;
            const scx = x + cx - halfSide;
            
            if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
              const srcOff = (scy * w + scx) * 4;
              const wt = weights[cy * side + cx];
              r += src[srcOff] * wt;
              g += src[srcOff+1] * wt;
              b += src[srcOff+2] * wt;
            }
          }
        }
        dst[dstOff] = Math.min(255, Math.max(0, r));
        dst[dstOff+1] = Math.min(255, Math.max(0, g));
        dst[dstOff+2] = Math.min(255, Math.max(0, b));
        dst[dstOff+3] = 255;
      }
    }
    ctx.putImageData(output, 0, 0);
  },

  // Preprocessor for Pass 3: Otsu Thresholding (Binarization)
  applyOtsuBinarization: function(canvasElement) {
    this.applyGrayscaleStretch(canvasElement);
    const ctx = canvasElement.getContext('2d');
    const w = canvasElement.width;
    const h = canvasElement.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    
    // Get histogram
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histogram[Math.round(data[i])]++;
    }
    
    const total = data.length / 4;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 128;
    
    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      wF = total - wB;
      if (wF === 0) break;
      
      sumB += t * histogram[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const varBetween = wB * wF * (mB - mF) * (mB - mF);
      
      if (varBetween > varMax) {
        varMax = varBetween;
        threshold = t;
      }
    }
    
    for (let i = 0; i < data.length; i += 4) {
      const val = data[i] >= threshold ? 255 : 0;
      data[i] = val; data[i+1] = val; data[i+2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
  },

  // Preprocessor for Pass 4: High Contrast Adaptive Boost
  applyHighContrastAdaptive: function(canvasElement) {
    this.applyGrayscaleStretch(canvasElement);
    const ctx = canvasElement.getContext('2d');
    const w = canvasElement.width;
    const h = canvasElement.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    
    // Boost contrast exponentially (gamma correction or high-contrast stretch)
    for (let i = 0; i < data.length; i += 4) {
      let val = data[i] / 255.0;
      // Exponential sigmoid-like contrast boost
      val = 1 / (1 + Math.exp(-10 * (val - 0.5)));
      const finalVal = Math.round(val * 255);
      data[i] = finalVal;
      data[i+1] = finalVal;
      data[i+2] = finalVal;
    }
    ctx.putImageData(imgData, 0, 0);
  },

  // AI-Assisted dictionary corrections to resolve common OCR text confusions
  postProcessCleanup: function(fieldName, value) {
    if (!value) return "";
    let clean = value.trim();

    // 1. Name Cleaning
    if (fieldName === "headName") {
      // Remove symbols and OCR artifacts
      clean = clean.replace(/[^a-zA-Z\s]/g, "");
      // Clean up common suffix garbage words
      const blacklistNameSuffixes = /\b(en|er|es|rt|ere|uidai|government|india|male|female)\b/gi;
      clean = clean.replace(blacklistNameSuffixes, "");
      // Split into words, capitalisation
      const words = clean.split(/\s+/).filter(w => w.length > 1);
      clean = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }

    // 2. Address Cleaning
    if (fieldName === "address") {
      // Clean leading punctuation
      clean = clean.replace(/^[:\-\s,=]+/, "");
      // Common spelling corrections dictionary
      const corrections = [
        { regex: /\bga(j|z)anan\b/gi, replacement: "Gajanan" },
        { regex: /\bmahar(a|j)j\b/gi, replacement: "Maharaj" },
        { regex: /\bhol\b/gi, replacement: "Hall" },
        { regex: /\bopp\b/gi, replacement: "Opposite" },
        { regex: /\boppos(i|e)t\b/gi, replacement: "Opposite" },
        { regex: /\bk(h)at\b/gi, replacement: "Khat" },
        { regex: /\broad\b/gi, replacement: "Road" },
        { regex: /\bse(c|t)tor\b/gi, replacement: "Sector" },
        { regex: /\bna(g|r)ar\b/gi, replacement: "Nagar" }
      ];
      corrections.forEach(c => {
        clean = clean.replace(c.regex, c.replacement);
      });
      // Replace double spacing or weird linebreaks
      clean = clean.replace(/\s+/g, " ").replace(/,\s*,/g, ",").trim();
    }
    
    return clean;
  }
};
