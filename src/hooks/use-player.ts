import React from 'react';
import Tone from 'tone';

const DEFAULT_BUCKETS_AMOUNT = 512;

interface Params {
    buckets?: number;
}

interface PlayerControls {
    isFileLoaded: boolean;
    currentBuffer: AudioBuffer | null;
    play: (ms?: number) => void;
    pause: () => void;
    stop: () => void;
    changeFile: (buffer: AudioBuffer) => void;
    getDbRange: () => [number, number];
    getAudioContext: () => AudioContext;
    getFft: () => Float32Array;
}

function usePlayer(params: Params = {}): PlayerControls {
    const [currentBuffer, setCurrentBuffer] = React.useState<AudioBuffer | null>(null);
    const player = React.useMemo(() => new Tone.Player(''), []);
    const analyzer = React.useMemo(() => new Tone.Analyser('fft', params.buckets || DEFAULT_BUCKETS_AMOUNT), [params.buckets]);
    const playerContext = React.useMemo(() => (player.context as any)._context as AudioContext, [player]);
    const rawAnalyserNode = React.useMemo(() => (analyzer as any).input as AnalyserNode, [analyzer]);
    React.useEffect(() => {
        player.fan(Tone.Master, analyzer);
        return () => {
            player.disconnect(Tone.Master);
            player.disconnect(analyzer);
        };
    }, [player, analyzer]);
    const controls = React.useMemo<PlayerControls>(() => {
        return {
            play: (ms) => {
                player.start(0, ms ? ms / 1000 : 0)
            },
            pause: () => {
                player.stop();
            },
            stop: () => {
                player.seek(0, 0);
                player.stop();
            },
            changeFile: (buffer: AudioBuffer) => {
                player.buffer = new Tone.BufferSource(buffer, () => {}).buffer;
                setCurrentBuffer(buffer);
            },
            getDbRange: () => [rawAnalyserNode.minDecibels, rawAnalyserNode.maxDecibels],
            getAudioContext: () => playerContext,
            getFft: () => analyzer.getValue(),
            isFileLoaded: Boolean(currentBuffer),
            currentBuffer
        }
    }, [player, analyzer, rawAnalyserNode, playerContext, currentBuffer]);
    return controls;
}

export default usePlayer;
