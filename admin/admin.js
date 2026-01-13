/********************************
 *  FIREBASE SETUP (TOP OF FILE)
 ********************************/

const firebaseConfig = {
  apiKey: "AIzaSyB1Uerix0XExWHSV5MAB_gC-sX3SsZu6Vg",
  authDomain: "aasha-connect-f28fa.firebaseapp.com",
  projectId: "aasha-connect-f28fa",
  appId: "1:56309574934:web:36b7c1es9f2b5523a2b437"
};

// Initialize Firebase (COMPAT)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Invisible reCAPTCHA (REQUIRED)
window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
  "recaptcha-container",
  { size: "invisible" }
);

let confirmationResult;

/********************************
 *  SEND REAL OTP
 ********************************/
async function sendOTP() {
  const phone = document.getElementById("phone").value;

  if (!phone || phone.length !== 10) {
    alert("Enter valid 10 digit phone number");
    return;
  }

  const phoneNumber = "+91" + phone;

  try {
    confirmationResult = await auth.signInWithPhoneNumber(
      phoneNumber,
      window.recaptchaVerifier
    );

    alert("OTP sent to your phone");
    document.getElementById("otp").style.display = "block";
    document.getElementById("verifyBtn").style.display = "block";
  } catch (error) {
    console.error(error);
    alert("OTP sending failed");
  }
}

/********************************
 *  VERIFY OTP (REAL)
 ********************************/
async function verifyOTP() {
  const otp = document.getElementById("otp").value;

  if (!confirmationResult) {
    alert("Please click Send OTP first");
    return;
  }

  try {
    await confirmationResult.confirm(otp);
    alert("OTP verified successfully");

    console.log("OTP VERIFIED → fetching Aadhaar data");
    fetchAadhaarData();   // 👈 MUST RUN

  } catch (error) {
    console.error(error);
    alert("Invalid OTP. Verification failed.");
  }
}

/*
   FETCH DATA FROM MONGODB
*/
async function fetchAadhaarData() {
  const phone = document.getElementById("phone").value.trim();

  console.log("Fetching Aadhaar for phone:", phone);

  try {
    const response = await fetch(
      `http://localhost:5000/api/aadhaar/fetch/${phone}`
    );

    if (!response.ok) {
      alert("No Aadhaar-linked record found");
      return;
    }

    const data = await response.json();
    console.log("AADHAAR DATA RECEIVED:", data);

    // 🔥 AUTO-FILL (IDs MUST MATCH HTML)
    document.getElementById("name").value = data.name || "";
    document.getElementById("city").value = data.city || "";
    document.getElementById("aadhaar").value = data.aadhaar || "";

  } catch (err) {
    console.error("Fetch error:", err);
    alert("Failed to fetch Aadhaar data");
  }
}


/********************************
 *  REGISTER ADMIN (SUBMIT FORM)
 ********************************/
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword =
      document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const adminData = {
      phone: document.getElementById("phone").value,
      name: document.getElementById("name").value,
      city: document.getElementById("city").value,
      aadhaar: document.getElementById("aadhaar").value,
      password: password
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adminData)
        }
      );

      const result = await response.json();
      alert(result.message);
    } catch (err) {
      alert("Backend server not running");
      console.error(err);
    }
  });
});
