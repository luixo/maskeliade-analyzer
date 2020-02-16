import React from 'react';
import Tone from 'tone';

const DEFAULT_BUCKETS_AMOUNT = 512;

interface Params {
    buckets?: number;
}

interface PlayerControls {
    isPlaying: boolean;
    currentBuffer: AudioBuffer | null;
    play: (ms?: number) => void;
    pause: () => void;
    stop: () => void;
    changeFile: (buffer: AudioBuffer) => void;
    getDbRange: () => [number, number];
    playerContext: AudioContext;
    getFft: () => Float32Array;
}

let players: Tone.Player[] = [];

function usePlayer(params: Params = {}): PlayerControls {
    const [currentBuffer, setCurrentBuffer] = React.useState<AudioBuffer | null>(null);
    const [isPlaying, setPlaying] = React.useState(false);
    const player = React.useMemo(() => new Tone.Player(''), []);
    const analyzer = React.useMemo(() => new Tone.Analyser('fft', params.buckets || DEFAULT_BUCKETS_AMOUNT), [params.buckets]);
    const playerContext = React.useMemo(() => (player.context as any)._context as AudioContext, [player]);
    const rawAnalyserNode = React.useMemo(() => (analyzer as any).input as AnalyserNode, [analyzer]);
    React.useEffect(() => {
        players.push(player);
        return () => {
            players = players.filter((instance) => instance !== player);
        }
    }, [player]);
    React.useEffect(() => {
        player.fan(Tone.Master, analyzer);
        return () => {
            player.disconnect(Tone.Master);
            player.disconnect(analyzer);
        };
    }, [player, analyzer]);
    const play = React.useCallback((ms) => {
        const restPlayers = players.filter((instance) => instance !== player);
        restPlayers.forEach((player) => player.stop());
        player.start(0, ms ? ms / 1000 : 0);
        setPlaying(true);
    }, [player, setPlaying]);
    const pause = React.useCallback(() => {
        player.stop();
        setPlaying(false);
    }, [player, setPlaying]);
    const stop = React.useCallback(() => {
        player.seek(0, 0);
        player.stop();
        setPlaying(false);
    }, [player, setPlaying]);
    const changeFile = React.useCallback((buffer) => {
        player.stop();
        setPlaying(false);
        player.buffer = new Tone.BufferSource(buffer, () => {}).buffer;
        setCurrentBuffer(buffer);
    }, [setCurrentBuffer, player, setPlaying]);
    const getDbRange = React.useCallback<() => [number, number]>(
        () => [rawAnalyserNode.minDecibels, rawAnalyserNode.maxDecibels],
        [rawAnalyserNode]
    );
    const getFft = React.useCallback(() => analyzer.getValue(), [analyzer]);
    return React.useMemo<PlayerControls>(() =>
        ({play, pause, stop, changeFile, getDbRange, playerContext, getFft, isPlaying, currentBuffer}),
        [play, pause, stop, changeFile, getDbRange, playerContext, getFft, isPlaying, currentBuffer]
    );
}

export default usePlayer;
