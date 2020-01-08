import React from 'react';
import styled from 'styled-components/macro';
import {ResponsiveStream} from '@nivo/stream'

interface Props {
    data: AudioBuffer | null;
    currentTime: number;
    onClick: (time: number) => void;
    width: number;
    height: number;
}

const Wrapper = styled.div<{paranja: boolean}>((props) => ({
    position: 'relative',
    padding: '8px 0',
    '&:before': props.paranja ?
        {
            content: '""',
            background: 'rgba(255, 255, 255, 0.6)',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            position: 'absolute'
        } :
        undefined
}));

const Line = styled.div({
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 1,
    background: 'red'
});

const Waveform: React.FC<Props> = (props) => {
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const points = React.useMemo(() => {
        if (!props.data) {
            return new Array(props.width).fill(0).map(() => Math.random() * 2 - 1);
        }
        const wavedataLeft = props.data.getChannelData(0);
        const interval = wavedataLeft.length / props.width;
        let data: number[] = [];
        for (let i = 0; i < props.width; i++) {
            data.push(wavedataLeft[Math.floor(interval * i)]);
        }
        return data;
    }, [props.data, props.width]);
    const durationInMs = props.data ? (props.data.duration * 1000) : 0;
    const msInPixel = durationInMs / props.width;
    return (
        <Wrapper
            ref={wrapperRef}
            onClick={(e) => {
                const position = e.clientX - e.currentTarget.getBoundingClientRect().left;
                props.onClick(position * msInPixel);
            }}
            paranja={!props.data}
            style={{width: props.width, height: props.height}}
        >
            <ResponsiveStream
                data={points.map((point) => ({y: point}))}
                keys={['y']}
                curve="step"
                yScale={{
                    type: 'linear',
                    min: -1,
                    max: 1
                }}
                xScale={{
                    type: 'linear',
                    min: 0,
                    max: props.width
                }}
                axisBottom={null}
                animate={false}
                enableGridX={false}
                enableStackTooltip={false}
                isInteractive={false}
            />
            <Line style={{left: msInPixel ? (props.currentTime / msInPixel) : 0}} />
        </Wrapper>
    );
};

export default Waveform;
