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
import { initPixi, backgroundSprite, majorSprite, audioTextSprite, audioVisualizerSprite, DustParticle } from './PixiCanvas';
import type { spriteMap } from './PixiCanvas';
import type { AudioRefType } from './AudioPlayer';
import { mean } from 'lodash';
import { useGlobal } from '../context/globalContext';
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

let smoothHeights = new Array(48).fill(0);
let smoothedEnergy = 0; // 全局能量缓动值
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
    const { pixiApp, gainNode, audioContext, audioSource, analyser } = useGlobal();
    const audioRef = useRef<AudioRefType>(null);

    const [pixiAppReady, setPixiAppReady] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [canvasWidth, setCanvasWidth] = useState(MIN_WIDTH);
    const pixiCanvasRef = useRef<HTMLCanvasElement>(null);
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
            pixiApp.current = await initPixi(pixiCanvasRef.current as HTMLCanvasElement);
            setPixiAppReady(true);

            const ticker = pixiApp.current?.app.ticker;
            const dustList = pixiApp.current?.spriteMap.get('dustList') as DustParticle[]
            ticker.add(() => {
                if (!audioRef.current?.isPlaying) return;
                dustList.forEach(item => item.update())
            })
            // 初始化音频上下文
            if (!audioContext.current) audioContext.current = new AudioContext();
            if (!analyser.current) analyser.current = audioContext.current.createAnalyser();
            const audioElement = audioRef.current?.getDOM();
            if (!audioSource.current) audioSource.current = audioContext.current.createMediaElementSource(audioElement as HTMLAudioElement);
            if(!gainNode.current) gainNode.current = audioContext.current.createGain();
            gainNode.current.gain.value = 0.5;
            // 建立正确的音频连接链
            if (audioSource.current) audioSource.current.connect(analyser.current);
            if (analyser.current) analyser.current.connect(gainNode.current);
            if (gainNode.current) gainNode.current.connect(audioContext.current.destination);
            
            
            const audioPlayCallback = () => {
                if (audioContext.current?.state === 'suspended') {
                    audioContext.current?.resume();
                }
            }
            audioRef.current?.addPlayCallback(audioPlayCallback)
            drawVisualizer();
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
            Assets.load({
                src: backgroundImg,
                loadParser: 'loadTextures',
            }).then((result) => {
                background.texture = result
                const { width, height } = backgroundSprite
                background.width = width
                background.height = height
            })
        }
    }, [backgroundImg, pixiAppReady])

    useEffect(() => {
        if (majorUrl && pixiApp.current) {
            const { spriteMap } = pixiApp.current
            const major = spriteMap.get('major') as Sprite
            Assets.load(majorUrl).then((result) => {
                major.texture = result
                Object.assign(major, majorSprite)
                const majorMask = spriteMap.get('majorMask') as Graphics
                majorMask.clear()
                majorMask.fill()
                    .circle(major.x + major.width / 2, major.y + major.height / 2, major.width / 2)
                    .fill()
                major.mask = majorMask
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
            const { x, y } = audioTextSprite;
            audioText.y = y;
            audioText.x = x - audioText.width / 2;
        }
    }, [songName, authorName, pixiAppReady])

    const resizeMajor = useCallback((scale: number) => {
        const major = pixiApp.current?.spriteMap.get('major') as Sprite;
        const graphics = pixiApp.current?.spriteMap.get('majorMask') as Graphics;
        const { width, height } = majorSprite;
        major.width = width * scale;
        major.height = height * scale;
        major.x = 1920 / 2 - major.width / 2;
        major.y = 1080 / 2 - height - ((height * scale - height) / 2);

        graphics.clear();
        graphics.fill();
        graphics.circle(major.x + major.width / 2, major.y + major.height / 2, major.width / 2);
        graphics.fill();
    }, [])
    const tickerEventTemp = useRef<() => void | null>(null);
    const drawVisualizer = useCallback(() => {
        if (pixiApp.current) {
            const { spriteMap } = pixiApp.current as { spriteMap: spriteMap }

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
                /* particle speed */
                const average = mean(dataArray)
                const energy = Math.pow(10, average / 10) * 10000 * 100000
                DustParticle.speed = energy < 0 ? 1 : energy;

                /* major speed */
                resizeMajor(1 + 0.2 * 0.01 * energy);
                
                const audioVisualizer = spriteMap.get('audioVisualizer') as Graphics;
                audioVisualizer.clear();

                const { x, y, width } = audioVisualizerSprite;
                const centerX = x;
                const centerY = y;
                const baseRadius = width * (1 + 0.2 * 0.01 * energy);

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

    useEffect(() => {
        widthRef.current = canvasWidth;
        const canvas = pixiCanvasRef.current as HTMLCanvasElement;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasWidth * 9 / 16}px`;
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