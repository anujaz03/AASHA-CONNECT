/* ================= LOGGED-IN WORKER (TEMP MOCK) ================= */
const loggedInWorker = {
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

  recognition.onstart = () => {
    const lang = getSelectedLang();
    if (lang === "hi-IN") speakText("अब बोलिए");
    else if (lang === "mr-IN") speakText("आता बोला");
    else speakText("Please speak now");
  };

  recognition.onresult = (event) => {
    document.getElementById(fieldId).value =
      event.results[0][0].transcript;
  };

  recognition.onerror = () => {
    speakText("Voice not recognized, please try again");
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
  const saveBtn = document.getElementById("saveFamilyBtn");
  if (!saveBtn) return;

  saveBtn.addEventListener("click", () => {

    const family = {
      headName: document.getElementById("headName").value,
      address: document.getElementById("address").value,
      contact: document.getElementById("contact").value,
      notes: document.getElementById("notes").value,
      addedByWorkerId: loggedInWorker.id,
      addedByWorkerName: loggedInWorker.name,
      synced: false,
      createdAt: new Date()
    };

    console.log("SENDING FAMILY:", family);

    if (!family.headName || !family.address || !family.contact) {
      const lang = getSelectedLang();
      if (lang === "hi-IN") speakText("कृपया सभी जानकारी भरें");
      else if (lang === "mr-IN") speakText("कृपया सर्व माहिती भरा");
      else speakText("Please fill all required fields");
      alert("Please fill all required fields");
      return;
    }

    /* SAVE OFFLINE */
    saveFamilyOffline(family);

    /* TRY ONLINE SAVE */
    fetch("http://localhost:5000/api/family/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(family)
    })
    .then(res => res.json())
    .then(data => {
      console.log("Saved to MongoDB:", data);
    })
    .catch(err => {
      console.warn("Offline, will sync later", err);
    });

    const lang = getSelectedLang();
    if (lang === "hi-IN") speakText("परिवार की जानकारी सफलतापूर्वक सहेजी गई");
    else if (lang === "mr-IN") speakText("कुटुंबाची माहिती यशस्वीरित्या जतन झाली");
    else speakText("Family saved successfully");

    alert("Family saved successfully");
    window.location.href = "families.html";
  });
});
