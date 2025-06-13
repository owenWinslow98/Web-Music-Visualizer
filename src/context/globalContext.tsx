import React, { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { Application } from 'pixi.js';
import type { spriteMap } from '../components/PixiCanvas';
interface GlobalContextType {
    pixiApp: React.RefObject<{ app: Application, spriteMap: spriteMap } | null>;
    volume: number;
    setVolume: (value: number) => void;
    isPlaying: boolean;
    setIsPlaying: (value: boolean) => void;
    gainNode: React.RefObject<GainNode | null>;
    audioContext: React.RefObject<AudioContext | null>;
    audioSource: React.RefObject<MediaElementAudioSourceNode | null>;
    analyser: React.RefObject<AnalyserNode | null>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
    const pixiApp = useRef<{ app: Application, spriteMap: spriteMap } | null>(null);
    const [volume, setVolume] = useState(0.5);
    const gainNode = useRef<GainNode | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContext = useRef<AudioContext | null>(null);
    const audioSource = useRef<MediaElementAudioSourceNode | null>(null);
    const analyser = useRef<AnalyserNode | null>(null);
    return (
        <GlobalContext.Provider value={{
            pixiApp,
            volume,
            setVolume,
            isPlaying,
            setIsPlaying,
            gainNode,
            audioContext,
            audioSource,
            analyser
        }}>
            {children}
        </GlobalContext.Provider>
    );
}

export function useGlobal() {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
}