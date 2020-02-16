import React from 'react';
import styled from 'styled-components/macro';
import FftVisualizer, {SpectrumRangePoint, SpectrumLinePoint} from './fft-visualizer';
import Player from './player';

const Body = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
    height: '100vh',
    padding: '0 16px',
    margin: '0 auto'
});

const VisualizerWrapper = styled.div({
    width: '100%',
    height: 300
});

const Flex = styled.div({
    width: '100%',
    display: 'flex',
    alignItems: 'center'
});

const Block = styled.div({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column'
});

const COLORS = {
    user: {
        immediate: 'rgba(200, 100, 255)',
        range: 'rgba(100, 100, 155)'
    },
    model: {
        immediate: 'rgba(200, 230, 0)',
        range: 'rgba(100, 100, 0)'
    }
};

const Analyzer: React.FC = () => {
    const [userImmediateSpectrum, setUserImmediateSpectrum] = React.useState<SpectrumLinePoint[]>([]);
    const [modelSpectrumRange, setModelSpectrumRange] = React.useState<SpectrumRangePoint[]>([]);
    const [userSpectrumRange, setUserSpectrumRange] = React.useState<SpectrumRangePoint[]>([]);
    return (
        <Body>
            <Flex>
                <Block>
                    <Player
                        title="Твой трек"
                        colors={COLORS.user}
                        updateImmediateSpectrum={setUserImmediateSpectrum}
                        updateSpectrumRange={setUserSpectrumRange}
                    />
                </Block>
                <Block>
                    <Player
                        title="Трек-модель"
                        colors={COLORS.model}
                        updateSpectrumRange={setModelSpectrumRange}
                    />
                </Block>
            </Flex>
            <VisualizerWrapper>
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
            </VisualizerWrapper>
        </Body>
    );
};

export default Analyzer;
