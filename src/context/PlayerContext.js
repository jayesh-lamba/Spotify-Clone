import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const PlayerContext = createContext(null);

// Formats that may require specific browser support
const LIKELY_UNSUPPORTED = [".flac", ".wma", ".alac"];

function getFormatWarning(audioUrl) {
  if (!audioUrl) return null;
  const lower = audioUrl.toLowerCase();
  for (const ext of LIKELY_UNSUPPORTED) {
    if (lower.includes(ext)) {
      return `Note: FLAC/WMA format file. Standard browser MP3/AAC decoder recommended.`;
    }
  }
  return null;
}

function getApiOrigin() {
  const base = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
  return base.replace(/\/api\/?$/, "");
}

// Resolve absolute audio URL for a song
function resolveAudioUrl(song) {
  if (!song) return "";
  const id = song._id || song.id;
  const apiOrigin = getApiOrigin();
  let url = song.audioUrl || "";
  if ((!url || url.trim() === "") && id && String(id).length === 24) {
    url = `${apiOrigin}/api/songs/${id}/stream`;
  } else if (url.startsWith("/")) {
    url = `${apiOrigin}${url}`;
  }
  return url;
}

// Shuffle helper using Fisher-Yates
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function PlayerProvider({ children }) {
  const { user } = useAuth();

  const [currentSong, setCurrentSong] = useState({
    title: "ORIVIO",
    artistName: "Select a song to play",
    albumName: "ORIVIO Music",
    coverImage: "https://4kwallpapers.com/images/walls/thumbs_3t/25406.jpg",
    duration: "0:00",
    durationSeconds: 0,
    audioUrl: "",
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMessage, setPlaybackMessage] = useState("");
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [originalQueue, setOriginalQueue] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);

  // Initialize sensible volume (default 0.8 / 80%)
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off"); // 'off' | 'all' | 'one'
  const [isExpanded, setIsExpanded] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Sleep timer
  const [sleepTimer, setSleepTimerValue] = useState(null);
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState(0);
  const sleepTimerRef = useRef(null);

  // Single HTMLAudioElement instance with crossOrigin anonymous for Web Audio API & CORS
  const audioRef = useRef(null);
  if (!audioRef.current) {
    const a = new Audio();
    a.crossOrigin = "anonymous";
    a.preload = "auto";
    audioRef.current = a;
  }

  const fadeIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  // Initialize Web Audio API node tree (source -> analyser -> destination)
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      analyserRef.current = analyser;

      if (audioRef.current) {
        audioRef.current.crossOrigin = "anonymous";
        const source = ctx.createMediaElementSource(audioRef.current);
        sourceRef.current = source;
        source.connect(analyser);
        analyser.connect(ctx.destination);
      }
    } catch (e) {
      console.warn("[ORIVIO Web Audio Note]", e.message);
    }
  }, []);

  const resumeAudioContext = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  // Sync volume and muted properties directly to HTMLAudioElement
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = isMuted;
    audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume));
  }, [volume, isMuted]);

  // Sleep timer countdown
  useEffect(() => {
    if (!sleepTimer || sleepTimer === "end_of_song") return;

    const totalSeconds = sleepTimer * 60;
    setSleepRemainingSeconds(totalSeconds);

    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    sleepTimerRef.current = setInterval(() => {
      setSleepRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(sleepTimerRef.current);
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
          setSleepTimerValue(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [sleepTimer]);

  const setSleepTimer = useCallback((value) => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    if (!value || value === "off") {
      setSleepTimerValue(null);
      setSleepRemainingSeconds(0);
    } else {
      setSleepTimerValue(value);
    }
  }, []);

  // Main playSong method
  const playSong = useCallback(async (song, playlistQueue = []) => {
    if (!song) return;

    const songId = song._id || song.id;
    const resolvedAudioUrl = resolveAudioUrl(song);
    const activeSong = { ...song, audioUrl: resolvedAudioUrl };

    setCurrentSong(activeSong);
    setCurrentTime(0);
    setPlaybackMessage("");

    if (playlistQueue.length > 0) {
      const resolvedQueue = playlistQueue.map((s) => ({ ...s, audioUrl: resolveAudioUrl(s) }));
      const idx = resolvedQueue.findIndex((s) => (s._id || s.id) === songId);

      if (isShuffle) {
        const rest = resolvedQueue.filter((s) => (s._id || s.id) !== songId);
        const shuffled = shuffleArray(rest);
        const newQueue = [{ ...resolvedQueue[idx >= 0 ? idx : 0] }, ...shuffled];
        setOriginalQueue(resolvedQueue);
        setQueue(newQueue);
        setQueueIndex(0);
      } else {
        setOriginalQueue(resolvedQueue);
        setQueue(resolvedQueue);
        setQueueIndex(idx >= 0 ? idx : 0);
      }
    }

    // Track play & recently played
    const isPrivate = user?.settings?.privateSession;
    if (!isPrivate && songId && typeof songId === "string" && songId.length === 24) {
      try {
        api.trackPlay(songId).catch(() => {});
        const token = localStorage.getItem("token");
        if (token) api.recordRecentlyPlayed(songId).catch(() => {});
      } catch (_) {}
    }

    if (!resolvedAudioUrl || resolvedAudioUrl.trim() === "") {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setPlaybackMessage(`No audio file URL available for "${song.title || "this song"}"`);
      return;
    }

    const formatWarning = getFormatWarning(resolvedAudioUrl);

    try {
      const audio = audioRef.current;
      audio.pause();
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

      audio.crossOrigin = "anonymous";
      audio.src = resolvedAudioUrl;
      audio.load();

      const isCrossfade = user?.settings?.crossfade;
      if (isCrossfade) {
        audio.volume = 0;
      } else {
        audio.muted = isMuted;
        audio.volume = isMuted ? 0 : volume;
      }

      // Initialize / resume Web Audio API
      initAudioContext();
      resumeAudioContext();

      await audio.play();
      setIsPlaying(true);

      // Log audio pipeline debug details
      console.log("[ORIVIO Audio Pipeline Debug]", {
        Song: activeSong.title,
        Artist: activeSong.artistName,
        AudioURL: resolvedAudioUrl,
        Volume: audio.volume,
        Muted: audio.muted,
        Paused: audio.paused,
        ReadyState: audio.readyState,
        Duration: audio.duration,
        CurrentTime: audio.currentTime,
        AudioContextState: audioContextRef.current?.state || "N/A"
      });

      if (isCrossfade) {
        let currentVol = 0;
        const targetVol = isMuted ? 0 : volume;
        const step = Math.max(targetVol / 12, 0.01);
        fadeIntervalRef.current = setInterval(() => {
          currentVol = Math.min(currentVol + step, targetVol);
          audio.volume = currentVol;
          if (currentVol >= targetVol) clearInterval(fadeIntervalRef.current);
        }, 100);
      }

      if (formatWarning) setPlaybackMessage(formatWarning);
    } catch (err) {
      console.error("[ORIVIO Playback Error]", {
        songId,
        title: song.title,
        errorName: err.name,
        errorMessage: err.message,
      });
      setIsPlaying(false);
      if (err.name === "NotSupportedError") {
        setPlaybackMessage(formatWarning || `Audio format unsupported by browser.`);
      } else if (err.name === "NotAllowedError") {
        setPlaybackMessage("Click play button to initiate audio playback.");
      } else {
        setPlaybackMessage(`Playback error: ${err.message}`);
      }
    }
  }, [user?.settings?.privateSession, user?.settings?.crossfade, volume, isMuted, isShuffle, initAudioContext, resumeAudioContext]);

  const playNext = useCallback(async () => {
    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      return;
    }

    if (queue.length > 0 && queueIndex + 1 < queue.length) {
      const nextIdx = queueIndex + 1;
      setQueueIndex(nextIdx);
      playSong(queue[nextIdx], queue);
    } else {
      if (repeatMode === "all" && queue.length > 0) {
        setQueueIndex(0);
        playSong(queue[0], queue);
      } else {
        const isAutoplay = user?.settings?.autoplay !== false;
        if (isAutoplay) {
          try {
            const res = await api.getSongs({ limit: 50 });
            if (res?.data?.length) {
              const available = res.data.filter((s) => (s._id || s.id) !== (currentSong._id || currentSong.id));
              if (available.length) {
                const randomNext = available[Math.floor(Math.random() * available.length)];
                const newQueue = [...queue, randomNext];
                setQueue(newQueue);
                setQueueIndex(newQueue.length - 1);
                playSong(randomNext, newQueue);
              }
            }
          } catch (_) {}
        } else {
          setIsPlaying(false);
        }
      }
    }
  }, [queue, queueIndex, playSong, currentSong, user?.settings?.autoplay, repeatMode]);

  const playPrevious = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    if (queue.length > 0 && queueIndex - 1 >= 0) {
      const prevIdx = queueIndex - 1;
      setQueueIndex(prevIdx);
      playSong(queue[prevIdx], queue);
    }
  }, [queue, queueIndex, playSong]);

  const addToQueue = useCallback((songs) => {
    const songsArr = Array.isArray(songs) ? songs : [songs];
    const resolved = songsArr.map((s) => ({ ...s, audioUrl: resolveAudioUrl(s) }));
    setQueue((prev) => [...prev, ...resolved]);
    setOriginalQueue((prev) => [...prev, ...resolved]);
  }, []);

  const removeFromQueue = useCallback((index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    setQueueIndex((prev) => (index < prev ? prev - 1 : prev));
  }, []);

  const reorderQueue = useCallback((fromIndex, toIndex) => {
    setQueue((prev) => {
      const newQueue = [...prev];
      const [moved] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, moved);
      return newQueue;
    });
    setQueueIndex((prev) => {
      if (prev === fromIndex) return toIndex;
      if (fromIndex < prev && toIndex >= prev) return prev - 1;
      if (fromIndex > prev && toIndex <= prev) return prev + 1;
      return prev;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setOriginalQueue([]);
    setQueueIndex(-1);
  }, []);

  const playQueueItem = useCallback((index) => {
    if (index >= 0 && index < queue.length) {
      setQueueIndex(index);
      playSong(queue[index], queue);
    }
  }, [queue, playSong]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const newShuffle = !prev;
      if (newShuffle) {
        const currentItem = queue[queueIndex];
        const rest = queue.filter((_, i) => i !== queueIndex);
        const shuffled = shuffleArray(rest);
        const newQueue = currentItem ? [currentItem, ...shuffled] : shuffled;
        setOriginalQueue(queue);
        setQueue(newQueue);
        setQueueIndex(0);
      } else {
        if (originalQueue.length > 0) {
          const currentItem = queue[queueIndex];
          const currentId = currentItem ? (currentItem._id || currentItem.id) : null;
          const origIdx = originalQueue.findIndex((s) => (s._id || s.id) === currentId);
          setQueue(originalQueue);
          setQueueIndex(origIdx >= 0 ? origIdx : queueIndex);
        }
      }
      return newShuffle;
    });
  }, [queue, queueIndex, originalQueue]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
    initAudioContext();
    resumeAudioContext();
  }, [initAudioContext, resumeAudioContext]);

  // Handle standard audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      if (sleepTimer === "end_of_song") {
        setIsPlaying(false);
        setSleepTimerValue(null);
        return;
      }
      setIsPlaying(false);
      playNext();
    };
    const handleError = () => {
      setIsPlaying(false);
      const src = audio.src || "";
      const formatWarning = getFormatWarning(src);
      setPlaybackMessage(
        formatWarning ||
        "Audio playback error. Please verify the audio file exists on disk."
      );
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [playNext, sleepTimer]);

  const togglePlayPause = useCallback(() => {
    if (!currentSong) return;

    if (!currentSong.audioUrl || currentSong.audioUrl.trim() === "") {
      setPlaybackMessage(`No audio available for "${currentSong.title || "this song"}"`);
      setIsPlaying(false);
      return;
    }

    resumeAudioContext();

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          setIsPlaying(false);
          setPlaybackMessage(`Playback failed: ${err.message}`);
        });
    }
  }, [currentSong, isPlaying, resumeAudioContext]);

  const seek = useCallback((timeSeconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeSeconds;
      setCurrentTime(timeSeconds);
    }
  }, []);

  const seekByPercent = useCallback((percent) => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (dur && !isNaN(dur)) {
        audioRef.current.currentTime = (percent / 100) * dur;
      }
    }
  }, []);

  const setVolumeLevel = useCallback((level) => {
    const clamped = Math.max(0, Math.min(1, level));
    setVolume(clamped);
    if (clamped > 0) setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = false;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (newMuted) {
        setPrevVolume(volume);
        if (audioRef.current) {
          audioRef.current.muted = true;
          audioRef.current.volume = 0;
        }
      } else {
        const restoreVol = prevVolume > 0 ? prevVolume : 0.8;
        setVolume(restoreVol);
        if (audioRef.current) {
          audioRef.current.muted = false;
          audioRef.current.volume = restoreVol;
        }
      }
      return newMuted;
    });
  }, [volume, prevVolume]);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        playbackMessage,
        currentTime,
        duration,
        volume,
        isMuted,
        queue,
        queueIndex,
        originalQueue,
        isShuffle,
        repeatMode,
        isExpanded,
        isQueueOpen,
        sleepTimer,
        sleepRemainingSeconds,
        analyserRef,
        audioRef,
        playSong,
        togglePlayPause,
        playNext,
        playPrevious,
        seek,
        seekByPercent,
        setVolume: setVolumeLevel,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        toggleExpanded,
        setIsExpanded,
        setIsQueueOpen,
        addToQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        playQueueItem,
        setSleepTimer,
        setPlaybackMessage,
        initAudioContext,
        resumeAudioContext,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export default PlayerProvider;

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
