import React from 'react';
import Waveform from './waveform';
import Controls from './controls';
import usePlayer from '../hooks/use-player';
import {forward} from '../utils/fft';
import {SpectrumStreamPoint} from './fft-visualizer';

interface Props {
    updateModelSpectrum: (spectrum: SpectrumStreamPoint[]) => void;
}

const DEFAULT_RANGE = [0, 10000];

const ModelPlayer: React.FC<Props> = (props) => {
    const player = usePlayer();
    const [audio, setAudio] = React.useState<AudioBuffer | null>(null);
    const [offsetTime, setOffsetTime] = React.useState(0);
    const [isPlaying, setPlaying] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    React.useEffect(() => {
        let cancellationHandle = 0;
        function getValue(prev: number, curr: number): void {
            cancellationHandle = requestAnimationFrame((next) => getValue(curr, next));
            const delta = curr - prev;
            setOffsetTime((offset) => offset + delta);
        }
        if (isPlaying) {
            const now = window.performance.now();
            getValue(now, now);
        }
        return () => {
            cancelAnimationFrame(cancellationHandle);
        };
    }, [isPlaying, player]);
    return (
        <>
            {progress ? <div>{Math.floor(progress * 100)} / 100</div> : null}
            <Controls
                title="Модель"
                isFileLoaded={player.isFileLoaded}
                audioContext={player.getAudioContext()}
                onFileLoad={async (buffer) => {
                    player.changeFile(buffer);
                    setAudio(buffer);
                    const average = await calculateAverageSpectrum(buffer, DEFAULT_RANGE[0], DEFAULT_RANGE[1], setProgress);
                    props.updateModelSpectrum(average);
                }}
                isPaused={isPlaying}
                onPlay={() => {
                    setPlaying(true);
                    player.play(offsetTime);
                }}
                onPause={() => {
                    setPlaying(false);
                    player.stop();
                }}
            />
            <Waveform
                data={player.currentBuffer}
                currentTime={offsetTime}
                onClick={(time) => {
                    player.play(time);
                    setOffsetTime(time);
                }}
                width={300}
                height={150}
            />
        </>
    )
};

const BINS = 512;

const CLOSEST_PERCENT = 0.4;

function msToSample(ms: number, rate: number): number {
    return ms * rate / 1000;
}

const FETCH_PROGRESS = 0.2;

async function calculateAverageSpectrum(
    buffer: AudioBuffer,
    startMs: number,
    endMs: number,
    setProgress: (progress: number) => void
): Promise<SpectrumStreamPoint[]> {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    let bins: number[][] = [];
    let lastTimestamp = Date.now();
    for (let i = msToSample(startMs, sampleRate); i < msToSample(endMs, sampleRate); i += BINS) {
        if (Date.now() - lastTimestamp > 30) {
            setProgress(i / buffer.length * FETCH_PROGRESS);
            lastTimestamp = Date.now();
            await new Promise((res) => setTimeout(res, 1));
        }
        const result = forward(BINS, Array.from(data.slice(i, i + BINS)));
        bins.push(result.map(adjust));
    }

    let mins: number[] = [];
    let maxs: number[] = [];
    for (let freqIndex = 0; freqIndex < BINS; freqIndex++) {
        if (Date.now() - lastTimestamp > 30) {
            setProgress(FETCH_PROGRESS + (1 - FETCH_PROGRESS) * (freqIndex / BINS));
            lastTimestamp = Date.now();
            await new Promise((res) => setTimeout(res, 1));
        }

        let freqs: number[] = [];
        for (let binIndex = 0; binIndex < bins.length; binIndex++) {
            freqs.push(bins[binIndex][freqIndex]);
        }
        freqs.sort();
        const median = freqs[Math.floor(freqs.length / 2)];
        const distances = freqs.map((v) => ({distance: Math.abs(v - median), v})).sort((a, b) => a.distance - b.distance);
        let min;
        let max;
        for (let distanceIndex = Math.floor(CLOSEST_PERCENT * distances.length); distanceIndex < distances.length; distanceIndex++) {
            if (min === undefined) {
                if (distances[distanceIndex].v < median) {
                    min = distances[distanceIndex].v;
                }
            }
            if (max === undefined) {
                if (distances[distanceIndex].v > median) {
                    min = distances[distanceIndex].v;
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
        mins[freqIndex] = min;
        maxs[freqIndex] = max;
    }
    setProgress(1);
    const freqDelta = 24000 / BINS * 2;

    return new Array(BINS / 2).fill(null).map((_, index) => {
        return {
            x: freqDelta * index,
            low: Math.min(mins[index], -0.01),
            high: Math.min(maxs[index], -0.01)
        };
    }).slice(1, -1);
}

function adjust(value: number): number {
    const verified = isNaN(value) ? 0 : value;
    return Math.log10(verified) * 20 - 120;
}

export default ModelPlayer;
