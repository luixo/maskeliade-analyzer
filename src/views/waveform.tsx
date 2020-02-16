import React from 'react';
import styled from 'styled-components/macro';
import {ResponsiveStream} from '@nivo/stream'
import Brush from './brush';
import useDebouncedCallback from '../utils/use-debounced-callback';

interface Props {
    data: AudioBuffer | null;
    currentTime: number;
    onClick: (time: number) => void;
    width: number;
    height: number;
    brush?: {
        initialStart: number;
        initialEnd: number;
        onUpdate: (startInMs: number, endInMs: number) => void;
    };
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
    const {data, width, onClick, brush} = props;
    const [[brushStart, brushEnd], setBrushData] = React.useState(brush ? [brush.initialStart, brush.initialEnd] : [0, 0]);
    const [onUpdate] = useDebouncedCallback((start, end) => brush!.onUpdate(start, end), 1000);
    React.useEffect(() => {
        if (brush) {
            console.log('update', brushStart, brushEnd);
            onUpdate(brushStart, brushEnd);
        }
    }, [brushStart, brushEnd, onUpdate]);
    const points = React.useMemo(() => {
        if (!data) {
            return new Array(width).fill(0).map(() => Math.random() * 2 - 1);
        }
        const wavedataLeft = data.getChannelData(0);
        const wavedataRight = data.getChannelData(1);
        const interval = wavedataLeft.length / width;
        let simplifiedData: number[] = [];
        for (let i = 0; i < width; i++) {
            simplifiedData.push(
                (wavedataLeft[Math.floor(interval * i)] +
                wavedataRight[Math.floor(interval * i)]) / 2
            );
        }
        return simplifiedData;
    }, [data, width]);

    const durationInMs = props.data ? (props.data.duration * 1000) : 0;
    const msInPixel = durationInMs / props.width;
    const [brushPosition, setBrushPosition] = React.useState<number | null>(0);
    return (
        <Wrapper
            onMouseDown={(e) => {
                const position = e.clientX - e.currentTarget.getBoundingClientRect().left;
                const brushStartInPixel = brushStart / msInPixel;
                const brushEndInPixel = brushEnd / msInPixel;
                if (position <= brushEndInPixel && position >= brushStartInPixel) {
                    setBrushPosition(position);
                } else {
                    setBrushPosition(null);
                }
            }}
            onMouseUp={(e) => {
                const position = e.clientX - e.currentTarget.getBoundingClientRect().left;
                console.log('bp', brushPosition, position);
                if (!brush || !brushPosition || Math.abs(brushPosition - position) < 3) {
                    onClick(position * msInPixel);
                }
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
                    max: width
                }}
                axisBottom={null}
                animate={false}
                enableGridX={false}
                enableStackTooltip={false}
                isInteractive={false}
            />
            {brush && data ?
                <Brush
                    width={width}
                    height={props.height}
                    onUpdate={(start, end) => setBrushData([start * durationInMs, end * durationInMs])}
                    initialStart={brush.initialStart / durationInMs}
                    initialEnd={brush.initialEnd / durationInMs}
                /> :
                null
            }
            {data && onClick ?
                <Line style={{left: msInPixel ? (props.currentTime / msInPixel) : 0}} /> :
                null
            }
        </Wrapper>
    );
};

export default Waveform;
