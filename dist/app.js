const state = {
  photos: [],
  lastResult: null,
  history: loadHistory(),
  activeModal: null,
  demoTimers: [],
};

const urgentSymptoms = new Set(["open-wound", "bleeding", "swelling", "pain", "lethargy", "near-eye"]);
const moderateSymptoms = new Set(["odor", "ear-discharge", "moist", "hair-loss", "round-patch", "flea-dirt"]);

const el = {
  form: document.querySelector("#scanForm"),
  photoInput: document.querySelector("#photoInput"),
  dropZone: document.querySelector("#dropZone"),
  thumbStrip: document.querySelector("#thumbStrip"),
  analyzeButton: document.querySelector("#analyzeButton"),
  resetButton: document.querySelector("#resetButton"),
  emptyState: document.querySelector("#emptyState"),
  resultContent: document.querySelector("#resultContent"),
  resultTitle: document.querySelector("#resultTitle"),
  triageBanner: document.querySelector("#triageBanner"),
  triageLevel: document.querySelector("#triageLevel"),
  triageSummary: document.querySelector("#triageSummary"),
  riskMeter: document.querySelector("#riskMeter span"),
  matchList: document.querySelector("#matchList"),
  stepList: document.querySelector("#stepList"),
  reportOutput: document.querySelector("#reportOutput"),
  copyReport: document.querySelector("#copyReport"),
  downloadReport: document.querySelector("#downloadReport"),
  savedCount: document.querySelector("#savedCount"),
  historyList: document.querySelector("#historyList"),
  clearHistory: document.querySelector("#clearHistory"),
  qualityLabel: document.querySelector("#qualityLabel"),
  photoCount: document.querySelector("#photoCount"),
  urgentCount: document.querySelector("#urgentCount"),
  caseId: document.querySelector("#caseId"),
  findVet: document.querySelector("#findVet"),
  locationInput: document.querySelector("#locationInput"),
  toast: document.querySelector("#toast"),
  themeToggle: document.querySelector("#themeToggle"),
  sampleRun: document.querySelector("#sampleRun"),
  heroRunDemo: document.querySelector("#heroRunDemo"),
  sampleStage: document.querySelector("#sampleStage"),
  demoProgress: document.querySelector("#demoProgress"),
  demoStatus: document.querySelector("#demoStatus"),
  demoReport: document.querySelector("#demoReport"),
  modalBackdrop: document.querySelector("#modalBackdrop"),
  loginForm: document.querySelector("#loginForm"),
  demoForm: document.querySelector("#demoForm"),
  loginSuccess: document.querySelector("#loginSuccess"),
  demoSuccess: document.querySelector("#demoSuccess"),
  demoPlan: document.querySelector("#demoPlan"),
};

boot();

function boot() {
  if (el.form && el.dropZone && el.photoInput) {
    wireCheckerEvents();
    renderHistory();
    updateSavedCount();
  }
  wireSiteEvents();
  refreshIcons();
}

function wireCheckerEvents() {
  el.dropZone.addEventListener("click", () => el.photoInput.click());
  el.dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      el.photoInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    el.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      el.dropZone.classList.add("dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    el.dropZone.addEventListener(eventName, () => el.dropZone.classList.remove("dragging"));
  });

  el.dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []).filter((file) => file.type.startsWith("image/"));
    handleFiles(files);
  });

  el.photoInput.addEventListener("change", (event) => {
    handleFiles(Array.from(event.target.files || []));
  });

  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    runAnalysis();
  });

  el.resetButton.addEventListener("click", resetForm);
  el.copyReport.addEventListener("click", copyReport);
  el.downloadReport.addEventListener("click", downloadReport);
  el.clearHistory.addEventListener("click", clearHistory);
  el.findVet.addEventListener("click", openVetSearch);
}

