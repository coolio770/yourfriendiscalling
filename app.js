const app = document.getElementById("app");
const statusTime = document.getElementById("status-time");
const lockTime = document.getElementById("lock-time");
const lockDate = document.getElementById("lock-date");
const lockScreen = document.getElementById("lock-screen");
const callerSub = document.getElementById("caller-sub");
const callStatus = document.getElementById("call-status");
const declineBtn = document.getElementById("decline-btn");
const acceptBtn = document.getElementById("accept-btn");
const hangupBtn = document.getElementById("hangup-btn");
const ringtone = document.getElementById("ringtone");
const callAudio = document.getElementById("call-audio");

const TITLES = ["John.P.DonutGaming is calling…", "Incoming Call"];

let ringTimer = null;
let titleTimer = null;
let callTimer = null;
let declineTimer = null;
let callSeconds = 0;
let titleIndex = 0;

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateClock() {
  const now = new Date();
  const hours = now.getHours() % 12 || 12;
  const time = `${hours}:${pad(now.getMinutes())}`;
  statusTime.textContent = time;
  lockTime.textContent = time;
  lockDate.textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function setState(state) {
  app.dataset.state = state;
}

function blinkTitle(incoming) {
  clearInterval(titleTimer);
  if (!incoming) {
    document.title = "John.P.DonutGaming";
    return;
  }
  titleIndex = 0;
  document.title = TITLES[0];
  titleTimer = setInterval(() => {
    titleIndex = 1 - titleIndex;
    document.title = TITLES[titleIndex];
  }, 1000);
}

function vibrateRing() {
  if (!navigator.vibrate) return;
  navigator.vibrate([400, 160, 400]);
}

function playRingtoneAudio() {
  if (app.dataset.state !== "incoming") return;
  ringtone.loop = true;
  ringtone.muted = false;
  ringtone.volume = 1;
  const play = ringtone.play();
  if (play) play.catch(() => {});
}

function startRingtone() {
  stopRingtone();
  playRingtoneAudio();
  vibrateRing();
  ringTimer = setInterval(() => {
    playRingtoneAudio();
    vibrateRing();
  }, 2600);
}

function stopRingtone() {
  clearInterval(ringTimer);
  ringTimer = null;
  ringtone.pause();
  try {
    ringtone.currentTime = 0;
  } catch {
    // ignore if the audio element isn't ready yet
  }
  if (navigator.vibrate) navigator.vibrate(0);
}

function formatCallTime(total) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function startCallTimer() {
  stopCallTimer();
  callSeconds = 0;
  callStatus.textContent = formatCallTime(callSeconds);
  callTimer = setInterval(() => {
    callSeconds += 1;
    callStatus.textContent = formatCallTime(callSeconds);
  }, 1000);
}

function stopCallTimer() {
  clearInterval(callTimer);
  callTimer = null;
}

function startIncoming() {
  clearTimeout(declineTimer);
  stopCallTimer();
  try {
    callAudio.pause();
    callAudio.currentTime = 0;
  } catch {
    // ignore if the audio element isn't ready yet
  }
  callerSub.textContent = "mobile";
  setState("incoming");
  blinkTitle(true);
  startRingtone();
}

function unlockPhone() {
  if (app.dataset.state !== "locked") return;
  startIncoming();
  try {
    navigator.wakeLock?.request("screen");
  } catch {
    // Wake Lock is optional
  }
}

function declineCall() {
  if (app.dataset.state !== "incoming") return;
  stopRingtone();
  setState("declined");
  callerSub.textContent = "call declined";
  blinkTitle(false);
  document.title = "Call declined";

  declineTimer = window.setTimeout(() => {
    startIncoming();
  }, 700);
}

function acceptCall() {
  if (app.dataset.state !== "incoming") return;
  clearTimeout(declineTimer);
  stopRingtone();
  setState("active");
  blinkTitle(false);
  document.title = "John.P.DonutGaming";
  callStatus.textContent = "connecting…";

  window.setTimeout(() => {
    startCallTimer();
    callAudio.play().catch(() => {});
  }, 650);
}

function hangupCall() {
  startIncoming();
}

updateClock();
setInterval(updateClock, 1000);
document.title = "iPhone";

lockScreen.addEventListener("pointerdown", unlockPhone);
lockScreen.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    unlockPhone();
  }
});
declineBtn.addEventListener("click", declineCall);
acceptBtn.addEventListener("click", acceptCall);
hangupBtn.addEventListener("click", hangupCall);
