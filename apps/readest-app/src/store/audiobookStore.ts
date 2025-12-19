import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AudioFile, AudioChapter } from '@/types/audiobook';

interface AudiobookState {
  currentBookId: string | null;
  currentFile: AudioFile | null;
  isPlaying: boolean;
  currentTime: number; // Current playback position in seconds
  duration: number; // Total duration of current file
  playbackRate: number;
  volume: number;
  chapters: AudioChapter[];
  sleepTimer: number | null; // Minutes remaining, or null if off

  // Actions
  play: (bookId: string, file: AudioFile) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setChapters: (chapters: AudioChapter[]) => void;
  setSleepTimer: (minutes: number | null) => void;
}

export const useAudiobookStore = create<AudiobookState>()(
  persist(
    (set, get) => ({
      currentBookId: null,
      currentFile: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1.0,
      volume: 1.0,
      chapters: [],
      sleepTimer: null,

      play: (bookId, file) => {
        set({
          currentBookId: bookId,
          currentFile: file,
          isPlaying: true,
          // Reset position if new book, or keep if resuming?
          // Ideally we'd load saved position from somewhere else (like progressStore)
          // For now let's assume valid state is passed or we reset if it's different.
        });
      },
      pause: () => set({ isPlaying: false }),
      resume: () => set({ isPlaying: true }),
      seek: (time) => set({ currentTime: time }),
      setRate: (rate) => set({ playbackRate: rate }),
      setVolume: (volume) => set({ volume }),
      setChapters: (chapters) => set({ chapters }),
      setSleepTimer: (minutes) => set({ sleepTimer: minutes }),
    }),
    {
      name: 'audiobook-storage',
      partialize: (state) => ({
        currentBookId: state.currentBookId,
        currentTime: state.currentTime,
        playbackRate: state.playbackRate,
        volume: state.volume,
      }),
    },
  ),
);
