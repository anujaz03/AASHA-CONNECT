// ---------------- LOGIN ----------------
function logout() {
    localStorage.removeItem("workerLoggedIn");
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("workerLoginForm");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            localStorage.setItem("workerLoggedIn", "yes");
            window.location.href = "dashboard.html";
        });
    }
});

// ---------------- ADD FAMILY (Aadhaar Autofill) ----------------
function fetchAadhaarMock() {
    fetch("../aadhar-mock.json") 
        .then(res => res.json())
        .then(data => {
            const aadhaar = document.getElementById("aadhaar").value;
            if (data[aadhaar]) {
                alert("Aadhaar data autofilled!");
                document.getElementById("familyName").value = data[aadhaar].name;
                document.getElementById("address").value = data[aadhaar].address;
            } else {
                alert("Aadhaar number not found");
            }
        });
}






// ---------------- SAVE FAMILY OFFLINE ----------------
const familyForm = document.getElementById("addFamilyForm");
if (familyForm) {
    familyForm.addEventListener("submit", (e) => {
        e.preventDefault(); //prevent krta hai default behaviour ko html ke

        const family = {
            id: Date.now(),
            name: document.getElementById("familyName").value,
            members: document.getElementById("members").value,
            address: document.getElementById("address").value
        };

        let savedFamilies = JSON.parse(localStorage.getItem("families") || "[]");
        savedFamilies.push(family);
        localStorage.setItem("families", JSON.stringify(savedFamilies));

        alert("Family saved offline!");
        window.location.href = "families.html";
    });
}

// ---------------- LOAD FAMILIES ----------------
if (document.getElementById("familyList")) {
    let all = JSON.parse(localStorage.getItem("families") || "[]");
    let box = document.getElementById("familyList");

    if (all.length === 0) {
        box.innerHTML = "<p>No families added yet.</p>";
    }

    all.forEach(f => {
        box.innerHTML += `
        <div class="family-item">
            <h3>${f.name}</h3>
            <p><strong>Members:</strong> ${f.members}</p>
            <p><strong>Address:</strong> ${f.address}</p>
        </div>`;
    });
}

// ---------------- QR PAGE (placeholder) ----------------
if (document.getElementById("qrStatus")) {
    document.getElementById("qrStatus").innerText = 
        "QR scanning will be implemented next week";
}







/* ================= FIELD-WISE MULTILINGUAL VOICE INPUT ================= */

function startVoiceFor(fieldId, isNumber = false) {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Please use Google Chrome for voice input");
    return;
  }

  const lang = document.getElementById("voiceLang").value;
  const recognition = new webkitSpeechRecognition();

  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    let text = event.results[0][0].transcript.trim();

    if (isNumber) {
      text = convertSpokenNumberToDigits(text);
    }

    const input = document.getElementById(fieldId);
    if (input) input.value = text;
  };

  recognition.onerror = (e) => {
    console.error("Voice error:", e.error);
  };

  recognition.start();
}

/* ================= SPOKEN NUMBER → DIGITS ================= */

/* ================= ADVANCED SPOKEN NUMBER PARSER ================= */

function convertSpokenNumberToDigits(text) {
  text = text.toLowerCase();

  // Remove common unwanted words
  text = text.replace(/number|phone|mobile|is|my|the/gi, "");

  const numberMap = {
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9"
  };

  let result = "";

  const words = text.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    if (words[i] === "double" && numberMap[words[i + 1]]) {
      result += numberMap[words[i + 1]] + numberMap[words[i + 1]];
      i++;
    } else if (numberMap[words[i]]) {
      result += numberMap[words[i]];
    } else if (!isNaN(words[i])) {
      result += words[i];
    }
  }

  return result;
}

/* ================= VOICE OUTPUT (READ BACK) ================= */

function readFamilyDetails() {
  const lang = document.getElementById("voiceLang").value;

  const summary = `
    Family head name is ${familyName.value}.
    Address is ${address.value}.
    Contact number is ${contact.value}.
    Family details are ${notes.value}.
  `;

  const speech = new SpeechSynthesisUtterance(summary);
  speech.lang = lang;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}
