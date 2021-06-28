import React from 'react';
import styled from 'styled-components/macro';
import FftVisualizer, {SpectrumRangePoint, SpectrumLinePoint} from './fft-visualizer';
import Player from './player';
import useLocalStorage from '../utils/use-locale-storage';
import Intro from './intro';

const Wrapper = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 740,
    minHeight: 600,
    maxHeight: 850,
    margin: '0 auto',
    boxSizing: 'border-box'
});

const Row = styled.div({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 0'
});

const Cell = styled.div({
    flex: '1 0 0',
    display: 'flex',
    padding: 36
});

const COLORS = {
    user: {
        immediate: 'rgba(200, 100, 255)',
        range: 'rgba(100, 100, 155)',
        waveform: '#1FB2D2'
    },
    model: {
        immediate: 'rgba(200, 230, 0)',
        range: 'rgba(100, 100, 0)',
        waveform: '#F06C4F'
    }
};

const Analyzer: React.FC = () => {
    const [shouldShowIntro, setShowIntro] = useLocalStorage('introShown', false);
    const [userImmediateSpectrum, setUserImmediateSpectrum] = React.useState<SpectrumLinePoint[]>([]);
    const [modelSpectrumRange, setModelSpectrumRange] = React.useState<SpectrumRangePoint[]>([]);
    const [userSpectrumRange, setUserSpectrumRange] = React.useState<SpectrumRangePoint[]>([]);
    const [userAudioLoaded, setUserAudioLoaded] = React.useState(false);
    const [userReferenceLoaded, setReferenceAudioLoaded] = React.useState(false);

    if (shouldShowIntro) {
        return (
            <Wrapper>
                <Intro onStartClick={() => setShowIntro(true)} />
            </Wrapper>
        );
    }

    const visualizer = userAudioLoaded && userReferenceLoaded ?
        (
            <Row>
                <FftVisualizer
                    data={[{
                        type: 'range',
                        color: COLORS.model.range,
                        points: modelSpectrumRange
                    }, {
                        type: 'range',
                        color: COLORS.user.range,
                        points: userSpectrumRange
                    }, {
                        type: 'line',
                        color: COLORS.user.immediate,
                        points: userImmediateSpectrum
                    }]}
                />
            </Row>
        ) :
        null;
    return (
        <Wrapper>
            <Row>
                <Cell>
                    <Player
                        texts={{
                            title: 'Твой трек',
                            no: 1,
                            prompt: 'Для начала перетащите сюда свой трек'
                        }}
                        colors={COLORS.user}
                        updateImmediateSpectrum={setUserImmediateSpectrum}
                        updateSpectrumRange={setUserSpectrumRange}
                        onAudioLoaded={() => setUserAudioLoaded(true)}
                    />
                </Cell>
                <Cell>
                    <Player
                        texts={{
                            title: 'Референс',
                            no: 2,
                            prompt: 'Теперь трек который послужит референсом'
                        }}
                        colors={COLORS.model}
                        updateSpectrumRange={setModelSpectrumRange}
                        onAudioLoaded={() => setReferenceAudioLoaded(true)}
                        disabled={!userAudioLoaded}
                    />
                </Cell>
            </Row>
            {visualizer}
        </Wrapper>
    );
};

export default Analyzer;
