import React, { useRef, useEffect } from 'react';
import { useAudiobookStore } from '@/store/audiobookStore';
import { MdPlayArrow, MdPause, MdForward30, MdReplay30 } from 'react-icons/md';
import { convertFileSrc } from '@tauri-apps/api/core';

const AudioPlayer: React.FC = () => {
  const { currentFile, isPlaying, currentTime, playbackRate, volume, resume, pause, seek } =
    useAudiobookStore();

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => console.error('Playback failed', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      useAudiobookStore.getState().seek(audioRef.current.currentTime);
    }
  };

  if (!currentFile) return null;

  const src = convertFileSrc(currentFile.path);

  return (
    <div className='bg-base-100 border-base-300 fixed bottom-0 left-0 right-0 z-50 border-t p-4 shadow-lg'>
      <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onEnded={pause} />

      <div className='flex flex-col items-center gap-2'>
        <div className='text-sm font-semibold'>{currentFile.name}</div>

        <div className='flex items-center gap-4'>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime -= 30;
            }}
          >
            <MdReplay30 size={30} />
          </button>
          <button className='btn btn-circle btn-primary' onClick={isPlaying ? pause : resume}>
            {isPlaying ? <MdPause size={30} /> : <MdPlayArrow size={30} />}
          </button>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime += 30;
            }}
          >
            <MdForward30 size={30} />
          </button>
        </div>

        <div className='mt-2 flex items-center gap-4 text-xs'>
          <div className='dropdown dropdown-top'>
            <div tabIndex={0} role='button' className='btn btn-xs btn-ghost'>
              {playbackRate}x
            </div>
            <ul
              tabIndex={0}
              className='dropdown-content menu bg-base-100 rounded-box z-[1] w-20 p-2 shadow'
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <li key={rate}>
                  <button
                    onClick={() => useAudiobookStore.getState().setRate(rate)}
                    className={rate === playbackRate ? 'active' : ''}
                  >
                    {rate}x
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className='dropdown dropdown-top dropdown-end'>
            <div tabIndex={0} role='button' className='btn btn-xs btn-ghost'>
              Zzz
            </div>
            <ul
              tabIndex={0}
              className='dropdown-content menu bg-base-100 rounded-box z-[1] w-32 p-2 shadow'
            >
              <li>
                <button onClick={() => useAudiobookStore.getState().setSleepTimer(15)}>
                  15 min
                </button>
              </li>
              <li>
                <button onClick={() => useAudiobookStore.getState().setSleepTimer(30)}>
                  30 min
                </button>
              </li>
              <li>
                <button onClick={() => useAudiobookStore.getState().setSleepTimer(45)}>
                  45 min
                </button>
              </li>
              <li>
                <button onClick={() => useAudiobookStore.getState().setSleepTimer(60)}>
                  60 min
                </button>
              </li>
              <li>
                <button onClick={() => useAudiobookStore.getState().setSleepTimer(null)}>
                  Off
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className='flex w-full max-w-md items-center gap-2 text-xs'>
          <span>{formatTime(currentTime)}</span>
          <input
            type='range'
            min={0}
            max={currentFile.duration || 100} // duration might be unknown initially
            value={currentTime}
            onChange={(e) => {
              const time = Number(e.target.value);
              if (audioRef.current) audioRef.current.currentTime = time;
              seek(time);
            }}
            className='range range-xs range-primary'
          />
          <span>{formatTime(currentFile.duration || 0)}</span>
        </div>
      </div>
    </div>
  );
};

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default AudioPlayer;
