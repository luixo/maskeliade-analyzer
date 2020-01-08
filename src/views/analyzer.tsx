import React from 'react';
import styled from 'styled-components/macro';
import FftVisualizer, {SpectrumStreamPoint} from './fft-visualizer';
import Player from './player';
import ModelPlayer from './model-player';

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

const Analyzer: React.FC = () => {
    const [userSpectrum, setUserSpectrum] = React.useState<Float32Array>(new Float32Array());
    const [modelSpectrum, setModelSpectrum] = React.useState<SpectrumStreamPoint[]>([{
        x: 60,
        low: -18,
        high: -3
    }, {
        x: 1000,
        low: -24,
        high: -10
    }, {
        x: 4000,
        low: -22,
        high: -6
    }, {
        x: 15000,
        low: -40,
        high: -30
    }]);
    return (
        <Body>
            <Flex>
                <Block>
                    <Player
                        updateSpectrum={setUserSpectrum}
                    />
                </Block>
                <Block>
                    <ModelPlayer
                        updateModelSpectrum={setModelSpectrum}
                    />
                </Block>
            </Flex>
            <VisualizerWrapper>
                <FftVisualizer
                    data={userSpectrum}
                    model={modelSpectrum}
                />
            </VisualizerWrapper>
        </Body>
    );
};

export default Analyzer;
