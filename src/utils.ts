// power by AI

/**
 * 将任意图片缩放并填充为 1920x1080，保持比例，背景居中填充。
 * @param base64 原始图片的 base64 字符串
 * @returns 返回处理后的 base64 字符串（JPEG）
 */
export const resizeUrlImageTo1920x1080Base64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const targetWidth = 1920;
            const targetHeight = 1080;

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const offsetX = (targetWidth - scaledWidth) / 2;
                const offsetY = (targetHeight - scaledHeight) / 2;

                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, targetWidth, targetHeight);
                ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

                const resizedBase64 = canvas.toDataURL('image/jpeg');
                resolve(resizedBase64);
            }
        };
        img.src = url;
    });
};

type FrequencyBand = {
    frequency: number;
    value: number;
}
export const analyzeAudio = async (url: string) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    // 创建普通 AudioContext 来解码
    const tempAudioCtx = new AudioContext();
    const audioBuffer = await tempAudioCtx.decodeAudioData(arrayBuffer);
    tempAudioCtx.close(); // 解码完就关闭

    const fftSize = 2048;
    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;

    // 创建离线上下文：时长、声道数、采样率
    const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, sampleRate * duration, sampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    const analyser = offlineCtx.createAnalyser();
    analyser.fftSize = fftSize;

    source.connect(analyser);
    analyser.connect(offlineCtx.destination);

    source.start();

    // 渲染整段音频（不会播放，处理非常快）
    await offlineCtx.startRendering();

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqData);

    // freqData 就是整个音频的频率分布快照
    console.log('频率分布:', freqData);

    // 计算每个 bin 对应的频率
    const freqPerBin = sampleRate / fftSize;
    // const frequencyBands = freqData.map((v, i) => ({
    //     frequency: i * freqPerBin,
    //     value: v
    // }));
    const frequencyBands: FrequencyBand[] = [];
    return frequencyBands;
}