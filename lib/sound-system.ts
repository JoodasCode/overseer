// Sound System for AGENTS OS Portal
// Provides subtle audio feedback for user interactions

class SoundSystem {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAudioContext();
    }
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
      this.enabled = false;
    }
  }

  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext || !this.enabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Agent interaction sounds
  agentActivated() {
    this.createTone(523.25, 0.2); // C5 note
    setTimeout(() => this.createTone(659.25, 0.15), 100); // E5 note
  }

  agentMessage() {
    this.createTone(440, 0.1); // A4 note - subtle notification
  }

  agentError() {
    this.createTone(220, 0.3, 'sawtooth'); // Lower, more attention-grabbing
  }

  // UI interaction sounds
  buttonClick() {
    this.createTone(800, 0.05); // Quick, high click
  }

  buttonHover() {
    this.createTone(600, 0.03); // Very subtle hover
  }

  modalOpen() {
    this.createTone(523.25, 0.1);
    setTimeout(() => this.createTone(659.25, 0.1), 50);
  }

  modalClose() {
    this.createTone(659.25, 0.1);
    setTimeout(() => this.createTone(523.25, 0.1), 50);
  }

  // Success and completion sounds
  taskCompleted() {
    // Ascending triad for success
    this.createTone(523.25, 0.15); // C5
    setTimeout(() => this.createTone(659.25, 0.15), 100); // E5
    setTimeout(() => this.createTone(783.99, 0.2), 200); // G5
  }

  levelUp() {
    // Celebratory ascending scale
    const notes = [523.25, 587.33, 659.25, 698.46, 783.99]; // C5 to G5
    notes.forEach((note, index) => {
      setTimeout(() => this.createTone(note, 0.2), index * 100);
    });
  }

  // Notification sounds
  needsAttention() {
    this.createTone(880, 0.1); // A5 - attention grabbing but not annoying
    setTimeout(() => this.createTone(880, 0.1), 200);
  }

  newActivity() {
    this.createTone(1046.5, 0.08); // C6 - high, brief notification
  }

  // Settings
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isEnabled() {
    return this.enabled;
  }
}

// Global sound system instance
export const soundSystem = new SoundSystem();

// React hook for sound system
export function useSoundSystem() {
  return {
    playAgentActivated: () => soundSystem.agentActivated(),
    playAgentMessage: () => soundSystem.agentMessage(),
    playAgentError: () => soundSystem.agentError(),
    playButtonClick: () => soundSystem.buttonClick(),
    playButtonHover: () => soundSystem.buttonHover(),
    playModalOpen: () => soundSystem.modalOpen(),
    playModalClose: () => soundSystem.modalClose(),
    playTaskCompleted: () => soundSystem.taskCompleted(),
    playLevelUp: () => soundSystem.levelUp(),
    playNeedsAttention: () => soundSystem.needsAttention(),
    playNewActivity: () => soundSystem.newActivity(),
    setEnabled: (enabled: boolean) => soundSystem.setEnabled(enabled),
    setVolume: (volume: number) => soundSystem.setVolume(volume),
    isEnabled: () => soundSystem.isEnabled()
  };
} 