import React from 'react';
import styled from 'styled-components/macro';
import {area, curveNatural} from 'd3-shape';
import {CustomLayerProps, ResponsiveLine, LineSvgProps, Datum, Serie, Layer, CustomLayer} from '@nivo/line';

export interface SpectrumLinePoint {
    x: number;
    y: number;
}

interface SpectrumLine {
    type: 'line';
    color: string;
    points: SpectrumLinePoint[];
}

export interface SpectrumRangePoint {
    x: number;
    low: number;
    high: number;
}

interface SpectrumRange {
    type: 'range';
    color: string;
    points: SpectrumRangePoint[];
}

type SpectrumDatum = SpectrumRange | SpectrumLine;

interface Props {
    data: SpectrumDatum[];
}

const START_FREQ = 20;
const END_FREQ = 20 * 2048 / 2;
const TOP_DB = 6;
const LOW_DB = -100;

const Wrapper = styled.div({
    width: '100%',
    height: '100%'
});

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

function getAreaLayer(originalData: SpectrumDatum[]): CustomLayer {
    return (props: CustomLayerProps): React.ReactNode => {
        const areaGenerator = area<Datum>()
            .x(d => props.xScale(d.x!))
            .y0(d => props.yScale(d.low))
            .y1(d => props.yScale(d.high))
            .curve(curveNatural);

        return props.data.map((data, index) => {
            if (originalData[index].type !== 'range') {
                return null;
            }
            return (
                <path
                    key={data.id}
                    d={areaGenerator(data.data) || undefined}
                    fill={originalData[index].color}
                    fillOpacity={0.5}
                />
            );
        });
    };
}

function getLayers(data: SpectrumDatum[]): Layer[] {
    return ['grid', 'markers', 'axes', getAreaLayer(data), 'lines', 'points', 'slices', 'mesh', 'legends'];
}

const commonProps: Omit<LineSvgProps, 'data'> = {
    curve: 'monotoneX',
    enablePoints: false,
    animate: false,
    lineWidth: 1,
    axisLeft: {
        legend: 'db'
    },
    margin: {top: 50, right: 50, bottom: 50, left: 50}
};

const FftVisualizer: React.FC<Props> = (props) => {
    const data: Serie[] = props.data.map((spectrum, index) => {
        if (spectrum.type === 'line') {
            return {
                id: index,
                data: spectrum.points
            };
        } else {
            return {
                id: 'range' + index,
                data: spectrum.points.map((point) => ({...point, y: (point.high + point.low) / 2}))
            };
        }
    });
    const visibleDecibelValues = getDecibelValues(LOW_DB);
    const yScale = {
        type: 'linear',
        min: LOW_DB,
        max: TOP_DB
    } as const;
    const xScale = {
        type: 'log',
        min: START_FREQ,
        max: END_FREQ
    } as const;
    const visibleFrequencyValues = getLogarithmicAxisValue(START_FREQ, END_FREQ);
    return (
        <Wrapper>
            <ResponsiveLine
                {...commonProps}
                colors={props.data.map((datum) => datum.type === 'range' ? 'transparent' : datum.color)}
                data={data}
                yScale={yScale}
                gridYValues={visibleDecibelValues}
                axisLeft={{
                    ...commonProps.axisLeft,
                    tickValues: visibleDecibelValues
                }}
                layers={getLayers(props.data)}
                xScale={xScale}
                gridXValues={visibleFrequencyValues}
                axisBottom={{
                    tickRotation: 90,
                    legend: 'frequency',
                    tickValues: visibleFrequencyValues
                }}
            />
        </Wrapper>
    );
};

export default FftVisualizer;
