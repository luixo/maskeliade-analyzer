import React from 'react';
import Waveform from './waveform';
import Controls from './controls';
import usePlayer from '../hooks/use-player';
import {SpectrumRangePoint, SpectrumLinePoint} from './fft-visualizer';
import {getAverages, getBins, msToSample} from '../utils/spectrum-utils';

interface Props {
    title: string;
    colors: {
        immediate: string;
        range: string;
    };
    updateImmediateSpectrum?: (spectrum: SpectrumLinePoint[]) => void;
    updateSpectrumRange?: (spectrumRange: SpectrumRangePoint[]) => void;
}

const DEFAULT_RANGE: [number, number] = [0, 30000];

const Player: React.FC<Props> = (props) => {
    const {updateSpectrumRange, updateImmediateSpectrum} = props;
    const {isPlaying, playerContext, currentBuffer, changeFile, getFft, play, stop} = usePlayer();
    const [audio, setAudio] = React.useState<AudioBuffer | null>(null);
    const [progress, setProgress] = React.useState<{text: string, percentage?: number}>({text: 'Жду загрузки'});
    const [offsetTime, setOffsetTime] = React.useState(0);
    React.useEffect(() => {
        let cancellationHandle = 0;
        function getValue(prev: number, curr: number): void {
            cancellationHandle = requestAnimationFrame((next) => getValue(curr, next));
            if (updateImmediateSpectrum) {
                const fft = getFft();
                const size = fft.length;
                const freqDelta = 48000 / (size * 2);
                const data = fft.reduce<SpectrumLinePoint[]>((memo, point, index) => {
                    return memo.concat({
                        x: index * freqDelta,
                        y: point
                    });
                }, []).slice(1, -1);
                updateImmediateSpectrum(data);
            }
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
    }, [isPlaying, getFft, updateImmediateSpectrum]);
    const calculateAverage = React.useCallback(async (startInMs: number, endInMs: number) => {
        if (!audio || !updateSpectrumRange) {
            return;
        }
        const average = await calculateAverageSpectrum(
            audio,
            [startInMs, endInMs],
            (text) => setProgress({text, percentage: 0}),
            (amount) => setProgress((progress) => progress ? ({text: progress.text, percentage: amount}) : progress)
        );
        updateSpectrumRange(average);
        setProgress({text: 'Готово'});
    }, [audio, setProgress, updateSpectrumRange]);
    React.useEffect(() => {
        if (audio) {
            calculateAverage(...DEFAULT_RANGE);
        }
    }, [audio, calculateAverage]);
    const onWaveformClick = React.useCallback((time) => {
        if (!currentBuffer) {
            return;
        }
        play(time);
        setOffsetTime(time);
    }, [currentBuffer, play, setOffsetTime]);
    return (
        <>
            <Controls
                title={props.title}
                isFileLoaded={Boolean(currentBuffer)}
                audioContext={playerContext}
                onFileLoad={(buffer) => {
                    changeFile(buffer);
                    setAudio(buffer);
                }}
                colors={props.colors}
                isPaused={isPlaying}
                onPlay={() => play(offsetTime)}
                onPause={stop}
                progress={progress}
            />
            <Waveform
                data={currentBuffer}
                currentTime={offsetTime}
                onClick={onWaveformClick}
                width={300}
                height={100}
                brush={{
                    initialStart: DEFAULT_RANGE[0],
                    initialEnd: DEFAULT_RANGE[1],
                    onUpdate: (startInMs, endInMs) => {
                        if (audio) {
                            calculateAverage(startInMs, endInMs);
                        }
                    }
                }}
            />
        </>
    )
};

async function calculateAverageSpectrum(
    buffer: AudioBuffer,
    [startMs, endMs]: [number, number],
    setProgressStep: (stepName: string) => void,
    setProgress: (progress: number) => void
): Promise<SpectrumRangePoint[]> {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    setProgressStep('Формирование спектров');
    const spectra = await getBins(data, 512, [msToSample(startMs, sampleRate), msToSample(endMs, sampleRate)], setProgress);
    setProgressStep('Просчет средних');
    const minMaxes = await getAverages(spectra, 0.4, setProgress);

    const freqDelta = 24000 / spectra[0].length * 2;
    return minMaxes.map(([min, max], index) => {
        return {
            x: freqDelta * index,
            low: Math.min(min, -0.01),
            high: Math.min(max, -0.01)
        };
    }).slice(1);
}

export default Player;