function wireSiteEvents() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-open-modal]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const modalId = trigger.dataset.openModal;
      if (trigger.dataset.plan && el.demoPlan) {
        el.demoPlan.value = trigger.dataset.plan;
      }
      openModal(modalId);
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeActiveModal);
  });

  el.modalBackdrop?.addEventListener("click", closeActiveModal);
  el.themeToggle?.addEventListener("click", toggleTheme);
  el.sampleRun?.addEventListener("click", runSampleDemo);
  el.heroRunDemo?.addEventListener("click", () => {
    document.querySelector("#demo").scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(runSampleDemo, 450);
  });

  el.loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitVisualForm(el.loginForm, el.loginSuccess, "Demo login accepted.");
  });

  el.demoForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitVisualForm(el.demoForm, el.demoSuccess, "Demo request captured.");
  });

  document.querySelectorAll("[data-visual-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const successElement = form.querySelector(".form-success");
      submitVisualForm(form, successElement, form.dataset.successMessage || "Message captured.");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.activeModal) {
      closeActiveModal();
    }
  });
}

async function handleFiles(files) {
  const imageFiles = files.filter((file) => file.type.startsWith("image/")).slice(0, 3);
  if (!imageFiles.length) {
    showToast("Add at least one image file.");
    return;
  }

  try {
    state.photos = await Promise.all(imageFiles.map(readImageFile));
    renderThumbs();
    updatePhotoQuality();
    el.analyzeButton.disabled = false;
    showToast(`${state.photos.length} photo${state.photos.length === 1 ? "" : "s"} ready.`);
  } catch {
    showToast("One image could not be loaded.");
  }
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          src: reader.result,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderThumbs() {
  el.thumbStrip.innerHTML = state.photos
    .map(
      (photo, index) => `
        <figure class="thumb">
          <img src="${photo.src}" alt="Uploaded skin photo ${index + 1}" />
          <span>${photo.width}x${photo.height}</span>
        </figure>
      `,
    )
    .join("");
}

function updatePhotoQuality() {
  if (!state.photos.length) {
    el.qualityLabel.textContent = "Waiting for image";
    return;
  }

  const smallestSide = Math.min(...state.photos.map((photo) => Math.min(photo.width, photo.height)));
  const hasThree = state.photos.length >= 3;

  if (smallestSide >= 900 && hasThree) {
    el.qualityLabel.textContent = "Strong set";
  } else if (smallestSide >= 640) {
    el.qualityLabel.textContent = "Usable";
  } else {
    el.qualityLabel.textContent = "Low detail";
  }
}

function runAnalysis() {
  if (!state.photos.length) {
    showToast("Add a photo first.");
    return;
  }

  const data = getFormData();
  const result = analyze(data);
  state.lastResult = result;
  state.history = [result, ...state.history.filter((item) => item.caseId !== result.caseId)].slice(0, 8);
  saveHistory();
  renderResult(result);
  renderHistory();
  updateSavedCount();
  showToast("Concern profile created.");
}

function getFormData() {
  const checked = Array.from(document.querySelectorAll('input[name="symptom"]:checked')).map((input) => input.value);
  return {
    species: document.querySelector("#species").value,
    age: document.querySelector("#age").value,
    bodyArea: document.querySelector("#bodyArea").value,
    duration: document.querySelector("#duration").value,
    notes: document.querySelector("#notes").value.trim(),
    symptoms: checked,
    photos: state.photos,
  };
}

function analyze(data) {
  const symptoms = new Set(data.symptoms);
  const urgentCount = data.symptoms.filter((symptom) => urgentSymptoms.has(symptom)).length;
  const moderateCount = data.symptoms.filter((symptom) => moderateSymptoms.has(symptom)).length;
  const score =
    18 +
    urgentCount * 18 +
    moderateCount * 8 +
    (symptoms.has("redness") ? 6 : 0) +
    (symptoms.has("itching") ? 6 : 0) +
    (data.duration === "chronic" ? 10 : 0) +
    (data.duration === "today" && symptoms.has("swelling") ? 8 : 0) +
    (data.bodyArea === "multiple" ? 8 : 0);

  const boundedScore = Math.min(100, score);
  const triage = getTriage(boundedScore, urgentCount, symptoms);
  const matches = buildMatches(data, symptoms, urgentCount);
  const steps = buildSteps(data, triage, symptoms);
  const caseId = `PD-${Date.now().toString().slice(-6)}`;

  return {
    ...data,
    caseId,
    createdAt: new Date().toISOString(),
    score: boundedScore,
    urgentCount,
    triage,
    matches,
    steps,
  };
}

function getTriage(score, urgentCount, symptoms) {
  if (urgentCount >= 2 || symptoms.has("lethargy") || symptoms.has("near-eye") || symptoms.has("bleeding")) {
    return {
      level: "Urgent vet",
      summary: "Same-day care recommended",
      tone: "urgent",
    };
  }

  if (urgentCount === 1 || score >= 56) {
    return {
      level: "Vet soon",
      summary: "Book a visit within 24-72 hours",
      tone: "watch",
    };
  }

  return {
    level: "Monitor",
    summary: "Track closely and call if it worsens",
    tone: "calm",
  };
}

function buildMatches(data, symptoms, urgentCount) {
  const matches = [];
  const add = (title, confidence, body) => matches.push({ title, confidence, body });

  if (symptoms.has("flea-dirt") || (symptoms.has("itching") && data.bodyArea === "tail-base")) {
    add("Flea allergy or parasite irritation", 82, "Itching around the tail base with flea dirt often needs parasite control and vet guidance.");
  }

  if (symptoms.has("moist") || (symptoms.has("licking") && symptoms.has("redness") && symptoms.has("odor"))) {
    add("Hot spot or moist dermatitis", 76, "Moist, irritated patches can spread quickly when a pet keeps licking or scratching.");
  }

  if (symptoms.has("round-patch") || (symptoms.has("hair-loss") && symptoms.has("flaking"))) {
    add("Fungal-looking or scaly patch", 68, "Round hair-loss patches and flaking can resemble infections that need testing before treatment.");
  }

  if (data.bodyArea === "ears" || symptoms.has("ear-discharge")) {
    add("Ear and skin inflammation", 74, "Ear discharge, odor, or scratching can point to ear inflammation that should be checked.");
  }

  if (urgentCount > 0 || symptoms.has("open-wound") || symptoms.has("swelling")) {
    add("Wound or infection concern", 88, "Pain, swelling, bleeding, or open skin raises concern for infection or deeper injury.");
  }

  if (!matches.length && (symptoms.has("itching") || symptoms.has("redness"))) {
    add("Allergy or contact irritation", 58, "Mild itching and redness can follow grooming products, plants, bites, food changes, or seasonal triggers.");
  }

  if (!matches.length) {
    add("Low-detail skin change", 42, "The marked signs are limited. Keep photos dated and compare the area over the next day.");
  }

  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

function buildSteps(data, triage, symptoms) {
  const steps = [];

  if (triage.tone === "urgent") {
    steps.push("Contact a veterinarian or emergency clinic today.");
  } else if (triage.tone === "watch") {
    steps.push("Book a vet visit and share this report with the photos.");
  } else {
    steps.push("Take another photo in 24 hours from the same distance and lighting.");
  }

  if (symptoms.has("licking") || symptoms.has("itching")) {
    steps.push("Prevent repeated licking or scratching while arranging care.");
  }

  if (symptoms.has("open-wound") || symptoms.has("bleeding")) {
    steps.push("Keep the area clean and avoid applying human medications.");
  }

  if (symptoms.has("flea-dirt")) {
    steps.push("Check other pets and bedding for fleas and ask the vet about prevention.");
  }

  if (data.notes) {
    steps.push("Bring notes about recent food, grooming, environment, and flea prevention changes.");
  }

  steps.push("Do not start prescription or leftover medication without veterinary direction.");
  return steps.slice(0, 5);
}

function renderResult(result) {
  el.emptyState.hidden = true;
  el.resultContent.hidden = false;
  el.resultTitle.textContent = `${capitalize(result.species)} ${result.bodyArea.replace("-", " ")} check`;
  el.triageLevel.textContent = result.triage.level;
  el.triageSummary.textContent = result.triage.summary;
  el.triageBanner.dataset.tone = result.triage.tone;
  el.riskMeter.style.height = `${Math.max(18, result.score)}%`;
  el.riskMeter.style.background = result.triage.tone === "urgent" ? "var(--coral)" : result.triage.tone === "watch" ? "var(--amber)" : "var(--brand)";

  el.matchList.innerHTML = result.matches
    .map(
      (match) => `
        <article class="match-item">
          <div class="match-top">
            <span>${match.title}</span>
            <span class="confidence" aria-label="${match.confidence}% match strength">
              <span style="width: ${match.confidence}%"></span>
            </span>
          </div>
          <p>${match.body}</p>
        </article>
      `,
    )
    .join("");

  el.stepList.innerHTML = result.steps.map((step) => `<li>${step}</li>`).join("");
  el.photoCount.textContent = result.photos.length;
  el.urgentCount.textContent = result.urgentCount;
  el.caseId.textContent = result.caseId;
  el.reportOutput.textContent = createReport(result);
  el.copyReport.disabled = false;
  el.downloadReport.disabled = false;
  refreshIcons();
}

function createReport(result) {
  const date = new Date(result.createdAt).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return [
    `PawDerm AI vet handoff note`,
    `Case: ${result.caseId}`,
    `Created: ${date}`,
    ``,
    `Pet: ${capitalize(result.species)}, ${result.age}`,
    `Area: ${result.bodyArea.replace("-", " ")}`,
    `Duration: ${result.duration}`,
    `Photos: ${result.photos.length}`,
    `Symptoms: ${result.symptoms.length ? result.symptoms.map((item) => item.replace("-", " ")).join(", ") : "None marked"}`,
    ``,
    `Route: ${result.triage.level}`,
    `Summary: ${result.triage.summary}`,
    `Concern score: ${result.score}/100`,
    ``,
    `Possible matches, not diagnoses:`,
    ...result.matches.map((match) => `- ${match.title} (${match.confidence}%): ${match.body}`),
    ``,
    `Next steps:`,
    ...result.steps.map((step) => `- ${step}`),
    ``,
    `Notes: ${result.notes || "None"}`,
    ``,
    `Safety: This tool organizes context only and cannot diagnose or prescribe treatment.`,
  ].join("\n");
}

function renderHistory() {
  if (!el.historyList) return;

  if (!state.history.length) {
    el.historyList.innerHTML = `<p class="fine-print">No saved cases yet.</p>`;
    return;
  }

  el.historyList.innerHTML = state.history
    .map(
      (item) => `
        <article class="history-item">
          <div class="history-meta">
            <span>${item.caseId}</span>
            <span>${new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <strong>${item.triage.level}: ${item.bodyArea.replace("-", " ")}</strong>
          <button class="ghost-button compact" type="button" data-case="${item.caseId}">
            <i data-lucide="file-search"></i>
            Open
          </button>
        </article>
      `,
    )
    .join("");

  el.historyList.querySelectorAll("[data-case]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.history.find((caseItem) => caseItem.caseId === button.dataset.case);
      if (item) {
        state.lastResult = item;
        renderResult(item);
        document.querySelector("#demo").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
  refreshIcons();
}

function updateSavedCount() {
  if (!el.savedCount) return;
  el.savedCount.textContent = state.history.length;
}

function saveHistory() {
  const slimHistory = state.history.map((item) => ({
    ...item,
    photos: item.photos.map((photo) => ({
      name: photo.name,
      width: photo.width,
      height: photo.height,
      size: photo.size,
    })),
  }));
  localStorage.setItem("pawderm-history", JSON.stringify(slimHistory));
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem("pawderm-history") || "[]");
  } catch {
    return [];
  }
}

async function copyReport() {
  const report = state.lastResult ? createReport(state.lastResult) : "";
  if (!report) return;

  try {
    await navigator.clipboard.writeText(report);
    showToast("Report copied.");
  } catch {
    showToast("Copy failed. Select the report text manually.");
  }
}

function downloadReport() {
  if (!state.lastResult) return;
  const report = createReport(state.lastResult);
  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.lastResult.caseId}-pawderm-report.txt`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Report downloaded.");
}

function clearHistory() {
  state.history = [];
  state.lastResult = null;
  localStorage.removeItem("pawderm-history");
  renderHistory();
  updateSavedCount();
  showToast("Case history cleared.");
}

function resetForm() {
  state.photos = [];
  state.lastResult = null;
  el.form.reset();
  el.thumbStrip.innerHTML = "";
  el.analyzeButton.disabled = true;
  el.emptyState.hidden = false;
  el.resultContent.hidden = true;
  el.resultTitle.textContent = "No note yet";
  el.reportOutput.textContent = "Create a note to generate a vet handoff summary.";
  el.copyReport.disabled = true;
  el.downloadReport.disabled = true;
  el.qualityLabel.textContent = "Waiting for image";
  el.riskMeter.style.height = "22%";
  el.riskMeter.style.background = "var(--brand)";
  showToast("Ready for a new case.");
}

function openVetSearch() {
  const location = el.locationInput.value.trim();
  const query = encodeURIComponent(`${location ? `${location} ` : ""}veterinarian dermatology pet clinic`);
  window.open(`https://www.google.com/maps/search/${query}`, "_blank", "noopener,noreferrer");
}

function runSampleDemo() {
  if (!el.sampleRun || !el.sampleStage || !el.demoProgress || !el.demoStatus || !el.demoReport) return;

  state.demoTimers.forEach((timer) => window.clearTimeout(timer));
  state.demoTimers = [];

  const steps = Array.from(document.querySelectorAll(".sample-steps span"));
  const messages = [
    ["Checking photos", "Close-up and wider view are usable. Natural light is good enough for a case note."],
    ["Reading notes", "Licking, damp skin, and odor make this worth a vet call instead of simple monitoring."],
    ["Reviewing red flags", "Possible category: moist dermatitis or hot spot. This is not a diagnosis."],
    ["Note ready", "Book a vet visit soon and share this short summary with the clinic."],
  ];

  el.sampleRun.disabled = true;
  el.sampleStage.classList.remove("running");
  void el.sampleStage.offsetWidth;
  el.sampleStage.classList.add("running");
  el.demoProgress.style.width = "0%";
  steps.forEach((step) => step.classList.remove("active"));
  el.demoStatus.textContent = "Running";
  el.demoReport.textContent = "Building Milo's sample note...";

  messages.forEach(([status, report], index) => {
    const timer = window.setTimeout(() => {
      steps.forEach((step, stepIndex) => step.classList.toggle("active", stepIndex <= index));
      el.demoProgress.style.width = `${(index + 1) * 25}%`;
      el.demoStatus.textContent = status;
      el.demoReport.textContent = report;
      if (index === messages.length - 1) {
        el.sampleRun.disabled = false;
        showToast("Sample note ready.");
      }
    }, 600 + index * 850);
    state.demoTimers.push(timer);
  });
}

function openModal(modalId) {
  const modal = document.querySelector(`#${modalId}`);
  if (!modal) return;

  closeActiveModal();
  state.activeModal = modal;
  if (el.modalBackdrop) {
    el.modalBackdrop.hidden = false;
  }

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.setAttribute("open", "");
  }

  window.setTimeout(() => {
    const firstField = modal.querySelector("input, select, textarea, button");
    firstField?.focus();
  }, 30);
}

function closeActiveModal() {
  if (!state.activeModal) return;

  if (typeof state.activeModal.close === "function") {
    state.activeModal.close();
  } else {
    state.activeModal.removeAttribute("open");
  }

  state.activeModal = null;
  if (el.modalBackdrop) {
    el.modalBackdrop.hidden = true;
  }
}

function submitVisualForm(form, successElement, toastMessage) {
  if (successElement) {
    successElement.hidden = true;
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  if (successElement) {
    successElement.hidden = false;
  }
  showToast(toastMessage);
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  const isDark = document.documentElement.classList.contains("dark");
  el.themeToggle.innerHTML = `<i data-lucide="${isDark ? "sun-medium" : "moon"}"></i>`;
  refreshIcons();
}

function showToast(message) {
  if (!el.toast) return;
  el.toast.textContent = message;
  el.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => el.toast.classList.remove("show"), 2400);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
