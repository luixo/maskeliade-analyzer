import React from 'react';
import Waveform from './waveform';
import Controls from './controls';
import usePlayer from '../hooks/use-player';

const FFT_HISTORY = 1000 * 3;

interface Props {
    updateSpectrum: (spectrum: Float32Array) => void;
}

interface FftHistoryItem {
    timestamp: number;
    data: Float32Array;
}

const Player: React.FC<Props> = (props) => {
    const player = usePlayer();
    const [offsetTime, setOffsetTime] = React.useState(0);
    const [isPlaying, setPlaying] = React.useState(false);
    const fftHistory = React.useRef<FftHistoryItem[]>([]);
    React.useEffect(() => {
        let cancellationHandle = 0;
        function getValue(prev: number, curr: number): void {
            cancellationHandle = requestAnimationFrame((next) => getValue(curr, next));
            const currentFft = Float32Array.from(player.getFft());
            const now = Date.now();
            fftHistory.current = [
                ...fftHistory.current.filter(({timestamp}) => timestamp > now - FFT_HISTORY),
                {timestamp: now, data: currentFft}
            ];
            const average = calculateAverageFft(fftHistory.current);
            props.updateSpectrum(average);
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
            <Controls
                title="Твой трек"
                isFileLoaded={player.isFileLoaded}
                audioContext={player.getAudioContext()}
                onFileLoad={(file) => {
                    player.changeFile(file);
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

function calculateAverageFft(ffts: FftHistoryItem[]): Float32Array {
    if (ffts.length === 0) {
        return new Float32Array();
    }
    return ffts[0].data.map((_, index) => {
        let value = 0;
        let length = ffts.length;
        for (let i = 0; i < ffts.length; i++) {
            if (ffts[i].data[index] !== -Infinity) {
                value += Math.max(-180, ffts[i].data[index]);
            } else {
                length -= 1;
            }
        }
        return value / (length || 1);
    });
}

export default Player;
