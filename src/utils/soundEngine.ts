// Web Audio API synthesizer for offline, zero-dependency audio alerts

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playPrayerSound = (type: 'adhan' | 'takbeer' | 'dawn_tone' | 'bell' | 'silent') => {
  if (type === 'silent') return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'bell') {
      // Clear pure bell chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.8);
    } else if (type === 'dawn_tone') {
      // Gentle meditative dawn chime sequence specifically tuned for serene awakening during Tahajjud
      // Gentle chord notes (F4, A4, C5, E5) spaced softly
      const freqs = [349.23, 440.0, 523.25, 659.25, 523.25];
      freqs.forEach((freq, idx) => {
        const startTime = now + idx * 0.45;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.6);
      });
    } else if (type === 'takbeer') {
      // Resonant harmonic chime (Allahu Akbar cadence)
      const notes = [
        { f: 440, dur: 0.6 },
        { f: 523.25, dur: 0.8 },
        { f: 493.88, dur: 0.5 },
        { f: 440, dur: 1.2 },
      ];

      let t = now;
      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        oscHarmonic.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t);
        oscHarmonic.frequency.setValueAtTime(note.f * 2, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur + 0.4);

        osc.connect(gain);
        oscHarmonic.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        oscHarmonic.start(t);
        osc.stop(t + note.dur + 0.5);
        oscHarmonic.stop(t + note.dur + 0.5);

        t += note.dur;
      });
    } else if (type === 'adhan') {
      // Sacred modal melody invoking traditional Adhan intervals (Bayati / Rast)
      // D4 -> G4 -> F4 -> E-half-flat -> D4 -> A4 -> G4
      const notes = [
        { f: 293.66, dur: 0.7 }, // D4
        { f: 392.00, dur: 1.1 }, // G4
        { f: 349.23, dur: 0.6 }, // F4
        { f: 329.63, dur: 0.8 }, // E4
        { f: 293.66, dur: 1.2 }, // D4
        { f: 440.00, dur: 0.8 }, // A4
        { f: 392.00, dur: 1.6 }, // G4 (reverberant resolution)
      ];

      let t = now;
      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.f, t);

        // Warm lowpass filter to produce rich spiritual breath/reed resonance
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, t);
        filter.Q.setValueAtTime(3.5, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + note.dur + 0.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + note.dur + 0.7);

        t += note.dur;
      });
    }
  } catch (err) {
    console.error('Audio playback error:', err);
  }
};
