/* ================= LOGGED-IN WORKER ================= */
const workerUserStr = localStorage.getItem("workerUser");
const loggedInWorker = workerUserStr ? JSON.parse(workerUserStr) : {
  id: "694a8f11b1f3f309ff6ce034",
  name: "Sunita Patil"
};

console.log("LOGGED IN WORKER:", loggedInWorker);

/* ================= LANGUAGE ================= */
function getSelectedLang() {
  const langSelect = document.getElementById("voiceLang");
  return langSelect ? langSelect.value : "en-IN";
}

/* ================= VOICE OUTPUT ================= */
function speakText(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = getSelectedLang();
  utter.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

/* ================= VOICE INPUT ================= */
function startVoice(fieldId) {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Voice input not supported in this browser");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = getSelectedLang();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const targetInput = document.getElementById(fieldId);
  const originalPlaceholder = targetInput ? targetInput.placeholder : "";

  recognition.onstart = () => {
    if (targetInput) {
      targetInput.placeholder = "🎤 Listening... Speak now";
      targetInput.style.boxShadow = "0 0 10px #ff2d75";
    }
    const lang = getSelectedLang();
    if (lang === "hi-IN") speakText("अब बोलिए");
    else if (lang === "mr-IN") speakText("आता बोला");
    else speakText("Please speak now");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (transcript && targetInput) {
      let cleanText = transcript.trim();
      if (cleanText.endsWith('.')) {
        cleanText = cleanText.slice(0, -1);
      }
      targetInput.value = cleanText;
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  recognition.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    if (event.error === 'no-speech' || event.error === 'aborted') {
      return;
    }
    speakText("Voice not recognized, please try again");
  };

  recognition.onend = () => {
    if (targetInput) {
      targetInput.placeholder = originalPlaceholder;
      targetInput.style.style = "";
      targetInput.style.boxShadow = "";
    }
  };

  recognition.start();
}

/* ================= LOGOUT ================= */
function logout() {
  localStorage.removeItem("workerLoggedIn");
  window.location.href = "login.html";
}

/* ================= SAVE FAMILY ================= */
document.addEventListener("DOMContentLoaded", () => {
  let latitude = 0;
  let longitude = 0;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      console.log("📍 Geolocation captured:", latitude, longitude);
    }, (err) => {
      console.warn("⚠️ Geolocation warning:", err.message);
    });
  }
  // OCR Autofill Handler (Dual Capture/Gallery & Validation Modal)
  const cameraInput = document.getElementById("ocrCameraInput");
  const galleryInput = document.getElementById("ocrGalleryInput");
  const preprocessCanvas = document.getElementById("ocrPreprocessCanvas");
  const validationModal = document.getElementById("ocrValidationModal");
  const ocrStatusText = document.getElementById("ocrStatusText");

  const modalConfirmBtn = document.getElementById("modalConfirmBtn");
  const modalRetakeBtn = document.getElementById("modalRetakeBtn");
  const modalManualBtn = document.getElementById("modalManualBtn");

  // Cache modal inputs
  const mHeadName = document.getElementById("modalHeadName");
  const mAadhaar = document.getElementById("modalAadhaar");
  const mDob = document.getElementById("modalDob");
  const mGender = document.getElementById("modalGender");
  const mAddress = document.getElementById("modalAddress");
  const mPin = document.getElementById("modalPin");

  const badgeName = document.getElementById("nameConfBadge");
  const badgeAadhaar = document.getElementById("aadhaarConfBadge");
  const badgeDob = document.getElementById("dobConfBadge");
  const badgeGender = document.getElementById("genderConfBadge");
  const badgeAddress = document.getElementById("addressConfBadge");
  const badgePin = document.getElementById("pinConfBadge");
  const badgeOverall = document.getElementById("overallAccuracy");

  let parsedAadhaarData = {};

  if (cameraInput) cameraInput.addEventListener("change", (e) => handleOcrFile(e.target.files[0], "camera"));
  if (galleryInput) galleryInput.addEventListener("change", (e) => handleOcrFile(e.target.files[0], "gallery"));

  function handleOcrFile(file, source) {
    if (!file) return;
    
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("⚠️ Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP.");
      speakText("Unsupported file format");
      return;
    }
    
    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      alert("⚠️ File is too large. Please upload an image under 8MB.");
      speakText("File is too large");
      return;
    }

    ocrStatusText.style.display = "block";
    ocrStatusText.innerText = "⚙️ Reading image files...";
    speakText("Reading image file");

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      // Upscale image on preprocessCanvas
      const ctx = preprocessCanvas.getContext('2d');
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      const targetWidth = 1500;
      
      if (width < targetWidth) {
        const scale = targetWidth / width;
        width = targetWidth;
        height = Math.round(height * scale);
      }
      
      preprocessCanvas.width = width;
      preprocessCanvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Quality Guard Check (Phase 8: reject blurry/dark captures)
      const quality = OCRProcessor.checkImageQuality(preprocessCanvas);
      console.log("DEBUG Image Quality stats:", quality);
      
      let docQualityScore = 100;
      if (quality.isBlurry) docQualityScore -= 30;
      if (quality.isLowContrast) docQualityScore -= 20;
      if (quality.isDark) docQualityScore -= 20;
      if (quality.isBright) docQualityScore -= 15;

      if (!quality.passed) {
        let issue = "";
        if (quality.isBlurry) issue = "Image is too blurry. ";
        if (quality.isLowContrast) issue += "Contrast is too low. ";
        if (quality.isDark) issue += "Image is too dark. ";
        if (quality.isBright) issue += "Image is too bright. ";
        
        ocrStatusText.style.display = "none";
        alert(`❌ Quality Check Failed:\n${issue}Please retake the image for better accuracy.`);
        speakText("Please retake image for better accuracy");
        return;
      }

      ocrStatusText.innerText = "⚙️ Analyzing document regions...";
      speakText("Analyzing document regions");

      // Pass 1: Fast Full-Image Landmark OCR
      let fullOcrData;
      try {
        const result = await Tesseract.recognize(preprocessCanvas, 'eng');
        fullOcrData = result.data;
      } catch (err) {
        console.error("Full OCR Pass failed:", err);
        ocrStatusText.style.display = "none";
        alert("❌ OCR processing failed. Please enter details manually.");
        return;
      }

      console.log("DEBUG Full Pass Text:", fullOcrData.text);

      // Document Region Detection (Phase 1)
      const lines = fullOcrData.lines || [];
      let dobLineIndex = -1;
      let aadhaarBbox = null;
      let nameBbox = null;
      let dobBbox = null;
      let addressStartIndex = -1;
      let addressEndIndex = -1;
      
      // Get PIN code first to help segment address
      let pinVal = "";
      for (let i = 0; i < lines.length; i++) {
        const match = (lines[i].text || "").match(/\b\d{6}\b/);
        if (match) {
          pinVal = match[0];
          break;
        }
      }

      for (let i = 0; i < lines.length; i++) {
        const lineText = (lines[i].text || "").toLowerCase();
        
        // Find Aadhaar ID bbox
        const collapsed = lineText.replace(/\s/g, "");
        if (collapsed.match(/[0-9OIlS]{12}/)) {
          aadhaarBbox = lines[i].bbox;
        }
        
        // Find DOB/YOB bbox
        const dobMatch = lineText.match(/\b\d{2}[/\-]\d{2}[/\-]\d{4}\b/);
        const yobMatch = lineText.match(/\b(19|20)\d{2}\b/);
        const isYobLine = yobMatch && (lineText.includes("year") || lineText.includes("जन्म") || lineText.includes("yob") || lineText.includes("dob"));
        if (dobMatch || isYobLine) {
          dobBbox = lines[i].bbox;
          dobLineIndex = i;
        }
        
        // Find Address start
        if (lineText.includes("address") || lineText.includes("पता") || lineText.includes("पत्ता") || 
            lineText.includes("s/o") || lineText.includes("d/o") || lineText.includes("w/o") || lineText.includes("c/o")) {
          if (addressStartIndex === -1) addressStartIndex = i;
        }
      }

      // Detect Name Bounding Box (preceding line above DOB)
      if (dobLineIndex !== -1) {
        const nameBlacklist = [
          "government", "india", "unique", "identification", "authority", "yob", "dob", "birth",
          "gender", "male", "female", "signature", "enrollment", "card", "nha", "uidai", "nha",
          "भारत", "सरकार", "नाव", "नाम", "पिता", "पति", "father", "husband"
        ];
        for (let offset = 1; offset <= 3; offset++) {
          const idx = dobLineIndex - offset;
          if (idx >= 0) {
            let candidate = lines[idx].text || "";
            candidate = candidate.replace(/^(नाव\s*[\/\s]*name|नाम\s*[\/\s]*name|name|नाव|नाम)[:\-\s\=]+/i, "").trim();
            candidate = candidate.replace(/[^a-zA-Z]/g, " ").trim();
            const lowerCand = candidate.toLowerCase();
            const isBlacklisted = nameBlacklist.some(word => lowerCand.includes(word));
            if (candidate.length >= 3 && candidate.length <= 40 && !isBlacklisted) {
              nameBbox = lines[idx].bbox;
              break;
            }
          }
        }
      }

      // Address End Index
      if (addressStartIndex !== -1) {
        for (let i = addressStartIndex; i < lines.length; i++) {
          const lineText = (lines[i].text || "").toLowerCase();
          if (pinVal && lineText.includes(pinVal)) {
            addressEndIndex = i;
            break;
          }
          if (lineText.match(/\d{4}\s\d{4}\s\d{4}/)) {
            addressEndIndex = i - 1;
            break;
          }
        }
        if (addressEndIndex === -1) addressEndIndex = lines.length - 1;
      }

      // Multi-Pass OCR on cropped canvas regions (Phase 2 & 6)
      ocrStatusText.innerText = "⚙️ Executing regional OCR passes...";
      speakText("Executing regional passes");

      let nameResult = { text: "", confidence: 0 };
      let aadhaarResult = { text: "", confidence: 0 };
      let dobResult = { text: "", confidence: 0 };
      let addressResult = { text: "", confidence: 0 };

      // Crop & run name pass
      if (nameBbox) {
        const cropCanvas = document.createElement("canvas");
        OCRProcessor.cropRegion(preprocessCanvas, nameBbox, cropCanvas);
        nameResult = await runMultiPassOcr(cropCanvas, "headName");
      }
      
      // Crop & run Aadhaar pass
      if (aadhaarBbox) {
        const cropCanvas = document.createElement("canvas");
        OCRProcessor.cropRegion(preprocessCanvas, aadhaarBbox, cropCanvas);
        aadhaarResult = await runMultiPassOcr(cropCanvas, "aadhaar");
      }
      
      // Crop & run DOB pass
      if (dobBbox) {
        const cropCanvas = document.createElement("canvas");
        OCRProcessor.cropRegion(preprocessCanvas, dobBbox, cropCanvas);
        dobResult = await runMultiPassOcr(cropCanvas, "dob");
      }
      
      // Crop & run Address pass
      if (addressStartIndex !== -1 && addressEndIndex !== -1) {
        // Merge bounding boxes of all address lines
        let x0 = lines[addressStartIndex].bbox.x0;
        let y0 = lines[addressStartIndex].bbox.y0;
        let x1 = lines[addressStartIndex].bbox.x1;
        let y1 = lines[addressEndIndex].bbox.y1;
        for (let i = addressStartIndex; i <= addressEndIndex; i++) {
          x0 = Math.min(x0, lines[i].bbox.x0);
          x1 = Math.max(x1, lines[i].bbox.x1);
        }
        const addressBbox = { x0, y0, x1, y1 };
        const cropCanvas = document.createElement("canvas");
        OCRProcessor.cropRegion(preprocessCanvas, addressBbox, cropCanvas);
        addressResult = await runMultiPassOcr(cropCanvas, "address");
      }

      // Fallback parsing for fields that failed crop extraction
      const fallbackData = parseAadhaarFallback(fullOcrData);
      
      let finalName = nameResult.text ? OCRProcessor.postProcessCleanup("headName", nameResult.text) : fallbackData.headName;
      let finalAadhaar = aadhaarResult.text ? formatAadhaar(aadhaarResult.text) : fallbackData.aadhaar;
      let finalDob = dobResult.text ? formatDob(dobResult.text) : fallbackData.dob;
      let finalGender = fallbackData.gender; 
      let finalAddress = addressResult.text ? formatAddress(addressResult.text, fallbackData.pin) : fallbackData.address;
      let finalPin = fallbackData.pin;

      if (finalAddress && finalPin) {
        const pinPattern = new RegExp(`[,\\s\\-\\:\\(]*(?:pin|pincode|code)?\\s*\\-?\\s*${finalPin}\\s*\\)?$`, 'i');
        finalAddress = finalAddress.replace(pinPattern, "").trim();
        finalAddress = finalAddress.replace(/[,:\-\s]+$/, "").trim();
      }

      // Calculate Field Accuracy Score & Confidence metrics (Phase 7)
      let confName = nameResult.confidence || 75;
      let confAadhaar = aadhaarResult.confidence || 75;
      let confDob = dobResult.confidence || 75;
      let confGender = finalGender ? 95 : 0;
      let confAddress = addressResult.confidence || 75;
      let confPin = finalPin ? 95 : 0;

      // Accuracy Validation checks
      let accName = finalName.length >= 3 ? 100 : 0;
      let accAadhaar = OCRProcessor.validateVerhoeff(finalAadhaar) ? 100 : (finalAadhaar ? 50 : 0);
      let accDob = finalDob.match(/\d{2}[/\-]\d{2}[/\-]\d{4}/) ? 100 : (finalDob ? 50 : 0);
      let accGender = finalGender ? 100 : 0;
      let accAddress = finalAddress.length >= 10 ? 100 : 0;
      let accPin = finalPin.length === 6 ? 100 : 0;

      const avgAccuracy = Math.round((accName + accAadhaar + accDob + accGender + accAddress + accPin) / 6);

      parsedAadhaarData = {
        headName: finalName,
        aadhaar: finalAadhaar,
        dob: finalDob,
        gender: finalGender,
        address: finalAddress,
        pin: finalPin,
        docQuality: docQualityScore,
        accuracyScore: avgAccuracy,
        confidences: {
          name: confName,
          aadhaar: confAadhaar,
          dob: confDob,
          gender: confGender,
          address: confAddress,
          pin: confPin
        }
      };

      ocrStatusText.style.display = "none";
      speakText("Text recognized and processed");
      openOcrValidationModal();
    };
  }

  // Run Tesseract multi-pass on a cropped canvas region
  async function runMultiPassOcr(cropCanvas, fieldName) {
    const passes = [
      { name: "GrayscaleStretch", filter: (c) => OCRProcessor.applyGrayscaleStretch(c) },
      { name: "Sharpen", filter: (c) => OCRProcessor.applySharpenFilter(c) },
      { name: "OtsuBinarization", filter: (c) => OCRProcessor.applyOtsuBinarization(c) },
      { name: "HighContrastAdaptive", filter: (c) => OCRProcessor.applyHighContrastAdaptive(c) }
    ];

    let bestText = "";
    let bestConfidence = 0;

    for (const pass of passes) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = cropCanvas.width;
      tempCanvas.height = cropCanvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.drawImage(cropCanvas, 0, 0);

      // Apply pass filter
      pass.filter(tempCanvas);

      // Whitelist only digits for Aadhaar ID pass to ensure correctness
      const options = {};
      if (fieldName === "aadhaar") {
        options.tessedit_char_whitelist = "0123456789 ";
      }

      try {
        const { data } = await Tesseract.recognize(tempCanvas, 'eng', options);
        console.log(`DEBUG Cropped OCR [${fieldName}] Pass [${pass.name}] Text:`, data.text.trim(), "Conf:", data.confidence);
        
        let score = data.confidence;
        if (fieldName === "aadhaar") {
          const cleanId = data.text.replace(/\D/g, "");
          if (cleanId.length === 12 && OCRProcessor.validateVerhoeff(cleanId)) {
            score += 30; // Boost confidence for mathematically valid Aadhaar
          }
        }
        
        if (score > bestConfidence) {
          bestConfidence = score;
          bestText = data.text;
        }
      } catch (err) {
        console.error(`Pass ${pass.name} failed for ${fieldName}:`, err);
      }
    }

    return { text: bestText.trim(), confidence: Math.min(100, bestConfidence) };
  }

  function formatAadhaar(rawId) {
    let cleaned = rawId.toUpperCase()
      .replace(/\s/g, "")
      .replace(/O/g, "0")
      .replace(/[Il]/g, "1")
      .replace(/S/g, "5");
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length === 12) {
      return `${digits.substring(0, 4)} ${digits.substring(4, 8)} ${digits.substring(8, 12)}`;
    }
    return rawId.trim();
  }

  function formatDob(rawDob) {
    const dobMatch = rawDob.match(/\b\d{2}[/\-]\d{2}[/\-]\d{4}\b/);
    if (dobMatch) return dobMatch[0];
    const yobMatch = rawDob.match(/\b(19|20)\d{2}\b/);
    if (yobMatch) return `01/01/${yobMatch[0]}`;
    return rawDob.trim();
  }

  function formatAddress(rawAddress, pin) {
    let clean = rawAddress.replace(/^(address|पता|पत्ता)[:\-\s\=]+/i, "").trim();
    clean = OCRProcessor.postProcessCleanup("address", clean);
    return clean;
  }

  // Fallback Aadhaar parsing using standard full image Tesseract tree structure
  function parseAadhaarFallback(tesseractData) {
    const text = tesseractData.text || "";
    const lines = tesseractData.lines || [];
    
    let headName = "";
    let aadhaar = "";
    let dob = "";
    let gender = "";
    let address = "";
    let pin = "";

    // 1. Identify Aadhaar ID
    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i].text || "";
      const collapsed = rawLine.replace(/\s/g, "");
      const match = collapsed.match(/[0-9OIlS]{12}/);
      if (match) {
        let cleaned = match[0].toUpperCase()
          .replace(/O/g, "0")
          .replace(/[Il]/g, "1")
          .replace(/S/g, "5");
          
        if (cleaned.length === 12) {
          const isValid = OCRProcessor.validateVerhoeff(cleaned);
          if (isValid || !aadhaar) {
            aadhaar = `${cleaned.substring(0, 4)} ${cleaned.substring(4, 8)} ${cleaned.substring(8, 12)}`;
            if (isValid) break;
          }
        }
      }
    }

    // 2. Identify DOB/YOB
    let dobLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const lineText = (lines[i].text || "").toLowerCase();
      const dobMatch = lineText.match(/\b\d{2}[/\-]\d{2}[/\-]\d{4}\b/);
      if (dobMatch) {
        dob = dobMatch[0];
        dobLineIndex = i;
        break;
      }
      const yobMatch = lineText.match(/\b(19|20)\d{2}\b/);
      if (yobMatch && (lineText.includes("year") || lineText.includes("जन्म") || lineText.includes("yob") || lineText.includes("dob"))) {
        dob = `01/01/${yobMatch[0]}`;
        dobLineIndex = i;
        break;
      }
    }

    // 3. Identify Gender
    for (let i = 0; i < lines.length; i++) {
      const lineText = (lines[i].text || "").toLowerCase();
      if (lineText.includes("female") || lineText.includes("महिला") || lineText.includes("स्त्री")) {
        gender = "Female";
        break;
      } else if (lineText.includes("male") || lineText.includes("पुरुष")) {
        gender = "Male";
        break;
      }
    }

    // 4. Name Extraction Engine (Anchor above DOB)
    const nameBlacklist = [
      "government", "india", "unique", "identification", "authority", "yob", "dob", "birth",
      "gender", "male", "female", "signature", "enrollment", "card", "nha", "uidai", "nha",
      "भारत", "सरकार", "नाव", "नाम", "पिता", "पति", "father", "husband"
    ];
    
    if (dobLineIndex !== -1) {
      for (let offset = 1; offset <= 3; offset++) {
        const idx = dobLineIndex - offset;
        if (idx >= 0) {
          let candidate = lines[idx].text || "";
          candidate = candidate.replace(/^(नाव\s*[\/\s]*name|नाम\s*[\/\s]*name|name|नाव|नाम)[:\-\s\=]+/i, "").trim();
          candidate = candidate.replace(/[^a-zA-Z]/g, " ").trim();
          const lowerCand = candidate.toLowerCase();
          const isBlacklisted = nameBlacklist.some(word => lowerCand.includes(word));
          if (candidate.length >= 3 && candidate.length <= 40 && !isBlacklisted) {
            headName = OCRProcessor.postProcessCleanup("headName", candidate);
            break;
          }
        }
      }
    }
    
    if (!headName) {
      for (let i = 0; i < lines.length; i++) {
        let candidate = lines[i].text || "";
        candidate = candidate.replace(/^(नाव\s*[\/\s]*name|नाम\s*[\/\s]*name|name|नाव|नाम)[:\-\s\=]+/i, "").trim();
        candidate = candidate.replace(/[^a-zA-Z]/g, " ").trim();
        const lowerCand = candidate.toLowerCase();
        const isBlacklisted = nameBlacklist.some(word => lowerCand.includes(word));
        if (!isBlacklisted && /^[a-zA-Z]{3,}\s+[a-zA-Z]{2,}/.test(candidate.trim())) {
          headName = OCRProcessor.postProcessCleanup("headName", candidate);
          break;
        }
      }
    }

    // 5. PIN Code Parsing
    for (let i = 0; i < lines.length; i++) {
      const match = (lines[i].text || "").match(/\b\d{6}\b/);
      if (match) {
        pin = match[0];
        break;
      }
    }

    // 6. Address Block Parsing
    let addressStartIndex = -1;
    let addressEndIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const lineText = (lines[i].text || "").toLowerCase();
      if (lineText.includes("address") || lineText.includes("पता") || lineText.includes("पत्ता") || 
          lineText.includes("s/o") || lineText.includes("d/o") || lineText.includes("w/o") || lineText.includes("c/o")) {
        addressStartIndex = i;
        break;
      }
    }

    if (addressStartIndex !== -1) {
      for (let i = addressStartIndex; i < lines.length; i++) {
        const lineText = (lines[i].text || "").toLowerCase();
        if (pin && lineText.includes(pin)) {
          addressEndIndex = i;
          break;
        }
        if (lineText.match(/\d{4}\s\d{4}\s\d{4}/)) {
          addressEndIndex = i - 1;
          break;
        }
      }
      if (addressEndIndex === -1) addressEndIndex = lines.length - 1;

      let addressLines = [];
      for (let i = addressStartIndex; i <= addressEndIndex; i++) {
        let lineText = lines[i].text || "";
        lineText = lineText.replace(/^(address|पता|पत्ता|s\/o|d\/o|w\/o|c\/o)[:\-\s\=]+/i, "").trim();
        if (lineText) addressLines.push(lineText);
      }
      address = addressLines.join(", ");
      address = OCRProcessor.postProcessCleanup("address", address);
    } else {
      let pinLineIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].text && lines[i].text.includes(pin) && pin.length === 6) {
          pinLineIndex = i;
          break;
        }
      }
      if (pinLineIndex !== -1) {
        let addressLines = [];
        for (let i = Math.max(0, pinLineIndex - 3); i < pinLineIndex; i++) {
          const lineText = lines[i].text || "";
          const lowerText = lineText.toLowerCase();
          const isTrash = lowerText.includes("government") || lowerText.includes("india") || lowerText.includes("uidai") || lowerText.includes("phone");
          if (!isTrash && lineText.trim().length > 3) {
            addressLines.push(lineText.trim());
          }
        }
        address = addressLines.join(", ");
        address = OCRProcessor.postProcessCleanup("address", address);
      }
    }

    return { headName, aadhaar, dob, gender, address, pin };
  }

  function openOcrValidationModal() {
    mHeadName.value = parsedAadhaarData.headName;
    mAadhaar.value = parsedAadhaarData.aadhaar;
    mDob.value = parsedAadhaarData.dob;
    mGender.value = parsedAadhaarData.gender;
    mAddress.value = parsedAadhaarData.address;
    mPin.value = parsedAadhaarData.pin;

    // Display Quality metrics in UI grid
    const modalDocQuality = document.getElementById("modalDocQuality");
    const modalAccuracyScore = document.getElementById("modalAccuracyScore");
    const modalOcrConfidence = document.getElementById("modalOcrConfidence");
    
    if (modalDocQuality) modalDocQuality.innerText = `${parsedAadhaarData.docQuality}%`;
    if (modalAccuracyScore) modalAccuracyScore.innerText = `${parsedAadhaarData.accuracyScore}%`;

    const setBadge = (element, score) => {
      if (!score) {
        element.innerText = "🔴 Low (0%)";
        element.style.background = "#ffd6eb";
        element.style.color = "#ff1675";
      } else if (score >= 90) {
        element.innerText = `🟢 High (${score}%)`;
        element.style.background = "#e6f9f3";
        element.style.color = "#2cd5c4";
      } else if (score >= 70) {
        element.innerText = `🟡 Medium (${score}%)`;
        element.style.background = "#fff9e6";
        element.style.color = "#ffcc00";
      } else {
        element.innerText = `🔴 Low (${score}%)`;
        element.style.background = "#ffd6eb";
        element.style.color = "#ff1675";
      }
    };

    setBadge(badgeName, parsedAadhaarData.confidences.name);
    setBadge(badgeAadhaar, parsedAadhaarData.confidences.aadhaar);
    setBadge(badgeDob, parsedAadhaarData.confidences.dob);
    setBadge(badgeGender, parsedAadhaarData.confidences.gender);
    setBadge(badgeAddress, parsedAadhaarData.confidences.address);
    setBadge(badgePin, parsedAadhaarData.confidences.pin);

    const confs = parsedAadhaarData.confidences;
    const overallConfidence = Math.round((confs.name + confs.aadhaar + confs.dob + confs.gender + confs.address + confs.pin) / 6);
    if (modalOcrConfidence) modalOcrConfidence.innerText = `${overallConfidence}%`;

    badgeOverall.innerText = `Accuracy: ${parsedAadhaarData.accuracyScore}%`;

    validationModal.style.display = "flex";
    speakText("Please review extracted details");
  }

  const highlightField = (element) => {
    if (!element) return;
    element.style.transition = "all 0.5s ease";
    element.style.boxShadow = "0 0 10px #ff1675";
    element.style.border = "2px dashed #ff1675";
    setTimeout(() => {
      element.style.boxShadow = "";
      element.style.border = "";
    }, 5000);
  };

  if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener("click", () => {
      validationModal.style.display = "none";

      const finalName = mHeadName.value.trim();
      const finalAadhaar = mAadhaar.value.trim();
      const finalDob = mDob.value.trim();
      const finalGender = mGender.value;
      const finalAddress = mAddress.value.trim();
      const finalPin = mPin.value.trim();

      const fHeadName = document.getElementById("headName");
      const fAddress = document.getElementById("address");
      const fAbhaInput = document.getElementById("abhaVerifyInput");
      const fAbhaMethod = document.getElementById("abhaVerifyMethod");
      const fNotes = document.getElementById("notes");

      if (fHeadName) {
        fHeadName.value = finalName;
        highlightField(fHeadName);
      }

      if (fAddress) {
        fAddress.value = finalAddress + (finalPin ? `, PIN: ${finalPin}` : "");
        highlightField(fAddress);
      }

      if (fAbhaInput) {
        fAbhaInput.value = finalAadhaar.replace(/\s/g, "");
        highlightField(fAbhaInput);
      }

      if (fAbhaMethod) {
        fAbhaMethod.value = "aadhaar";
        highlightField(fAbhaMethod);
      }

      if (fNotes) {
        fNotes.value = `🛡️ Verified Aadhaar Details:\n- ID: ${finalAadhaar}\n- DOB: ${finalDob}\n- Gender: ${finalGender}\n\n` + fNotes.value;
        highlightField(fNotes);
      }

      speakText("Autofill complete");
      alert("✅ Fields auto-filled successfully!");
    });
  }

  if (modalRetakeBtn) {
    modalRetakeBtn.addEventListener("click", () => {
      validationModal.style.display = "none";
      cameraInput.value = "";
      galleryInput.value = "";
      cameraInput.click();
    });
  }

  if (modalManualBtn) {
    modalManualBtn.addEventListener("click", () => {
      validationModal.style.display = "none";
      speakText("Please enter details manually");
    });
  }

  // Voice Assistant Handler (Enhanced with continuous listening, manual toggle, real-time transcript feedback, and silence auto-stop)
  const voiceAssistantBtn = document.getElementById("voiceAssistantBtn");
  const voiceAssistantStatus = document.getElementById("voiceAssistantStatus");
  let activeSpeechRecognition = null;

  if (voiceAssistantBtn) {
    voiceAssistantBtn.addEventListener("click", () => {
      if (activeSpeechRecognition) {
        // Toggle action: if already listening, stop it
        console.log("Voice Assistant: Stop requested by user.");
        activeSpeechRecognition.stop();
        return;
      }

      if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
        alert("Voice recognition is not supported in this browser.");
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = getSelectedLang();
      recognition.continuous = true;
      recognition.interimResults = true;
      activeSpeechRecognition = recognition;

      let finalTranscript = "";
      let silenceTimer = null;

      const resetSilenceTimer = () => {
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          console.log("Voice Assistant: Inactivity timeout (3s). Stopping recognition.");
          recognition.stop();
        }, 3000); // Stop automatically after 3 seconds of silence
      };

      recognition.onstart = () => {
        voiceAssistantStatus.style.display = "block";
        voiceAssistantStatus.innerHTML = `🎤 <strong>Listening...</strong> speak now (e.g. 'Name Ramesh Patil, contact 9876543210, address Pune Deccan')`;
        voiceAssistantBtn.innerText = "🛑 Stop & Fill Form";
        voiceAssistantBtn.style.background = "#dc3545"; // Red stop style
        voiceAssistantBtn.style.color = "white";
        resetSilenceTimer();
      };

      recognition.onresult = (event) => {
        resetSilenceTimer();
        let interimTranscript = "";
        let newFinalText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinalText += event.results[i][0].transcript + " ";
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        finalTranscript += newFinalText;
        
        const currentText = (finalTranscript + interimTranscript).trim();
        if (currentText) {
          voiceAssistantStatus.innerHTML = `🎤 <strong>Listening:</strong> <span style="color: #ffcc00; font-style: italic;">"${currentText}"</span>`;
        }
      };

      recognition.onerror = (event) => {
        console.error("Voice Assistant error:", event.error);
        if (event.error !== "no-speech") {
          alert(`❌ Voice recognition error: ${event.error}`);
          speakText("Voice recognition error, please try again");
        }
      };

      recognition.onend = () => {
        if (silenceTimer) clearTimeout(silenceTimer);
        activeSpeechRecognition = null;
        voiceAssistantBtn.innerText = "🎤 Dictate Whole Form";
        voiceAssistantBtn.style.background = "#2c7be5"; // Reset blue style
        voiceAssistantBtn.style.color = "";
        voiceAssistantStatus.style.display = "none";

        const textToParse = finalTranscript.trim();
        if (!textToParse) {
          alert("⚠️ No speech detected. Please speak clearly.");
          speakText("No speech detected, please try again");
          return;
        }

        console.log("Voice Assistant final transcript parsing:", textToParse);
        const parsed = parseVoiceInput(textToParse);
        let filledFields = [];

        if (parsed.name) {
          const isEnglish = /^[a-zA-Z\s]+$/.test(parsed.name);
          const formattedName = isEnglish 
            ? parsed.name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
            : parsed.name;
          document.getElementById("headName").value = formattedName;
          filledFields.push(`Name: ${formattedName}`);
          
          // Trigger input highlight visual feedback
          const inputEl = document.getElementById("headName");
          inputEl.style.transition = "background-color 0.5s ease";
          inputEl.style.backgroundColor = "rgba(44, 123, 229, 0.2)";
          setTimeout(() => inputEl.style.backgroundColor = "", 1500);
        }
        if (parsed.contact) {
          document.getElementById("contact").value = parsed.contact;
          filledFields.push(`Contact: ${parsed.contact}`);
          
          // Trigger input highlight visual feedback
          const inputEl = document.getElementById("contact");
          inputEl.style.transition = "background-color 0.5s ease";
          inputEl.style.backgroundColor = "rgba(44, 123, 229, 0.2)";
          setTimeout(() => inputEl.style.backgroundColor = "", 1500);
        }
        if (parsed.address) {
          document.getElementById("address").value = parsed.address;
          filledFields.push(`Address: ${parsed.address}`);
          
          // Trigger input highlight visual feedback
          const inputEl = document.getElementById("address");
          inputEl.style.transition = "background-color 0.5s ease";
          inputEl.style.backgroundColor = "rgba(44, 123, 229, 0.2)";
          setTimeout(() => inputEl.style.backgroundColor = "", 1500);
        }

        if (filledFields.length > 0) {
          const successMsg = `🎙️ Voice parsing complete!\nFilled:\n- ${filledFields.join('\n- ')}`;
          alert(successMsg);
          speakText("Form fields parsed and filled successfully");
        } else {
          alert("⚠️ Voice parser could not extract fields automatically. Please speak name, contact, or address clearly.");
          speakText("Could not extract fields. Please try again.");
        }
      };

      recognition.start();
    });
  }

  // Parse voice text using simple keyword/regex segmentation and smart fallback heuristics
  function parseVoiceInput(text) {
    text = text.trim();
    const result = {
      name: "",
      contact: "",
      address: ""
    };

    // 1. Extract 10-digit phone number
    const phoneMatch = text.match(/[6-9]\d{9}/);
    if (phoneMatch) {
      result.contact = phoneMatch[0];
    } else {
      const anyPhone = text.replace(/\s+/g, '').match(/\d{10}/);
      if (anyPhone) {
        result.contact = anyPhone[0];
      }
    }

    // 2. Keyword-based extraction
    const nameKeywords = ["name", "head name", "नाम", "नाव", "नाम है", "नाव आहे"];
    const contactKeywords = ["contact", "phone", "mobile", "संपर्क", "मोबाइल", "फोन", "नंबर", "क्रमांक"];
    const addressKeywords = ["address", "पता", "पत्ता", "रहने वाला", "राहणार"];

    const allKeywords = [
      { type: "name", words: nameKeywords },
      { type: "contact", words: contactKeywords },
      { type: "address", words: addressKeywords }
    ];

    const occurrences = [];
    allKeywords.forEach(kw => {
      kw.words.forEach(word => {
        let index = text.toLowerCase().indexOf(word.toLowerCase());
        while (index !== -1) {
          occurrences.push({
            type: kw.type,
            word: word,
            index: index,
            length: word.length
          });
          index = text.toLowerCase().indexOf(word.toLowerCase(), index + 1);
        }
      });
    });

    // Sort by starting index
    occurrences.sort((a, b) => a.index - b.index);

    // Filter overlapping/nested keywords
    const filtered = [];
    let lastEnd = -1;
    occurrences.forEach(occ => {
      if (occ.index >= lastEnd) {
        filtered.push(occ);
        lastEnd = occ.index + occ.length;
      }
    });

    // Extract segments based on keywords
    filtered.forEach((occ, idx) => {
      const start = occ.index + occ.length;
      const end = (idx + 1 < filtered.length) ? filtered[idx + 1].index : text.length;
      let content = text.substring(start, end).trim();
      content = content.replace(/^[:\-\s,=]+/, "").replace(/[:\-\s,=]+$/, "").trim();

      if (occ.type === "name") {
        result.name = content;
      } else if (occ.type === "address") {
        result.address = content;
      } else if (occ.type === "contact" && !result.contact) {
        const cleaned = content.replace(/\D/g, "");
        if (cleaned.length >= 10) {
          result.contact = cleaned.substring(0, 10);
        }
      }
    });

    // 3. Smart Heuristic Fallback if name or address is missing
    if (!result.name || !result.address) {
      // Remove phone number from text to avoid mixing it into name or address
      let cleanText = text;
      if (result.contact) {
        // Find raw contact occurrence in text (with potential spaces)
        const phoneRegex = new RegExp(result.contact.split('').join('\\s*'), 'g');
        cleanText = text.replace(phoneRegex, '').replace(/\s+/g, ' ').trim();
      }

      // If we don't have a name:
      if (!result.name) {
        let namePart = cleanText;
        const nameIntroRegex = /^(my\s+name\s+is|i\s+am|myself|मेरा\s+नाम|माझे\s+नाव|नाव)\s+/i;
        if (nameIntroRegex.test(namePart)) {
          namePart = namePart.replace(nameIntroRegex, "");
        }
        
        const words = namePart.split(/\s+/).filter(w => w.length > 0);
        if (words.length > 0) {
          let nameLimit = 2;
          if (words.length >= 3) {
            // Find if there is a known address word or if a word is followed by an address word
            const commonAddressWords = ["lane", "road", "pune", "mumbai", "delhi", "noida", "street", "nagar", "gali", "sector", "building", "flat", "hno", "house", "near", "opposite", "at", "post", "dist", "taluka", "colony", "society"];
            let addressStartIndex = -1;
            for (let i = 0; i < words.length; i++) {
              const wordLower = words[i].toLowerCase();
              // Check if this word itself is a known address indicator
              if (commonAddressWords.includes(wordLower)) {
                addressStartIndex = i;
                break;
              }
              // Check if the next word is a compound address indicator (e.g. "Ganesh Nagar" -> split before "Ganesh")
              if (i + 1 < words.length) {
                const nextWordLower = words[i + 1].toLowerCase();
                if (["lane", "road", "street", "nagar", "gali", "sector", "building", "flat", "colony", "society"].includes(nextWordLower)) {
                  addressStartIndex = i;
                  break;
                }
              }
            }

            if (addressStartIndex !== -1) {
              nameLimit = Math.max(1, addressStartIndex);
            } else {
              nameLimit = 3;
            }
          }
          result.name = words.slice(0, nameLimit).join(" ");
          
          // Remaining words become address if address is missing
          if (!result.address && words.length > nameLimit) {
            result.address = words.slice(nameLimit).join(" ");
          }
        }
      } else if (!result.address) {
        // If we have a name, but no address, strip the name from cleanText to find the address
        let nameRegexEscaped = result.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        let remaining = cleanText.replace(new RegExp(nameRegexEscaped, 'gi'), '').trim();
        remaining = remaining.replace(/^[:\-\s,=]+/, "").trim();
        if (remaining) {
          result.address = remaining;
        }
      }
    }

    // Clean up auxiliary words in name and address
    if (result.name) {
      result.name = result.name.replace(/^(is|has|was|am|है|आहे|तो|ती)[:\-\s,=]+/i, "").trim();
      const nameWords = result.name.split(/\s+/);
      if (nameWords.length > 2) {
        const lastWord = nameWords[nameWords.length - 1].toLowerCase();
        if (["pune", "mumbai", "noida", "delhi", "lane", "road", "nagar", "gali"].includes(lastWord)) {
          nameWords.pop();
          result.name = nameWords.join(" ");
        }
      }
    }
    if (result.address) {
      result.address = result.address.replace(/^(is|has|was|am|है|आहे|तो|ती)[:\-\s,=]+/i, "").trim();
    }

    return result;
  }


  // Family Members Management & Vaccine Scheduler
  const familyMembers = [];
  const addMemberBtn = document.getElementById("addMemberBtn");
  const membersList = document.getElementById("membersList");
  const noMembersText = document.getElementById("noMembersText");

  if (addMemberBtn) {
    addMemberBtn.addEventListener("click", () => {
      const name = document.getElementById("memberName").value.trim();
      const ageStr = document.getElementById("memberAge").value.trim();
      const gender = document.getElementById("memberGender").value;
      const relation = document.getElementById("memberRelation").value;

      if (!name || !ageStr || !gender || !relation) {
        alert("Please fill all member fields.");
        return;
      }

      const age = parseInt(ageStr, 10);
      if (isNaN(age) || age < 0 || age > 120) {
        alert("Please enter a valid age.");
        return;
      }

      // Automatically generate vaccinations due schedule based on standard rules
      const vaccinations = [];
      const today = new Date();
      if (age <= 1) {
        vaccinations.push({ name: "Polio Booster (OPV)", dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), status: "Pending" });
        vaccinations.push({ name: "Measles-Rubella (MR) 1st Dose", dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), status: "Pending" });
      } else if (age <= 5) {
        vaccinations.push({ name: "DPT Booster-1", dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), status: "Pending" });
      } else if (age > 15 && gender === "Female" && relation === "Spouse") {
        vaccinations.push({ name: "Tetanus Toxoid (TT-1)", dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), status: "Pending" });
      }

      const member = { name, age, gender, relation, vaccinations };
      familyMembers.push(member);

      renderMemberChips();

      // Clear member input fields
      document.getElementById("memberName").value = "";
      document.getElementById("memberAge").value = "";
      document.getElementById("memberGender").value = "";
      document.getElementById("memberRelation").value = "";
    });
  }

  function renderMemberChips() {
    if (familyMembers.length === 0) {
      noMembersText.style.display = "block";
    } else {
      noMembersText.style.display = "none";
    }
    
    const chips = membersList.querySelectorAll(".member-chip");
    chips.forEach(chip => chip.remove());

    familyMembers.forEach((m, idx) => {
      const chip = document.createElement("span");
      chip.className = "member-chip";
      chip.style.cssText = "background: #ff1675; color: white; padding: 4px 10px; border-radius: 15px; font-size: 12px; display: inline-flex; align-items: center; gap: 5px; font-weight: bold; margin-bottom: 5px;";
      chip.innerHTML = `${m.name} (${m.relation}) <span style="cursor:pointer; font-weight:bold; font-size:14px; margin-left:3px;" onclick="removeMember(${idx})">×</span>`;
      membersList.appendChild(chip);
    });
  }

  window.removeMember = (idx) => {
    familyMembers.splice(idx, 1);
    renderMemberChips();
  };

  // Stepper controls
  const nextBtn = document.getElementById("nextStepBtn");
  const prevBtn = document.getElementById("prevStepBtn");
  const step1 = document.getElementById("step1Fields");
  const step2 = document.getElementById("step2Fields");
  const step1Ind = document.getElementById("step1Indicator");
  const step2Ind = document.getElementById("step2Indicator");

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const headName = document.getElementById("headName").value.trim();
      const contact = document.getElementById("contact").value.trim();

      if (!headName || !contact) {
        alert("Please fill all required fields in Step 1.");
        return;
      }

      const namePattern = /^[a-zA-Z\s]{3,50}$/;
      if (!namePattern.test(headName)) {
        alert("Family head name must contain only alphabets and spaces, and be 3 to 50 characters.");
        return;
      }

      const phonePattern = /^[6-9]\d{9}$/;
      if (!phonePattern.test(contact)) {
        alert("Please enter a valid 10-digit mobile number starting with 6-9.");
        return;
      }

      step1.style.display = "none";
      step2.style.display = "block";
      step1Ind.style.borderBottomColor = "rgba(255,255,255,0.2)";
      step1Ind.style.color = "rgba(255,255,255,0.6)";
      step2Ind.style.borderBottomColor = "#ff1675";
      step2Ind.style.color = "#ff1675";
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      step1.style.display = "block";
      step2.style.display = "none";
      step1Ind.style.borderBottomColor = "#ff1675";
      step1Ind.style.color = "#ff1675";
      step2Ind.style.borderBottomColor = "rgba(255,255,255,0.2)";
      step2Ind.style.color = "rgba(255,255,255,0.6)";
    });
  }

  // Save Draft
  const draftBtn = document.getElementById("saveDraftBtn");
  if (draftBtn) {
    draftBtn.addEventListener("click", () => {
      const family = {
        headName: document.getElementById("headName").value.trim(),
        address: document.getElementById("address").value.trim(),
        contact: document.getElementById("contact").value.trim(),
        notes: document.getElementById("notes").value.trim() + " (Draft)",
        abhaId: document.getElementById("abhaId") ? document.getElementById("abhaId").value : "",
        abhaAddress: document.getElementById("abhaAddress") ? document.getElementById("abhaAddress").value : "",
        latitude: latitude,
        longitude: longitude,
        addedByWorkerId: loggedInWorker.id,
        addedByWorkerName: loggedInWorker.name,
        members: familyMembers,
        synced: false,
        createdAt: new Date()
      };

      if (!family.headName || !family.address || !family.contact) {
        alert("Please fill all required fields before saving draft.");
        return;
      }

      saveOfflineFamily(family);
      alert("💾 Draft saved successfully in offline storage!");
      window.location.href = "families.html";
    });
  }

  // Register Family (Submit)
  const saveBtn = document.getElementById("saveFamilyBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const family = {
        headName: document.getElementById("headName").value.trim(),
        address: document.getElementById("address").value.trim(),
        contact: document.getElementById("contact").value.trim(),
        notes: document.getElementById("notes").value.trim(),
        abhaId: document.getElementById("abhaId") ? document.getElementById("abhaId").value : "",
        abhaAddress: document.getElementById("abhaAddress") ? document.getElementById("abhaAddress").value : "",
        latitude: latitude,
        longitude: longitude,
        addedByWorkerId: loggedInWorker.id,
        addedByWorkerName: loggedInWorker.name,
        members: familyMembers,
        synced: false,
        createdAt: new Date()
      };

      if (!family.headName || !family.address || !family.contact) {
        alert("Please fill all required fields.");
        return;
      }

      const namePattern = /^[a-zA-Z\s]{3,50}$/;
      if (!namePattern.test(family.headName)) {
        alert("Family head name must contain only alphabets and spaces, and be 3 to 50 characters.");
        return;
      }

      const phonePattern = /^[6-9]\d{9}$/;
      if (!phonePattern.test(family.contact)) {
        alert("Please enter a valid 10-digit mobile number starting with 6-9.");
        return;
      }

      /* SAVE OFFLINE FIRST, THEN SYNC ONLINE */
      saveOfflineFamily(family)
        .then(insertedId => {
          const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
          fetch(`${base}/api/family/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(family)
          })
          .then(res => {
            if (!res.ok) throw new Error("Server error");
            return res.json();
          })
          .then(data => {
            console.log("Saved to MongoDB, removing from IndexedDB:", data);
            deleteOfflineFamily(insertedId).then(() => {
              showSuccessAndRedirect("Family Synced Successfully!");
            });
          })
          .catch(err => {
            console.warn("Offline, will sync later", err);
            showSuccessAndRedirect("Family Saved Offline (Pending Sync)!");
          });
        })
        .catch(err => {
          console.error("IndexedDB save failed:", err);
          alert("Error saving family locally!");
        });

      function showSuccessAndRedirect(msg) {
        const lang = getSelectedLang();
        if (lang === "hi-IN") speakText("परिवार की जानकारी सफलतापूर्वक सहेजी गई");
        else if (lang === "mr-IN") speakText("कुटुंबाची माहिती यशस्वीरित्या जतन झाली");
        else speakText(msg);

        alert(msg);
        window.location.href = "families.html";
      }
    });
  }

  // ABDM ABHA Verification Listeners
  const abhaVerifyMethod = document.getElementById("abhaVerifyMethod");
  const abhaVerifyInput = document.getElementById("abhaVerifyInput");
  const abhaSendOtpBtn = document.getElementById("abhaSendOtpBtn");
  const abhaOtpSection = document.getElementById("abhaOtpSection");
  const abhaOtpInput = document.getElementById("abhaOtpInput");
  const abhaVerifyOtpBtn = document.getElementById("abhaVerifyOtpBtn");
  const abhaStatusText = document.getElementById("abhaStatusText");
  const abhaIdInput = document.getElementById("abhaId");
  const abhaAddressInput = document.getElementById("abhaAddress");

  let abhaTransactionId = "";

  if (abhaSendOtpBtn) {
    abhaSendOtpBtn.addEventListener("click", () => {
      const val = abhaVerifyInput.value.trim();
      if (!val) {
        alert("Please enter Aadhaar or Mobile Number first.");
        return;
      }

      // Check offline status
      if (!navigator.onLine) {
        abhaStatusText.style.display = "block";
        abhaStatusText.style.color = "#ffcc00";
        abhaStatusText.innerText = "📶 Offline Mode: Verification queued. Will link pending ABHA on next online sync.";
        
        abhaIdInput.value = "PENDING_VERIFICATION";
        abhaAddressInput.value = "pending@abdm";
        speakText("Device offline, verification queued for later");
        return;
      }

      const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
      // Online: call OTP generation endpoint
      fetch(`${base}/api/abdm/generate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: abhaVerifyMethod.value, value: val })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          abhaTransactionId = data.transactionId;
          abhaOtpSection.style.display = "block";
          abhaStatusText.style.display = "block";
          abhaStatusText.style.color = "#ffcc00";
          abhaStatusText.innerText = `💬 OTP sent successfully. (Try: ${data.mockOtp})`;
          speakText("OTP sent, please enter standard security code");
        } else {
          alert("❌ Error sending OTP: " + data.message);
        }
      })
      .catch(err => {
        console.error("ABDM OTP error", err);
        alert("❌ Failed to reach ABDM API. Saving as offline pending verification.");
        abhaStatusText.style.display = "block";
        abhaStatusText.style.color = "#ffcc00";
        abhaStatusText.innerText = "📶 API Connection Timeout: Saved as pending.";
        abhaIdInput.value = "PENDING_VERIFICATION";
        abhaAddressInput.value = "pending@abdm";
      });
    });
  }

  if (abhaVerifyOtpBtn) {
    abhaVerifyOtpBtn.addEventListener("click", () => {
      const otp = abhaOtpInput.value.trim();
      if (!otp) {
        alert("Please enter the 6-digit OTP.");
        return;
      }

      const headName = document.getElementById("headName").value.trim();

      const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
      fetch(`${base}/api/abdm/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: abhaTransactionId,
          otp: otp,
          name: headName || "Head of Family"
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          abhaIdInput.value = data.abhaId;
          abhaAddressInput.value = data.abhaAddress;
          abhaStatusText.style.display = "block";
          abhaStatusText.style.color = "#2cd5c4";
          abhaStatusText.innerText = `✅ ABHA Verified!\nID: ${data.abhaId}\nAddress: ${data.abhaAddress}`;
          abhaOtpSection.style.display = "none";
          speakText("Verification successful");
        } else {
          alert("❌ " + data.message);
        }
      })
      .catch(err => {
        console.error("ABDM OTP verification error", err);
        alert("❌ Error verifying OTP. Please try again.");
      });
    });
  }
});
