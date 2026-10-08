const EVENT = {
  title: "Mauro · 50 años",
  start: new Date("2026-11-21T21:00:00-03:00"),
  end: new Date("2026-11-22T00:00:00-03:00"),
  location: "Mona, Roca 1932",
  description: "Celebramos los 50 años de Mauro.",
};

const values = {
  days: document.querySelector('[data-unit="days"]'),
  hours: document.querySelector('[data-unit="hours"]'),
  minutes: document.querySelector('[data-unit="minutes"]'),
  seconds: document.querySelector('[data-unit="seconds"]'),
};

function updateCountdown() {
  const distance = Math.max(0, EVENT.start.getTime() - Date.now());
  const days = Math.floor(distance / 86_400_000);
  const hours = Math.floor((distance / 3_600_000) % 24);
  const minutes = Math.floor((distance / 60_000) % 60);
  const seconds = Math.floor((distance / 1_000) % 60);

  values.days.textContent = String(days).padStart(2, "0");
  values.hours.textContent = String(hours).padStart(2, "0");
  values.minutes.textContent = String(minutes).padStart(2, "0");
  values.seconds.textContent = String(seconds).padStart(2, "0");
}

function toIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(text) {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

function downloadCalendarEvent() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mauro 50//Invitacion//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:mauro-50-${EVENT.start.getTime()}@invitacion`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(EVENT.start)}`,
    `DTEND:${toIcsDate(EVENT.end)}`,
    `SUMMARY:${escapeIcs(EVENT.title)}`,
    `DESCRIPTION:${escapeIcs(EVENT.description)}`,
    `LOCATION:${escapeIcs(EVENT.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "Mauro-50-anos.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Evento listo para agregar al calendario");
}

let toastTimer;
function showToast(message) {
  const toast = document.querySelector(".toast");
  toast.textContent = message;
  toast.setAttribute("aria-hidden", "false");
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    toast.setAttribute("aria-hidden", "true");
  }, 2800);
}

const invitationAudio = document.querySelector("#invitationAudio");
const audioToggle = document.querySelector(".audio-toggle");
let musicWasPausedByVisitor = false;

function syncAudioButton() {
  const isPlaying = !invitationAudio.paused;
  audioToggle.classList.toggle("is-playing", isPlaying);
  audioToggle.setAttribute("aria-pressed", String(isPlaying));
  audioToggle.setAttribute("aria-label", isPlaying ? "Pausar música" : "Reproducir música");
}

async function playMusic() {
  if (musicWasPausedByVisitor) return false;

  try {
    invitationAudio.muted = false;
    invitationAudio.volume = 1;
    await invitationAudio.play();
    syncAudioButton();
    return true;
  } catch {
    syncAudioButton();
    return false;
  }
}

let musicPrompt;

function showMusicPrompt() {
  if (musicPrompt || !invitationAudio.paused || musicWasPausedByVisitor) return;

  musicPrompt = document.createElement("button");
  musicPrompt.type = "button";
  musicPrompt.textContent = "Tocá para abrir la invitación";
  musicPrompt.setAttribute("aria-label", "Abrir invitación y reproducir música");
  Object.assign(musicPrompt.style, {
    position: "fixed", inset: "0", zIndex: "100", border: "0", width: "100%",
    background: "rgba(8, 7, 5, 0.96)", color: "#f7e9c5", font: "600 1rem/1.2 system-ui, sans-serif",
    letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
  });
  musicPrompt.addEventListener("click", async () => {
    const started = await playMusic();
    if (started) {
      musicPrompt.remove();
      musicPrompt = null;
    }
  });
  document.body.appendChild(musicPrompt);
}

function tryAutoplayMusic() {
  if (invitationAudio.paused && !musicWasPausedByVisitor) {
    void playMusic().then((started) => {
      if (!started) showMusicPrompt();
    });
  }
}

audioToggle.addEventListener("click", async (event) => {
  event.stopPropagation();
  if (invitationAudio.paused) {
    musicWasPausedByVisitor = false;
    await playMusic();
  } else {
    musicWasPausedByVisitor = true;
    invitationAudio.pause();
    syncAudioButton();
  }
});

invitationAudio.addEventListener("play", syncAudioButton);
invitationAudio.addEventListener("pause", syncAudioButton);
invitationAudio.addEventListener("loadeddata", tryAutoplayMusic, { once: true });
invitationAudio.addEventListener("canplay", tryAutoplayMusic, { once: true });
window.addEventListener("load", tryAutoplayMusic, { once: true });
window.addEventListener("pageshow", tryAutoplayMusic);
invitationAudio.load();
tryAutoplayMusic();

document.querySelector('[data-action="calendar"]').addEventListener("click", downloadCalendarEvent);

document.querySelector(".scroll-cue").addEventListener("click", () => {
  document.querySelector(".panel--countdown").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll("[data-pending]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showToast(`Próximamente conectamos el enlace de ${link.dataset.pending}`);
  });
});

updateCountdown();
window.setInterval(updateCountdown, 1000);
