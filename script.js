const dialog = document.querySelector(".roster-dialog");
const openButtons = document.querySelectorAll("[data-open-roster]");
const closeButtons = document.querySelectorAll("[data-close-roster]");
const form = document.querySelector("[data-roster-form]");
const formView = document.querySelector("[data-form-view]");
const successView = document.querySelector("[data-success-view]");
const submitButton = form?.querySelector('button[type="submit"]');
const submitLabel = form?.querySelector(".submit-label");
const formError = form?.querySelector("[data-form-error]");
const dialogHeader = dialog?.querySelector(".dialog-header");
const markStage = document.querySelector(".mark-stage");
const markOrbit = document.querySelector(".brand-orbit");
const siteShell = document.querySelector(".site-shell");
const firstField = form?.querySelector("#name");
const successClose = successView?.querySelector("[data-close-roster]");
const SUBMIT_TIMEOUT = 15000;

const compactLayout = window.matchMedia("(max-width: 680px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let markFrame;
let markFrameTime;
let markActive = false;
let markDragging = false;
let markPointerId;
let currentRotation = 0;
let targetRotation = 0;
let dialogTimer;
let dialogMotionTimer;
let dialogOpener;
let dialogAnimations = [];

function clearDialogAnimations(finish = false) {
  window.clearTimeout(dialogMotionTimer);
  dialogAnimations.forEach((animation) => {
    if (finish) animation.finish();
    animation.cancel();
  });
  dialogAnimations = [];
}

function playMobileDialogEntrance() {
  if (!compactLayout.matches || reducedMotion.matches || !Element.prototype.animate) return;

  clearDialogAnimations();
  const activeView = formView.hidden ? successView : formView;
  const motion = [
    [dialogHeader, -4, 180],
    [activeView, 8, 240],
  ];

  dialogAnimations = motion
    .filter(([element]) => element)
    .map(([element, offset, duration]) =>
      element.animate(
        [
          { opacity: 0.35, transform: `translate3d(0, ${offset}px, 0)` },
          { opacity: 1, transform: "translate3d(0, 0, 0)" },
        ],
        {
          duration,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        },
      ),
    );

  dialogMotionTimer = window.setTimeout(() => clearDialogAnimations(true), 300);
}

function animateInteractiveMark(time) {
  const elapsed = markFrameTime == null ? 16.67 : time - markFrameTime;
  const responseTime = markActive ? 210 : 340;
  const followStrength = 1 - Math.exp(-elapsed / responseTime);
  markFrameTime = time;
  currentRotation += (targetRotation - currentRotation) * followStrength;

  markOrbit.style.transform = `rotate(${currentRotation}deg)`;

  const stillMoving = Math.abs(targetRotation - currentRotation) > 0.05;

  if (markActive || stillMoving) {
    markFrame = requestAnimationFrame(animateInteractiveMark);
  } else {
    markOrbit.style.transform = "";
    markFrame = undefined;
    markFrameTime = undefined;
  }
}

function startMarkFrame() {
  if (!markFrame) markFrame = requestAnimationFrame(animateInteractiveMark);
}

function updateMarkRotation(event) {
  const bounds = markStage.getBoundingClientRect();
  const pointerX = event.clientX - (bounds.left + bounds.width / 2);
  const pointerY = event.clientY - (bounds.top + bounds.height / 2);
  const pointerAngle = Math.atan2(pointerY, pointerX) * (180 / Math.PI);
  const desiredRotation = pointerAngle + 45;

  markActive = true;
  targetRotation =
    desiredRotation + Math.round((currentRotation - desiredRotation) / 360) * 360;
  startMarkFrame();
}

function releaseMark() {
  markDragging = false;
  markPointerId = undefined;
  markActive = false;
  targetRotation = Math.round(currentRotation / 360) * 360;
  startMarkFrame();
}

markStage?.addEventListener("pointerdown", (event) => {
  if (reducedMotion.matches || event.pointerType === "mouse") return;

  event.preventDefault();
  markDragging = true;
  markPointerId = event.pointerId;
  try {
    markStage.setPointerCapture(event.pointerId);
  } catch {}
  updateMarkRotation(event);
});

markStage?.addEventListener("pointermove", (event) => {
  if (reducedMotion.matches) return;

  if (event.pointerType === "mouse") {
    updateMarkRotation(event);
  } else if (markDragging && event.pointerId === markPointerId) {
    event.preventDefault();
    updateMarkRotation(event);
  }
});

markStage?.addEventListener("pointerleave", () => {
  if (!markDragging) releaseMark();
});

markStage?.addEventListener("pointerup", (event) => {
  if (!markDragging || event.pointerId !== markPointerId) return;
  if (markStage.hasPointerCapture(event.pointerId)) {
    markStage.releasePointerCapture(event.pointerId);
  }
  releaseMark();
});

markStage?.addEventListener("pointercancel", releaseMark);

function openRoster(opener) {
  if (!dialog || dialog.classList.contains("is-visible")) return;

  window.clearTimeout(dialogTimer);
  dialogOpener = opener;
  showFormView();
  siteShell?.setAttribute("inert", "");
  dialog.classList.remove("is-visible");
  dialog.hidden = false;
  document.body.classList.add("dialog-open");
  void dialog.offsetWidth;
  dialog.classList.add("is-visible");
  playMobileDialogEntrance();

  const focusDelay = reducedMotion.matches ? 0 : compactLayout.matches ? 260 : 480;
  dialogTimer = window.setTimeout(() => {
    if (dialog.hidden) return;
    // Desktop: jump straight into the form. Mobile: avoid popping the keyboard.
    const target = compactLayout.matches ? closeButtons[0] : firstField;
    target?.focus({ preventScroll: true });
  }, focusDelay);
}

function showFormView() {
  formView.hidden = false;
  successView.hidden = true;
  dialog.setAttribute("aria-labelledby", "roster-title");
}

function showSuccessView() {
  formView.hidden = true;
  successView.hidden = false;
  dialog.setAttribute("aria-labelledby", "success-title");
  successClose?.focus({ preventScroll: true });
}

function closeRoster() {
  if (!dialog || !dialog.classList.contains("is-visible")) return;

  clearDialogAnimations();
  dialog.classList.remove("is-visible");
  window.clearTimeout(dialogTimer);
  const transitionTime = reducedMotion.matches || compactLayout.matches ? 0 : 500;
  dialogTimer = window.setTimeout(() => {
    dialog.hidden = true;
    document.body.classList.remove("dialog-open");
    siteShell?.removeAttribute("inert");
    dialogOpener?.focus({ preventScroll: true });
  }, transitionTime);
}

openButtons.forEach((button) => {
  button.addEventListener("click", () => openRoster(button));
});
closeButtons.forEach((button) => button.addEventListener("click", closeRoster));

dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) closeRoster();
});

