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

const BEEP_URL = "/sounds/notification.wav"

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

  // Prime HTML5 audio with notification sound (for mute switch bypass)
  htmlAudio = new Audio(BEEP_URL)
  htmlAudio.volume = 0.5
  htmlAudio.load()
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
