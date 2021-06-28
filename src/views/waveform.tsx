import React from 'react';
import styled from 'styled-components/macro';
import Brush from './brush';
import useDebouncedCallback from '../utils/use-debounced-callback';
import useWindowSize from '../utils/use-window-size';

interface Props {
    data: AudioBuffer | null;
    currentTime: number;
    onClick: (time: number) => void;
    height: number;
    brush?: {
        initialStart: number;
        initialEnd: number;
        onUpdate: (startInMs: number, endInMs: number) => void;
    };
    color: string;
}

const Wrapper = styled.div<{paranja: boolean}>((props) => ({
    position: 'relative',
    padding: '8px 0',
    width: '100%',
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
    const {data, onClick, brush} = props;
    const [[brushStart, brushEnd], setBrushData] = React.useState(brush ? [brush.initialStart, brush.initialEnd] : [0, 0]);
    const [onUpdate] = useDebouncedCallback((start, end) => brush!.onUpdate(start, end), 1000);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const [width, setWidth] = React.useState(0);
    const windowSize = useWindowSize();
    React.useEffect(() => {
        const wrapper = wrapperRef.current;
        setWidth(wrapper!.offsetWidth);
    }, [windowSize]);
    React.useEffect(() => {
        if (brush) {
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
    const msInPixel = durationInMs / width;
    const [brushPosition, setBrushPosition] = React.useState<number | null>(0);
    return (
        <Wrapper
            ref={wrapperRef}
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
                if (!brush || !brushPosition || Math.abs(brushPosition - position) < 3) {
                    onClick(position * msInPixel);
                }
            }}
            paranja={!props.data}
            style={{height: props.height}}
        >
            <WaveformForm
                width={width}
                height={props.height}
                points={points}
                color={props.color}
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

interface FormProps {
    points: number[];
    width: number;
    height: number;
    color: string;
}

const LINE_DENSITY = 2;
const LINE_PADDING = 2;

const WaveformForm: React.FC<FormProps> = (props) => {
    const {points, height, width, color} = props;
    const middle = height / 2;
    const offsetValue = LINE_DENSITY + LINE_PADDING;
    const pointsAmount = Math.ceil(width / offsetValue);
    const amountOfValues = points.length / pointsAmount;
    const rects = React.useMemo(() => {
        const medians = (new Array(pointsAmount)).fill(null)
            .map((_, index) => {
                const minIndex = Math.floor(amountOfValues * index);
                const maxIndex = Math.ceil(amountOfValues * (index + 1)) + 1;
                const localPoints = points.slice(minIndex, maxIndex);
                return localPoints.reduce((m, v) => m + Math.abs(v), 0) / localPoints.length * middle;
            });
        const maxValue = medians.reduce((m, v) => m > v ? m : v, medians[0]);
        const adjustRatio = middle / maxValue;
        return medians.map((median, index) => {
            const adjustedMedian = median * adjustRatio;
            return (
                <rect
                    key={index}
                    fill={color}
                    x={index * offsetValue}
                    y={middle - adjustedMedian}
                    width="2"
                    height={adjustedMedian * 2}
                />
            );
        })
    }, [amountOfValues, pointsAmount, points]);
    return (
        <svg width={width} height={height}>
            {rects}
        </svg>
    );
};

export default Waveform;
