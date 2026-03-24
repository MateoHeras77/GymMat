/**
 * Audio manager for iOS-compatible timer beep.
 *
 * iOS restrictions:
 * - AudioContext must be created/resumed from a user gesture (tap/click)
 * - iOS limits to 4 AudioContexts total — use singleton
 * - iOS mute switch silences Web Audio (ringer channel) but HTML5 <audio> plays through media channel
 *
 * Strategy: Singleton AudioContext unlocked on first touch + HTML5 <audio> fallback for mute switch bypass.
 */

// Base64-encoded 0.15s 880Hz beep WAV (~7KB)
const BEEP_DATA_URI =
  "data:audio/wav;base64,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"

let audioCtx: AudioContext | null = null
let htmlAudio: HTMLAudioElement | null = null
let unlocked = false

function getContext(): AudioContext {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new Ctx()
  }
  return audioCtx
}

/**
 * Must be called from a user gesture (tap/click) to unlock iOS audio.
 * Safe to call multiple times — only runs once.
 */
export function unlockAudio(): void {
  if (unlocked) return
  unlocked = true

  // Unlock AudioContext
  const ctx = getContext()
  if (ctx.state === "suspended") ctx.resume()

  // Play silent buffer to warm up iOS audio pipeline
  const buffer = ctx.createBuffer(1, 1, 22050)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start(0)

  // Prime HTML5 audio (for mute switch bypass)
  htmlAudio = new Audio(BEEP_DATA_URI)
  htmlAudio.volume = 0.5
  htmlAudio.play().then(() => {
    htmlAudio!.pause()
    htmlAudio!.currentTime = 0
  }).catch(() => {
    // Expected to fail silently on some browsers — priming attempt only
  })
}

/**
 * Play timer beep. Uses Web Audio + HTML5 audio fallback.
 * Works on iOS with mute switch, through earbuds/bluetooth.
 */
export function playTimerBeep(): void {
  // Web Audio beep (may be muted by iOS ringer switch)
  try {
    const ctx = getContext()
    if (ctx.state === "suspended") ctx.resume()

    const playTone = (time: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      osc.type = "sine"
      gain.gain.setValueAtTime(0.3, time)
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15)
      osc.start(time)
      osc.stop(time + 0.15)
    }
    playTone(ctx.currentTime)
    playTone(ctx.currentTime + 0.25)
  } catch {
    // AudioContext not available
  }

  // HTML5 audio fallback (bypasses iOS mute switch)
  if (htmlAudio) {
    htmlAudio.currentTime = 0
    htmlAudio.play().catch(() => {})
  }
}
