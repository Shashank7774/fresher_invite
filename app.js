const CONFIG = {
  GOOGLE_APPS_SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbyh1OFHp_1BpTZxosSvp1sHDQ-FKThDFC5_vTXoiIRMUN1v4j6D2AywlU_swRQxx1MqXQ/exec",
};

let data = null;
let selectedGuest = null;
let currentResponse = "";

const $ = id => document.getElementById(id);

async function loadData() {
  const r = await fetch("data/invites.json", { cache: "no-store" });
  if (!r.ok) throw new Error("Invite data could not be loaded.");
  return r.json();
}

function labelForRole(role) {
  return role === "students" ? "Student" : role === "faculty" ? "Faculty" : "Administration";
}

function updateNames() {
  const role = $("role").value;
  const year = $("year").value;
  const name = $("name");
  name.innerHTML = '<option value="">Select your name</option>';
  name.disabled = true;
  $("lookupStatus").textContent = "";

  if (!role || !data) return;

  let list = data[role] || [];
  if (role === "students" && year) list = list.filter(x => x.year === year);

  if (!list.length) {
    name.innerHTML = '<option value="">No names found for this selection</option>';
    $("lookupStatus").textContent = "Ask the event team to add your name to data/invites.json.";
    return;
  }

  list.forEach(person => {
    const option = document.createElement("option");
    option.value = person.id;
    option.textContent = person.name;
    name.appendChild(option);
  });
  name.disabled = false;
}

async function sendToGoogleSheet(payload) {
  const url = CONFIG.GOOGLE_APPS_SCRIPT_URL;
  if (!url || url.includes("PASTE_YOUR")) return false;

  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn("Google Sheet request failed:", err);
    return false;
  }
}

function saveLocalEvent(payload) {
  const key = "heartians_rsvp_backup";
  const local = JSON.parse(localStorage.getItem(key) || "[]");
  local.push(payload);
  localStorage.setItem(key, JSON.stringify(local));
}

async function logInvitationViewed() {
  if (!selectedGuest) return;
  const payload = {
    action: "view",
    inviteId: selectedGuest.id,
    guestType: selectedGuest.roleLabel,
    year: selectedGuest.year || "",
    guestName: selectedGuest.name,
    viewedAt: new Date().toISOString()
  };
  saveLocalEvent(payload);
  await sendToGoogleSheet(payload);
}

async function submitRsvp(response) {
  if (!selectedGuest || !response) return;

  const buttons = document.querySelectorAll(".quick-choice");
  buttons.forEach(btn => btn.disabled = true);
  $("rsvpStatus").textContent = "Saving your response…";

  currentResponse = response;
  $("finalResponse").textContent = "RSVP: " + response.toUpperCase();

  const payload = {
    action: "rsvp",
    inviteId: selectedGuest.id,
    guestType: selectedGuest.roleLabel,
    year: selectedGuest.year || "",
    guestName: selectedGuest.name,
    response,
    phone: $("phone").value.trim(),
    message: $("message").value.trim(),
    submittedAt: new Date().toISOString()
  };

  saveLocalEvent(payload);
  const sent = await sendToGoogleSheet(payload);

  $("rsvpStatus").textContent = sent
    ? "Response recorded successfully ✓"
    : "Response saved on this device. Organizer sheet is not connected yet.";

  buttons.forEach(btn => {
    btn.disabled = false;
    btn.classList.toggle("selected", btn.dataset.response === response);
  });
}

$("role").addEventListener("change", () => {
  const isStudent = $("role").value === "students";
  $("yearWrap").classList.toggle("hidden", !isStudent);
  $("year").required = isStudent;
  if (!isStudent) $("year").value = "";
  updateNames();
});

$("year").addEventListener("change", updateNames);

