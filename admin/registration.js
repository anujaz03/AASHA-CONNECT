console.log("registration.js loaded");

const testOTPMap = {
  "7666799449": "666666",
  "7773946071": "321432",
  "8822140891": "888888",
  "9123456789": "999999",
  "9822694287": "123456"
};
// dummy OTP

function sendOTP() {
  const phone = document.getElementById("phone").value;

  if (!phone || phone.length < 10) {
    alert("Enter valid phone number");
    return;
  }

  // OTP sent (dummy)
  alert("OTP sent successfully!");

  //  SHOW OTP INPUT & VERIFY BUTTON
  document.getElementById("otp").style.display = "block";
  document.getElementById("verifyBtn").style.display = "block";
}

async function verifyOTP() {
  const enteredOTP = document.getElementById("otp").value;

  let phone = document.getElementById("phone").value.trim();

// 🔥 normalize phone (remove +91, spaces)
if (phone.startsWith("+91")) {
  phone = phone.slice(3);
}

if (!testOTPMap[phone] || testOTPMap[phone] !== enteredOTP) {
  alert("Invalid OTP");
  return;
}


  alert("OTP verified successfully! Please set password and click Register.");


  try {
    const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
    const res = await fetch(`${base}/api/aadhaar/${phone}`);
    const result = await res.json();

    if (!res.ok || !result.success) {
      alert(result.message || "Aadhaar not found");
      return;
    }

    


    // AUTOFILL (FIXED)
    document.getElementById("fullname").value = result.data.name;
    document.getElementById("city").value = result.data.city;
    document.getElementById("aadhaar").value = result.data.aadhaar;
  document.getElementById("password").disabled = false;
document.getElementById("confirmPassword").disabled = false;

    alert("Aadhaar data fetched successfully!");

  } catch (err) {
    console.error(err);
    alert("Failed to fetch Aadhaar data");
  }
}





// ================= FINAL ADMIN REGISTRATION =================
document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const fullname = document.getElementById("fullname").value;
  const city = document.getElementById("city").value;
  const aadhaar = document.getElementById("aadhaar").value;

  // 🔐 PASSWORD VALIDATION
  if (!password || !confirmPassword) {
    alert("Please enter password");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  // 🔥 Ensure OTP + Aadhaar verification done
  if (!fullname || !aadhaar) {
    alert("Please verify OTP first");
    return;
  }

  try {
    const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
    const res = await fetch(`${base}/api/admin/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone,
        password,
        name: fullname,
        city,
        aadhaar
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Registration failed");
      return;
    }

    // ✅ SUCCESS
    alert(
      "Admin registered successfully!\n\n" +
      "You can now login using the same phone number and password."
    );

    window.location.href = "login.html";

  } catch (err) {
    console.error(err);
    alert("Server error during registration");
  }
});
