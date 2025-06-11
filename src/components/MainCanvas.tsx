import { useEffect, useRef, useState, useCallback } from 'react';
import { useFormContext } from '../context/formContext';
import AudioPlayer from './AudioPlayer';
import { Form } from 'antd';
import {
    Sprite,
    Assets,
    Graphics,
    Ticker,
    Text
} from 'pixi.js';
import type { Application } from 'pixi.js';
import { initPixi, backgroundSprite, majorSprite, audioVisualizerSprite, audioText as audioTextAttributes, bubblesTexture } from './PixiCanvas';
import type { spriteAttributes, spriteMap } from './PixiCanvas';
import type { AudioRefType } from './AudioPlayer';
import { Emitter } from '@barvynkoa/particle-emitter'
import { analyzeAudio } from '../utils';
const remToPx = (rem: number) => {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function getTailwindRemToPx(size: number): number {
    const spacingValue = getComputedStyle(document.documentElement).getPropertyValue('--spacing').trim(); // e.g. "0.25rem"
    return remToPx(parseFloat(spacingValue) * size);
}

const SIDEBAR_WIDTH = 350;
const PADDING_WIDTH = getTailwindRemToPx(4) * 2;
const MIN_WIDTH = 1440 - SIDEBAR_WIDTH - getTailwindRemToPx(1) - PADDING_WIDTH;

const VISUALIZER_HEIGHT = 50
const MIN_DB = -60
const MAX_DB = 0

const dBToHeight = (dB: number) => {
    const clamped = Math.max(MIN_DB, Math.min(MAX_DB, dB));
    const norm = (clamped - MIN_DB) / (MAX_DB - MIN_DB); // 映射到 0~1
    // const curved = Math.pow(norm, 2); // 或 1.5、2、3，调整视觉感知
    return norm * VISUALIZER_HEIGHT;
}

let smoothHeights = new Array(48).fill(0);
let smoothedEnergy = 0; // 全局能量缓动值
let energyPulse = 0;
function lerpColor(c1: number, c2: number, t: number): number {
    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;

    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
}
const MainCanvas = () => {
    const { form } = useFormContext();
    const audioUrl = Form.useWatch('audioUrl', form);

    const audioRef = useRef<AudioRefType>(null);

    const pixiApp = useRef<{ app: Application, spriteMap: spriteMap }>(null)
    const [pixiAppReady, setPixiAppReady] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [canvasWidth, setCanvasWidth] = useState(MIN_WIDTH);

    const pixiCanvasRef = useRef<HTMLCanvasElement>(null)

    const audioContext = useRef<AudioContext | null>(null);
    const audioSource = useRef<MediaElementAudioSourceNode | null>(null);
    const analyser = useRef<AnalyserNode | null>(null);

    const widthRef = useRef(canvasWidth);

    useEffect(() => {
        (async () => {
            const updateDimensions = () => {
                const { innerWidth } = window;
                const containerWidth = innerWidth - SIDEBAR_WIDTH - getTailwindRemToPx(1) - PADDING_WIDTH;
                const newWidth = containerWidth <= MIN_WIDTH ? MIN_WIDTH :
                    containerWidth >= 1920 ? 1920 :
                        containerWidth;
                setCanvasWidth(newWidth)

            };
            // Initial size
            updateDimensions();

            window.addEventListener('resize', updateDimensions);
            pixiApp.current = await initPixi(pixiCanvasRef.current as HTMLCanvasElement, containerRef.current as HTMLElement);
            setPixiAppReady(true);
            resizeCanvasEl();
            resizeEmitter();
            // resizeAudioText();

            const ticker = pixiApp.current?.app.ticker;
            const emitter = pixiApp.current?.spriteMap.get('emitter') as Emitter;
            ticker.add(() => {
                if (!audioRef.current?.isPlaying) return;
                emitter.update(1 / 60);
            })
            // 初始化音频上下文
            if (!audioContext.current) audioContext.current = new AudioContext();
            if (!analyser.current) analyser.current = audioContext.current.createAnalyser();
            const audioElement = audioRef.current?.getDOM();
            if (!audioSource.current) audioSource.current = audioContext.current.createMediaElementSource(audioElement as HTMLAudioElement);

            // 建立正确的音频连接链
            if (audioSource.current) audioSource.current.connect(analyser.current);
            if (analyser.current) analyser.current.connect(audioContext.current.destination);

            const audioPlayCallback = () => {
                if (audioContext.current?.state === 'suspended') {
                    audioContext.current?.resume();
                }
            }
            audioRef.current?.addPlayCallback(audioPlayCallback)


            return () => {
                window.removeEventListener('resize', updateDimensions);
                audioRef.current?.removePlayCallback(audioPlayCallback);
                pixiApp.current?.app.destroy();
                pixiApp.current = null;
            };
        })()
    }, []);

    const backgroundImg = Form.useWatch('backgroundImg', form);
    const majorUrl = Form.useWatch('majorImg', form);

    useEffect(() => {
        if (backgroundImg && pixiApp.current) {
            const { spriteMap } = pixiApp.current
            const background = spriteMap.get('background') as Sprite
            Assets.load(backgroundImg).then((result) => {
                background.texture = result
            })
        }
    }, [backgroundImg, pixiAppReady])

    useEffect(() => {
        if (majorUrl && pixiApp.current) {
            const { spriteMap } = pixiApp.current
            const major = spriteMap.get('major') as Sprite
            Assets.load(majorUrl).then((result) => {
                major.texture = result
            })
        }
    }, [majorUrl, pixiAppReady])

    const songName = Form.useWatch('songName', form);
    const authorName = Form.useWatch('author', form);

    useEffect(() => {
        if (pixiApp.current) {
            const { spriteMap } = pixiApp.current
            const audioText = spriteMap.get('audioText') as Text
            const str = `${songName} - ${authorName}`
            audioText.text = str;
            resizeAudioText();
        }
    }, [songName, authorName, pixiAppReady])


    const spriteResize = useCallback((canvasWidth: number, sprite: Sprite, attributes: spriteAttributes) => {
        const { xPercent, yPercent, widthPercent, heightPercent } = attributes;
        sprite.x = canvasWidth * xPercent;     // xPercent: 0.0 ~ 1.0
        sprite.y = canvasWidth * yPercent;
        sprite.width = canvasWidth * widthPercent;
        sprite.height = canvasWidth * heightPercent;
    }, [])

    const tickerEventTemp = useRef<() => void | null>(null);
    const resizeCanvasEl = useCallback(() => {
        if (pixiApp.current) {
            const { spriteMap } = pixiApp.current as { spriteMap: spriteMap }
            const background = spriteMap.get('background') as Sprite
            const major = spriteMap.get('major') as Sprite
            const width = widthRef.current;
            spriteResize(width, background, backgroundSprite)
            spriteResize(width, major, majorSprite)
            // major resize
            const { xPercent, yPercent, widthPercent, heightPercent } = majorSprite;
            const centerX = (xPercent + widthPercent / 2) * width;
            const centerY = (yPercent + heightPercent / 2) * width;
            const radius = (widthPercent / 2) * width;

            const majorMask = spriteMap.get('majorMask') as Graphics;
            majorMask.clear();
            majorMask.fill()
                .circle(centerX, centerY, radius)
                .fill();
            major.mask = majorMask;

            // 设置分析器参数
            if (!analyser.current) return;
            analyser.current.fftSize = 128;
            const bufferLength = analyser.current.frequencyBinCount;
            const dataArray = new Float32Array(bufferLength);
            const ticker = spriteMap.get('ticker') as Ticker;

            if (tickerEventTemp.current) {
                ticker.remove(tickerEventTemp.current);
            }
            const callback = () => {
                if (!audioRef.current?.isPlaying) return;
            
                analyser.current?.getFloatFrequencyData(dataArray);
            
                const audioVisualizer = spriteMap.get('audioVisualizer') as Graphics;
                audioVisualizer.clear();
            
                const { xPercent, yPercent, widthPercent } = audioVisualizerSprite;
                const centerX = xPercent * width;
                const centerY = yPercent * width;
                const baseRadius = widthPercent * width;
            
                const numBars = 48;
                const binsPerBar = Math.floor(bufferLength / numBars);
                const angleStep = (Math.PI * 2) / numBars;
            
                // 1. 计算频谱能量平均值（用于整体放大）
                let totalEnergy = 0;
                for (let i = 0; i < bufferLength; i++) {
                    totalEnergy += Math.max(0, dataArray[i] + 100); // [-100,0] → [0,100]
                }
                const avgEnergy = totalEnergy / bufferLength / 100; // 归一化 [0,1]
                smoothedEnergy += (avgEnergy - smoothedEnergy) * 0.05;
                const dynamicRadius = baseRadius * (1 + smoothedEnergy * 0.4); // 外扩系数最多+40%
            
                for (let i = 0; i < numBars; i++) {
                    // 2. 频段平均值
                    let sum = 0;
                    for (let j = 0; j < binsPerBar; j++) {
                        const index = i * binsPerBar + j;
                        sum += dataArray[index];
                    }
                    const avgDb = sum / binsPerBar;
                    const norm = Math.max(0, (avgDb + 100) / 100); // 映射到 [0,1]
                    const targetHeight = Math.pow(norm, 1.5) * baseRadius * 0.7;
            
                    // 3. 平滑柱高
                    smoothHeights[i] += (targetHeight - smoothHeights[i]) * 0.2;
            
                    // 4. 极坐标位置计算
                    const angle = i * angleStep;
                    const innerX = centerX + Math.cos(angle) * dynamicRadius;
                    const innerY = centerY + Math.sin(angle) * dynamicRadius;
                    const outerX = centerX + Math.cos(angle) * (dynamicRadius + smoothHeights[i]);
                    const outerY = centerY + Math.sin(angle) * (dynamicRadius + smoothHeights[i]);
            
                    // 5. 颜色渐变（蓝 → 红）
                    const color = lerpColor(0x00cfff, 0xff0055, i / numBars);
            
                    // 6. 绘制柱子
                    audioVisualizer.setStrokeStyle({ width: 2.2, color });
                    audioVisualizer.moveTo(innerX, innerY);
                    audioVisualizer.lineTo(outerX, outerY);
                    audioVisualizer.stroke();
                }
            };
            tickerEventTemp.current = callback;
            ticker.add(callback);
        }
    }, [])

    const resizeEmitter = useCallback(() => {
        if (pixiApp.current) {
            const { spriteMap } = pixiApp.current as { spriteMap: spriteMap }
            const width = widthRef.current;
            const emitter = spriteMap.get('emitter') as Emitter;
            const {xPercent, yPercent} = bubblesTexture;
            emitter.updateOwnerPos(width * xPercent, width * yPercent);
            // emitter.updateSpawnPos(-width / 4, 0);
            const spawnBehavior = emitter.getBehavior('spawnShape');
            if (spawnBehavior) {
                const spawn = spawnBehavior as unknown as { shape: { w: number, x: number } };
                spawn.shape.w = width;
            }
            const scaleBehavior = emitter.getBehavior('scale');
            if (scaleBehavior) {
                const scale = scaleBehavior as unknown as { minMult: number }
                scale.minMult = width / 1920;
            }
        }
    }, [])

    const resizeAudioText = useCallback(() => {
        if (pixiApp.current) {
            const { spriteMap } = pixiApp.current as { spriteMap: spriteMap }
            const audioText = spriteMap.get('audioText') as Text
            const width = widthRef.current;
            const { xPercent, yPercent } = audioTextAttributes;
            audioText.y = width * yPercent;
            audioText.x = width * xPercent - audioText.width / 2;
        }
    }, [])
    useEffect(() => {
        widthRef.current = canvasWidth;
        resizeCanvasEl();
        resizeEmitter();
        resizeAudioText();
    }, [canvasWidth])


    return (
        <div className='flex flex-col text-[#fafafa] h-full'>
            <div className='flex-1 bg-[#232323] mb-1 relative w-full flex items-center justify-center px-4' >
                {
                    (<div className='aspect-[16/9] w-full' style={{ width: `${canvasWidth}px`, height: `${canvasWidth * 9 / 16}px` }} ref={containerRef}>
                        <canvas id='pixi-canvas' ref={pixiCanvasRef} />
                    </div>
                    )}
            </div>
            <div className='h-[64px]'>
                <AudioPlayer audioUrl={audioUrl} ref={audioRef} />
            </div>
        </div>
    );
};

export default MainCanvas