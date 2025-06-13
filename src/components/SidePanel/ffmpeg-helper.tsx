import { useRef, useState } from "react";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { Button, Popover, Spin } from 'antd';
import { useGlobal } from "../../context/globalContext";
import { useFormContext } from "../../context/formContext";
const FfmpegHelper = () => {
    const [loaded, setLoaded] = useState(false);
    const ffmpegRef = useRef(new FFmpeg());
    const { gainNode } = useGlobal()
    const { form } = useFormContext();
    const [loading, setLoading] = useState(false);

    const [audioDuration, setAudioDuration] = useState(0);
    const tips = audioDuration <= 0 ? 'ffmpeg working...' : `don't leave this page(${audioDuration}s)`
    const load = async () => {
        try {
            setLoading(true);
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'
            const ffmpeg = ffmpegRef.current;
            // toBlobURL is used to bypass CORS issue, urls with the same
            // domain can be used directly.
            ffmpeg.on('log', ({ message }) => {
                console.log(message);
            });
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setLoaded(true);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error(error);
        }
    }
    const [exportLoading, setExportLoading] = useState(false);

    const transcode = async () => {
        try {
            setExportLoading(true);
            const mainCanvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;
            const stream = mainCanvas.captureStream(60);

            const audioContext = new AudioContext();
            const audioFile = form.getFieldValue('audioUrl');
            const audioRes = await fetch(audioFile);
            const audioBuffer = await audioRes.arrayBuffer();

            const audioSource = audioContext.createBufferSource();
            audioSource.buffer = await audioContext.decodeAudioData(audioBuffer);

            const mediaStreamDest = audioContext.createMediaStreamDestination();
            audioSource.connect(mediaStreamDest);

            const audioTrack = mediaStreamDest.stream.getAudioTracks()[0];
            stream.addTrack(audioTrack);

            const recorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9,opus" });
            const chunks: Blob[] = [];


            recorder.ondataavailable = (event) => chunks.push(event.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: "video/webm" });
                const video = new Uint8Array(await blob.arrayBuffer());

                const ffmpeg = ffmpegRef.current;
                await ffmpeg.writeFile('input.webm', video);

                await ffmpeg.exec(['-i', 'input.webm', 'output.mp4']);
                const data = await ffmpeg.readFile('output.mp4');
                const a = document.createElement('a');
                const url = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }))
                a.href = url;
                a.download = 'video.mp4';
                a.click();
                URL.revokeObjectURL(url);
                setExportLoading(false);
            }
            const audio = document.getElementById('pixi-audio') as HTMLVideoElement;
            const duration = audio.duration;
            setAudioDuration(duration);
            const timer = setInterval(() => {
                setAudioDuration(prev => {
                    if (audioDuration == 1) {
                        clearInterval(timer)
                    }
                    return prev - 1
                });
            }, 1000);

            audio.currentTime = 0;
            audio.pause();
            const { gain } = gainNode.current as GainNode;
            const tempValue = gain.value;
            gain.value = 0;

            const playButton = document.getElementById('audio-play-button') as HTMLDivElement;
            playButton.click();
            audioSource.start();
            recorder.start();
            setTimeout(async () => {
                recorder.stop();
                gain.value = tempValue;
            }, duration * 1000);
        } catch (error) {
            setExportLoading(false);
        }
    }

    return (loaded
        ? (
            <>
                <Button color="danger" variant="solid" loading={exportLoading} onClick={transcode}>EXPORT</Button>
                <Spin spinning={exportLoading} fullscreen tip={tips} />
            </>
        )
        : (
            <Popover content={'you need to load ffmpeg.wasm to export'}>
                <Button onClick={load} loading={loading} >Load ffmpeg-core (~31 MB)</Button>
            </Popover>
        )
    );
}

export default FfmpegHelper;