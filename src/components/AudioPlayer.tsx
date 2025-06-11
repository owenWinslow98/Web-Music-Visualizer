
import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';
import { forwardRef } from 'react';

export type AudioRefType = {
    getDOM: () => HTMLAudioElement | null
    addPlayCallback: (callback: () => void) => void
    removePlayCallback: (callback: () => void) => void
    isPlaying: boolean
}

let hasPlayCallback = false;

const AudioPlayer = forwardRef<AudioRefType, { audioUrl: string }>((props, ref) => {
    const { audioUrl, } = props;
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);


    useImperativeHandle(ref, () => {
        return {
            getDOM: () => audioRef.current,
            addPlayCallback: (callback: () => void) => {
                audioRef.current?.addEventListener('play', callback);
            },
            checkHasPlayCallback: () => hasPlayCallback,
            removePlayCallback: (callback: () => void) => {
                audioRef.current?.removeEventListener('play', callback);
            },
            isPlaying
        }
    })
    useEffect(() => {
        if (audioRef.current && audioUrl) {
            audioRef.current.load();

            audioRef.current.addEventListener('loadedmetadata', () => {
                setDuration(audioRef.current?.duration || 0);
            })
        }
    }, [audioUrl]);

    const togglePlay = () => {
        const player = audioRef.current
        if (player) {
            setIsPlaying(!isPlaying);
            isPlaying ? player.pause() : player.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (audioRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            const newTime = (percentage / 100) * duration;
            audioRef.current.currentTime = newTime;
            setProgress(percentage);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(currentProgress);
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const PlayIcon = ({ className = "w-12 h-12  text-[#ff4d4f] hover:text-[#ff7875]" }) => (
        <svg
            viewBox="0 0 485.74 485.74"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            fill="currentColor"
        >
            <path
                d="M242.872,0C108.732,0,0.004,108.736,0.004,242.864c0,134.14,108.728,242.876,242.868,242.876
        c134.136,0,242.864-108.736,242.864-242.876C485.736,108.736,377.008,0,242.872,0z"
            />
            <path
                d="M338.412,263.94l-134.36,92.732c-16.776,11.588-30.584,4.248-30.584-16.316V145.38
        c0-20.556,13.808-27.9,30.584-16.312l134.32,92.732C355.136,233.384,355.176,252.348,338.412,263.94z"
                fill="white"
            />
        </svg>
    )

    const PauseIcon = ({ className = "w-12 h-12 text-[#ff4d4f] hover:text-[#ff7875]" }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 60 60">
            <path d="M30,0C13.458,0,0,13.458,0,30s13.458,30,30,30s30-13.458,30-30S46.542,0,30,0z" fill="currentColor" />
            <path d="M19,14h8v32h-8V14z" fill="white" />
            <path d="M33,14h8v32h-8V14z" fill="white" />
        </svg>
    )

    /** 音量 */
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
        if (newVolume === 0) {
            setIsMuted(true);
        } else {
            setIsMuted(false);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            if (isMuted) {
                audioRef.current.volume = volume;
                setIsMuted(false);
            } else {
                audioRef.current.volume = 0;
                setIsMuted(true);
            }
        }
    };

    /** 时间 */
    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds)) return '0:00';

        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);

        return `${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    const VolumeIcon = ({ className = "w-6 h-6 text-white" }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
            {isMuted ? (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            ) : (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            )}
        </svg>
    );

    /**进度条 */
    const [isDragging, setIsDragging] = useState(false);
    const progressBarRef = useRef<HTMLDivElement>(null);
    // Add new function to update progress
    const updateProgress = (percentage: number) => {
        if (audioRef.current) {
            const newTime = (percentage / 100) * duration;
            audioRef.current.currentTime = newTime;
            setProgress(percentage);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        handleProgressClick(e);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && progressBarRef.current) {
            const rect = progressBarRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            updateProgress(Math.max(0, Math.min(100, percentage)));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };
    // Add and remove event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);
    return (
        <div className="relative w-full h-full bg-[#232323] px-4 bg-[#161616] flex items-center justify-center">
            <div className='flex items-center justify-center w-full'>
                <audio
                    ref={audioRef}
                    className="hidden"
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                />
                <div
                    className="text-4xl transition-colors w-12 h-12  z-99 rounded-full cursor-pointer relative flex items-center justify-center"
                >
                    <div className='absolute top-0 left-0 inset-0 flex items-center justify-center' onClick={togglePlay}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</div>
                </div>
                {/* 音量 */}
                <div className="flex items-center gap-2 ml-2">
                    <button onClick={toggleMute} className="p-1 hover:bg-[#333] rounded-full cursor-pointer">
                        <VolumeIcon />
                    </button>
                    <div className="relative w-16 flex items-center justify-center">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className=" w-full h-1 bg-[#ffffff] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff4d4f] relative z-10"
                        />
                        <div
                            className="absolute h-1 bg-[#ff4d4f] rounded-full pointer-events-none left-0 top-1/2 -translate-y-1/2 z-11"
                            style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                        />
                    </div>
                </div>
                {/* 时间 */}
                <div className="flex items-center gap-2 ml-2">
                    <div className="text-white">{formatTime(currentTime)}</div> /
                    <div className="text-white">{formatTime(duration)}</div>
                </div>
                {/* 进度条 */}
                <div className='h-12 flex items-center justify-center w-full cursor-pointer' onMouseDown={handleMouseDown} >
                    <div
                        ref={progressBarRef}
                        className="flex-1 rounded-full  flex items-center justify-center relative group mx-2"
                    >
                        <div className="flex-1 h-1 bg-[rgba(255,77,79,0.2)] rounded-full relative ">
                            <div
                                className="h-full bg-[#ff4d4f] rounded-full transition-all duration-100"
                                style={{ width: `${progress}%` }}
                            />
                            {/* Progress thumb */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#ff4d4f] rounded-full  duration-200"
                                style={{ left: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default AudioPlayer;