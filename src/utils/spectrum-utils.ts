import {fft} from './fft2';

type BinSize = 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384 | 32768

// Возвращает n спектров входной аудиоформы.
// Спектр имеет размер binSize.
// n - число семплов всего файла, деленный на binSize.
async function getBins(
    waveform: Float32Array,
    binSize: BinSize,
    [startSample, endSample]: [number, number],
    setProgress: (progress: number) => void
): Promise<number[][]> {
    const spectra: number[][] = [];
    let lastTimestamp = Date.now();
    const restrictedEndSample = Math.min(endSample, waveform.length);
    const totalSamples = restrictedEndSample - startSample;
    for (let i = startSample; i < restrictedEndSample; i += binSize * 2) {
        if (Date.now() - lastTimestamp > 30) {
            setProgress((i - startSample) / totalSamples);
            lastTimestamp = Date.now();
            // Даем прогрессу обновиться.
            await new Promise((res) => setTimeout(res, 1));
        }
        const spectrum = fft(Array.from(waveform.slice(i, i + binSize * 2)));
        spectra.push(spectrum);
    }
    setProgress(1);
    return spectra;
}

// Возвращает максимальные и минимальные значения для каждой из частот спектра.
// windowAmount - размер окна значений (например, 0.4 - 40 перцентиль).
async function getAverages(
    spectra: number[][],
    windowAmount: number,
    setProgress: (progress: number) => void
): Promise<[number, number][]> {
    let lastTimestamp = Date.now();
    const spectrumSize = spectra[0].length;
    const minMaxes: [number, number][] = [];
    for (let freqIndex = 0; freqIndex < spectrumSize; freqIndex++) {
        if (Date.now() - lastTimestamp > 30) {
            setProgress(freqIndex / spectrumSize);
            lastTimestamp = Date.now();
            // Даем прогрессу обновиться.
            await new Promise((res) => setTimeout(res, 1));
        }

        const freqs = spectra.map((spectrum) => spectrum[freqIndex]).sort();
        const medianFreq = freqs[Math.floor(freqs.length / 2)];
        const distances = freqs.map((freq) => ({distance: Math.abs(freq - medianFreq), freq})).sort((a, b) => a.distance - b.distance);
        let min;
        let max;
        const startIndex = Math.floor(distances.length * ((1 - windowAmount) / 2));
        for (let distanceIndex = startIndex; distanceIndex < distances.length; distanceIndex++) {
            const distance = distances[distanceIndex];
            if (min === undefined) {
                if (distance.freq < medianFreq) {
                    min = distance.freq;
                }
            }
            if (max === undefined) {
                if (distance.freq > medianFreq) {
                    max = distance.freq;
                }
            }
            if (min !== undefined && max !== undefined) {
                break;
            }
        }
        if (!min) {
            min = freqs[0];
        }
        if (!max) {
            max = freqs[freqs.length - 1];
        }
        minMaxes[freqIndex] = [min, max];
    }
    setProgress(1);
    return minMaxes;
}

function msToSample(ms: number, rate: number): number {
    return ms * rate / 1000;
}

export {getBins, getAverages, msToSample};