document.addEventListener("keydown", (event) => {
  if (!dialog || !dialog.classList.contains("is-visible")) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeRoster();
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = [...dialog.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (!dialog.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

const requiredFields = form ? [...form.querySelectorAll("[required]")] : [];

function clearFieldError(field) {
  field.closest(".field")?.classList.remove("is-invalid");
  field.removeAttribute("aria-invalid");
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fieldIsValid(field) {
  if (!field.value.trim()) return false;
  if (field.type === "email") return emailPattern.test(field.value.trim());
  return field.checkValidity();
}

function validateRosterForm() {
  requiredFields.forEach(clearFieldError);
  const invalidFields = requiredFields.filter((field) => !fieldIsValid(field));

  if (!invalidFields.length) return true;

  invalidFields.forEach((field) => {
    field.closest(".field")?.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
  });

  const firstInvalid = invalidFields[0];
  const onlyEmailWrong =
    invalidFields.length === 1 && firstInvalid.type === "email" && firstInvalid.value.trim();
  formError.textContent = onlyEmailWrong
    ? "Enter a valid work email."
    : "Complete the required fields.";
  formError.hidden = false;
  firstInvalid.focus({ preventScroll: true });
  formError.scrollIntoView({
    behavior: reducedMotion.matches ? "auto" : "smooth",
    block: "center",
  });
  return false;
}

function handleFieldEdit(field) {
  clearFieldError(field);
  if (!form.querySelector(".field.is-invalid")) formError.hidden = true;
}

requiredFields.forEach((field) => {
  field.addEventListener("input", () => handleFieldEdit(field));
  field.addEventListener("change", () => handleFieldEdit(field));
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (submitButton.disabled) return;
  formError.hidden = true;
  if (!validateRosterForm()) return;

  submitButton.disabled = true;
  submitLabel.textContent = "Submitting";

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), SUBMIT_TIMEOUT);
  const payload = Object.fromEntries(
    [...new FormData(form)].map(([key, value]) => [key, String(value).trim()]),
  );

  try {
    const response = await fetch(form.dataset.endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);
    const submissionRejected =
      result?.success === false || String(result?.success).toLowerCase() === "false";
    if (!response.ok || submissionRejected) {
      throw new Error(result?.message || "Submission failed");
    }

    form.reset();
    showSuccessView();
  } catch (error) {
    console.error("Roster request submission failed:", error);
    formError.textContent =
      error.name === "AbortError"
        ? "This is taking too long. Check your connection and try again."
        : "Couldn’t send. Please try again.";
    formError.hidden = false;
    formError.scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "center",
    });
  } finally {
    window.clearTimeout(timeout);
    submitButton.disabled = false;
    submitLabel.textContent = "Submit request";
  }
});
