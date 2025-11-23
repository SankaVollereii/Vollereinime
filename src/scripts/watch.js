import {
  VidstackPlayer,
  VidstackPlayerLayout,
} from "https://cdn.vidstack.io/player";
import { fetchWatchData } from "../utils/api.js";

let playerInstance = null;
let pageActive = true;
let currentAbortController = null;
let navData = null;
let isAutoplayEnabled = false;

function getIdAndSlug() {
  const parts = window.location.pathname.split("/");
  return { id: parts[2], slug: parts[3] };
}

function getEpisode(episodeInput) {
  return Number(episodeInput.value);
}

async function fetchWatchApi(episodeInput) {
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();
  const { id, slug } = getIdAndSlug();
  const episode = getEpisode(episodeInput);
  try {
    const data = await fetchWatchData(id, slug, episode);
    return data;
  } catch (error) {
    if (error.name !== 'AbortError') {
        console.error("Error fetching watch data:", error);
    }
    return null;
  }
}

async function createPlayer(data, playerInfo, playerContainer, autoplaySetting) {
  if (!pageActive || document.visibilityState === "hidden") return null;
  const streams = data.streams || data.video;

  if (data && streams && streams.length > 0) {
    playerInfo.classList.add("hidden");
    playerContainer.classList.remove("hidden");
    if (!pageActive) return null;

    try {
        const player = await VidstackPlayer.create({
          target: "#player",
          title: data.title,
          src: streams.map((stream) => ({
            src: stream.url || stream.src,
            type: "video/mp4",
            height: stream.quality ? parseInt(stream.quality) : undefined,
          })),
          layout: new VidstackPlayerLayout(),
          autoplay: autoplaySetting,
        });

        if (!pageActive) {
            console.log("Player created but page inactive. Destroying immediately.");
            player.destroy();
            return null;
        }

        return player;
    } catch (e) {
        console.warn("Player creation cancelled or failed:", e);
        return null;
    }
  } else {
    playerInfo.innerHTML =
      "Video belum tersedia, mungkin sedang proses upload. Silahkan coba lagi nanti. Jika masalah berlanjut, silahkan hubungi Sanka Vollerei.";
    return null;
  }
}

function removeVideoElements() {
  const videoElements = document.querySelectorAll("#player video");
  videoElements.forEach((video) => {
    video.pause();
    video.src = "";
    video.load();
    video.remove();
  });
}

function destroyPlayer() {
  pageActive = false;
  
  if (playerInstance) {
    if (typeof playerInstance.pause === "function") {
      playerInstance.pause();
    }
    try {
      playerInstance.destroy();
    } catch (e) {
      console.warn("Error destroying player instance:", e);
    }
    playerInstance = null;
  }
  
  const existingPlayer = document.querySelector("media-player");
  if (existingPlayer) {
    existingPlayer.remove();
  }
  removeVideoElements();
  
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

async function updatePlayer(
  episodeInput,
  prevButton,
  nextButton,
  currentEpButton,
  playerInfo,
  playerContainer,
) {
  const data = await fetchWatchApi(episodeInput);
  if (!pageActive || document.visibilityState === "hidden") return;

  navData = data.navigation || data.nav;
  
  prevButton.disabled = true;
  prevButton.classList.add("btn-disable");
  nextButton.disabled = true;
  nextButton.classList.add("btn-disable");

  if (navData) {
    if (!Array.isArray(navData)) {
        if (navData.prev) {
            prevButton.disabled = false;
            prevButton.classList.remove("btn-disable");
            prevButton.dataset.episode = navData.prev;
        }
        if (navData.next) {
            nextButton.disabled = false;
            nextButton.classList.remove("btn-disable");
            nextButton.dataset.episode = navData.next;
        }
    } else {
        const currentEpisode = getEpisode(episodeInput);
        if (navData[0] && navData[0].episode && currentEpisode !== Number(navData[0].episode)) {
             prevButton.disabled = false;
             prevButton.classList.remove("btn-disable");
             prevButton.dataset.episode = navData[0].episode;
        }
        if (navData[2] && navData[2].episode && currentEpisode !== Number(navData[2].episode)) {
             nextButton.disabled = false;
             nextButton.classList.remove("btn-disable");
             nextButton.dataset.episode = navData[2].episode;
        }
    }
  }

  playerInstance = await createPlayer(data, playerInfo, playerContainer, isAutoplayEnabled);
}

async function updateEpisode(
  newEpisode,
  episodeInput,
  prevButton,
  nextButton,
  currentEpButton,
  playerInfo,
  playerContainer,
) {
  destroyPlayer();
  const url = new URL(window.location);
  url.searchParams.set("episode", newEpisode);
  window.location.assign(url.toString()); 
  
  playerInfo.classList.remove("hidden");
  playerContainer.classList.add("hidden");
  playerInfo.innerHTML = "Loading episode " + newEpisode + "...";
  episodeInput.value = newEpisode;
  currentEpButton.textContent = `Episode ${newEpisode}`;

  pageActive = true;
}

export function initWatchPlayer() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _initWatchPlayer);
  } else {
    _initWatchPlayer();
  }
}

