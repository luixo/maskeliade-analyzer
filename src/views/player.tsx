import React from 'react';
import styled from 'styled-components/macro';
import Waveform from './waveform';
import AudioDropdown from './audio-dropdown';
import usePlayer from '../hooks/use-player';
import {SpectrumRangePoint, SpectrumLinePoint} from './fft-visualizer';
import {getAverages, getBins, msToSample} from '../utils/spectrum-utils';

interface Props {
    texts: {
        title: string;
        no: number;
        prompt: string;
    };
    colors: {
        immediate: string;
        range: string;
        waveform: string;
    };
    updateImmediateSpectrum?: (spectrum: SpectrumLinePoint[]) => void;
    updateSpectrumRange?: (spectrumRange: SpectrumRangePoint[]) => void;
    onAudioLoaded: () => void;
    disabled?: boolean;
}

const Wrapper = styled.div({
    flexGrow: 1
});

const Title = styled.div({
    fontWeight: 500,
    fontSize: 32,
    lineHeight: '52px',
    textTransform: 'uppercase',
    marginBottom: 16
});

const InnerWrapper = styled.div({
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center'
});

const DEFAULT_RANGE: [number, number] = [0, 30000];

const Player: React.FC<Props> = (props) => {
    const {updateSpectrumRange, updateImmediateSpectrum, disabled} = props;
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
    React.useEffect(() => {
        if (audio) {
            props.onAudioLoaded();
        }
    }, [audio]);
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
        <Wrapper>
            <Title>
                {props.texts.title}
            </Title>
            <InnerWrapper>
                {audio ?
                    <Waveform
                        data={currentBuffer}
                        currentTime={offsetTime}
                        onClick={onWaveformClick}
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
                        color={props.colors.waveform}
                    /> :
                    disabled ?
                        null :
                        <AudioDropdown
                            texts={{
                                no: props.texts.no,
                                title: props.texts.prompt
                            }}
                            audioContext={playerContext}
                            onFileLoad={(buffer) => {
                                changeFile(buffer);
                                setAudio(buffer);
                            }}
                        />
                }
            </InnerWrapper>
        </Wrapper>
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
