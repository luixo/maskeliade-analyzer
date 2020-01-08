import React from 'react';
import {area, curveNatural} from 'd3-shape';
import {CustomLayerProps, ResponsiveLine, LineSvgProps, Datum, Serie} from '@nivo/line';

export interface SpectrumStreamPoint {
    x: number;
    low: number;
    high: number;
}

interface Props {
    data: Float32Array;
    model?: SpectrumStreamPoint[];
}

const END_FREQ = 20 * 2048 / 2;
const TOP_DB = 6;
const LOW_DB = -180;

const AreaLayer = ({data, xScale, yScale}: CustomLayerProps): React.ReactNode => {
    const model = data.find(({id}) => id === 'model');
    if (!model) {
        return;
    }
    const areaGenerator = area<Datum>()
        .x(d => xScale(d.x!))
        .y0(d => yScale(d.low))
        .y1(d => yScale(d.high))
        .curve(curveNatural);

    return <path d={areaGenerator(model.data) || undefined} fill="rgba(140, 219, 243, .5)" />;
};

function getLogarithmicAxisValue(from: number, to: number): number[] {
    let min = Math.floor(Math.log10(from));
    if (min === Infinity) {
        min = 1;
    }
    const max = Math.ceil(Math.log10(to));
    return new Array(max - min + 1).fill(null).reduce<number[]>((memo, _, index) => {
        return memo.concat(new Array(9).fill(null).map((_, subindex) => {
            return (subindex + 1) * (10 ** (index + 1));
        }));
    }, []).filter((val) => val >= from && val <= to);
}

function getDecibelValues(range: number): number[] {
    return [TOP_DB, 0, -6, -12, -18, -24, -40, -60, -120, -180].filter((value) => value >= range);
}

const commonProps: Omit<LineSvgProps, 'data'> = {
    curve: 'monotoneX',
    enablePoints: false,
    animate: false,
    lineWidth: 1,
    layers: ['grid', 'markers', 'axes', AreaLayer, 'lines', 'points', 'slices', 'mesh', 'legends'],
    axisLeft: {
        legend: 'db'
    },
    margin: {top: 50, right: 50, bottom: 50, left: 50},
    colors: ['rgba(100, 200, 255, 127)', 'transparent']
};

const FftVisualizer: React.FC<Props> = (props) => {
    const size = props.data.length;
    const freqDelta = 48000 / (size * 2);
    const parsed = props.data.reduce<{x: number, y: number | null}[]>((memo, point, index) => {
        const nextValue = point;
        return memo.concat({
            x: index * freqDelta,
            y: nextValue < LOW_DB ? null : nextValue
        });
    }, []).slice(1, -1);
    const data: Serie[] = [{
        id: 'fft',
        data: parsed
    }];
    if (props.model) {
        data.push({
            id: 'model',
            data: props.model.map((model) => ({...model, y: (model.high + model.low) / 2}))
        });
    }
    const minDecibel = parsed.reduce((memo, value) => Math.min(memo, value.y || 0), -10);
    const visibleDecibelValues = getDecibelValues(minDecibel);
    const visibleFrequencyValues = getLogarithmicAxisValue(freqDelta, END_FREQ);
    return (
        <ResponsiveLine
            {...commonProps}
            data={data}
            yScale={{
                type: 'linear',
                min: minDecibel,
                max: TOP_DB
            }}
            gridYValues={visibleDecibelValues}
            axisLeft={{
                ...commonProps.axisLeft,
                tickValues: visibleDecibelValues
            }}
            xScale={{
                type: 'log',
                min: freqDelta,
                max: END_FREQ
            }}
            gridXValues={visibleFrequencyValues}
            axisBottom={{
                tickRotation: 90,
                legend: 'frequency',
                tickValues: visibleFrequencyValues
            }}
        />
    );
};

export default FftVisualizer;