function _initWatchPlayer() {
  pageActive = true;

  const prevButton = document.getElementById("prevEpisode");
  const nextButton = document.getElementById("nextEpisode");
  const currentEpButton = document.getElementById("currentEp");
  const episodeInput = document.getElementById("episode");
  const playerInfo = document.getElementById("playerInfo");
  const playerContainer = document.getElementById("player");
  const autoplayToggle = document.getElementById("autoplayToggle");

  if (!prevButton || !nextButton || !currentEpButton || !episodeInput || !playerInfo) {
    return;
  }

  const savedAutoplay = localStorage.getItem("anime_autoplay");
  isAutoplayEnabled = savedAutoplay === "true"; 

  if (autoplayToggle) {
      autoplayToggle.checked = isAutoplayEnabled;
      autoplayToggle.addEventListener("change", (e) => {
          isAutoplayEnabled = e.target.checked;
          localStorage.setItem("anime_autoplay", isAutoplayEnabled);
      });
  }

  fetchWatchApi(episodeInput).then((data) => {
    if (!pageActive || document.visibilityState === "hidden") return;
    
    currentEpButton.textContent = "Ep " + getEpisode(episodeInput);
    
    if (playerContainer) {
        createPlayer(data, playerInfo, playerContainer, isAutoplayEnabled).then((player) => {
            if (!pageActive) {
                if(player) player.destroy();
                return;
            }
            
            playerInstance = player;
            navData = data.navigation || data.nav;
            prevButton.disabled = true;
            prevButton.classList.add("btn-disable");
            nextButton.disabled = true;
            nextButton.classList.add("btn-disable");

            if (navData) {
                if (!Array.isArray(navData)) {
                    if (navData.prev) {
                        prevButton.disabled = false;
                        prevButton.classList.remove("btn-disable");
                        prevButton.dataset.episode = navData.prev;
                    }
                    if (navData.next) {
                        nextButton.disabled = false;
                        nextButton.classList.remove("btn-disable");
                        nextButton.dataset.episode = navData.next;
                    }
                } else {
                    const currentEpisode = getEpisode(episodeInput);
                    if (navData[0] && navData[0].episode && currentEpisode !== Number(navData[0].episode)) {
                        prevButton.disabled = false;
                        prevButton.classList.remove("btn-disable");
                        prevButton.dataset.episode = navData[0].episode;
                    }
                    if (navData[2] && navData[2].episode && currentEpisode !== Number(navData[2].episode)) {
                        nextButton.disabled = false;
                        nextButton.classList.remove("btn-disable");
                        nextButton.dataset.episode = navData[2].episode;
                    }
                }
            }
        });
    }
  });

  window.addEventListener("beforeunload", destroyPlayer);
  window.addEventListener("pagehide", destroyPlayer);
  window.addEventListener("popstate", destroyPlayer);
  document.addEventListener("astro:before-swap", destroyPlayer);
  prevButton.addEventListener("click", () => {
    if (!prevButton.disabled && prevButton.dataset.episode) {
        updateEpisode(prevButton.dataset.episode, episodeInput, prevButton, nextButton, currentEpButton, playerInfo, playerContainer);
    }
  });

  nextButton.addEventListener("click", () => {
    if (!nextButton.disabled && nextButton.dataset.episode) {
        updateEpisode(nextButton.dataset.episode, episodeInput, prevButton, nextButton, currentEpButton, playerInfo, playerContainer);
    }
  });
}