$("guestForm").addEventListener("submit", async e => {
  e.preventDefault();

  const role = $("role").value;
  const year = $("year").value;
  const id = $("name").value;
  const person = (data[role] || []).find(x => x.id === id);

  if (!person || (role === "students" && person.year !== year)) {
    $("lookupStatus").textContent = "Please select a valid role, year and name.";
    return;
  }

  selectedGuest = { ...person, role, roleLabel: labelForRole(role) };
  currentResponse = "";

  $("finalName").textContent = selectedGuest.name;
  $("finalRole").textContent = selectedGuest.roleLabel +
    (selectedGuest.year ? " • " + selectedGuest.year : "");
  $("finalResponse").textContent = "RSVP: PENDING";
  $("rsvpStatus").textContent = "";
  $("phone").value = "";
  $("message").value = "";
  document.querySelectorAll(".quick-choice").forEach(btn => {
    btn.disabled = false;
    btn.classList.remove("selected");
  });

  $("selectionPage").classList.add("hidden");
  $("invitationPage").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Log that this particular invitation was opened.
  logInvitationViewed();
});

document.querySelectorAll(".quick-choice").forEach(button => {
  button.addEventListener("click", () => submitRsvp(button.dataset.response));
});

$("downloadPdf").addEventListener("click", async () => {
  const status = $("pdfStatus");
  status.textContent = "Preparing your invitation exactly as shown…";
  const card = $("pdfCard");

  try {
    if (!window.html2canvas || !window.jspdf) throw new Error("PDF library unavailable.");
    if (document.fonts && document.fonts.ready) await document.fonts.ready;

    const canvas = await html2canvas(card, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#0d0416",
      logging: false,
      imageTimeout: 15000,
      windowWidth: document.documentElement.clientWidth,
      onclone: (clonedDoc) => {
        const clonedCard = clonedDoc.getElementById("pdfCard");
        if (clonedCard) {
          clonedCard.style.width = card.getBoundingClientRect().width + "px";
          clonedCard.style.maxWidth = "none";
          clonedCard.style.margin = "0";
          clonedCard.style.boxShadow = "none";

          clonedCard.querySelectorAll(".final-head h1 em").forEach(el => {
            el.style.setProperty("background", "none", "important");
            el.style.setProperty("-webkit-background-clip", "initial", "important");
            el.style.setProperty("background-clip", "initial", "important");
            el.style.setProperty("-webkit-text-fill-color", "#ff66e0", "important");
            el.style.setProperty("color", "#ff66e0", "important");
          });

          clonedCard.querySelectorAll(".final-head h1").forEach(el => {
            const small = el.querySelector("small");
            if (small) {
              small.style.setProperty("background", "none", "important");
              small.style.setProperty("-webkit-text-fill-color", "#ffffff", "important");
              small.style.setProperty("color", "#ffffff", "important");
            }
          });

          clonedCard.querySelectorAll(".guest h2").forEach(el => {
            el.style.setProperty("background", "none", "important");
            el.style.setProperty("-webkit-background-clip", "initial", "important");
            el.style.setProperty("background-clip", "initial", "important");
            el.style.setProperty("-webkit-text-fill-color", "#ffd6f3", "important");
            el.style.setProperty("color", "#ffd6f3", "important");
          });
        }
      }
    });

    const { jsPDF } = window.jspdf;
    const pageWidth = 595.28;
    const pageHeight = pageWidth * (canvas.height / canvas.width);
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [pageWidth, pageHeight], compress: true, putOnlyUsedFonts: true });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

    const safe = selectedGuest.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
    pdf.save(`The_Heartians_Ignite_${safe}.pdf`);
    status.textContent = "Perfect — the PDF is the invitation card exactly as shown.";
  } catch (err) {
    console.error(err);
    status.textContent = "PDF generation failed. Please try again or use Print → Save as PDF.";
  }
});

$("backHome").addEventListener("click", () => {
  $("invitationPage").classList.add("hidden");
  $("selectionPage").classList.remove("hidden");
  $("guestForm").reset();
  $("yearWrap").classList.add("hidden");
  $("name").innerHTML = '<option value="">Select role first</option>';
  $("name").disabled = true;
  $("rsvpStatus").textContent = "";
  selectedGuest = null;
  currentResponse = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

(async () => {
  try {
    data = await loadData();
  } catch (err) {
    $("lookupStatus").textContent = "Could not load invite list. Run this through Live Server or a web host.";
  }
})();
