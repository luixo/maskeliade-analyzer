import React from 'react';
import styled from 'styled-components/macro';

interface WithColor {
    color: string;
}

interface Props {
    color?: string;
    initialStart?: number;
    initialEnd?: number;
    handlerWidth?: number;
    height: number;
    width: number;
    onUpdate: (start: number, end: number) => void;
}

const Wrapper = styled.div({
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%'
});

interface WindowProps extends WithColor {
    start: number;
    end: number;
}

const Window = styled.div.attrs<WindowProps>((props) => ({
    style: {
        left: `${props.start * 100}%`,
        width: `${(props.end - props.start) * 100}%`,
    }
}))<WindowProps>((props) => ({
    position: 'absolute',
    top: 0,
    height: '100%',
    borderColor: props.color,
    borderWidth: '1px 0 1px 0',
    borderStyle: 'solid',
    boxSizing: 'border-box',
    background: 'rgba(255, 0, 255, 0.2)'
}));

interface BrushPointStart {
    type: 'start';
    value: number;
}

interface BrushPointWindow {
    type: 'window';
    values: [number, number];
}

interface BrushPointEnd {
    type: 'end';
    value: number;
}

interface BrushMovement {
    min: number;
    startX: number;
    point: BrushPointStart | BrushPointWindow | BrushPointEnd;
    max: number;
}

const BUFFER_ZONE = 0.1;

const Brush: React.FC<Props> = (props) => {
    const handlerWidth = props.handlerWidth || 4;
    const color = props.color || 'red';
    const ref = React.useRef<HTMLDivElement>(null);
    const [start, setStart] = React.useState(props.initialStart || 0);
    const [end, setEnd] = React.useState(props.initialEnd || 1);
    const [movement, setMovement] = React.useState<BrushMovement | null>(null);
    const onHandlerMouseDown = (e: React.MouseEvent, type: 'start' | 'end'): void => {
        e.stopPropagation();
        const element = ref.current;
        if (!element) {
            return;
        }
        const bounds = element.getBoundingClientRect();
        const startX = e.clientX;
        if (type === 'start') {
            const currentEnd = bounds.right - (props.width * (1 - end));
            setMovement({
                min: bounds.left,
                startX,
                point: {
                    type: 'start',
                    value: start
                },
                max: currentEnd
            });
        } else {
            const currentStart = bounds.left + (props.width * start);
            setMovement({
                min: currentStart,
                startX,
                point: {
                    type: 'end',
                    value: end
                },
                max: bounds.right
            });
        }
    };
    const onWindowMouseDown = (e: React.MouseEvent): void => {
        const element = ref.current;
        if (!element) {
            return;
        }
        const bounds = element.getBoundingClientRect();
        const startX = e.clientX;
        const currentStart = bounds.left + (props.width * start);
        const currentEnd = bounds.right - (props.width * (1 - end));
        const distanceToStart = e.clientX - currentStart;
        const distanceToEnd = currentEnd - e.clientX;
        setMovement({
            min: bounds.left + distanceToStart,
            startX,
            point: {
                type: 'window',
                values: [start, end]
            },
            max: bounds.right - distanceToEnd
        });
    };
    const onMouseMove = (e: React.MouseEvent): void => {
        if (!movement) {
            return;
        }
        const nextX = Math.min(movement.max, Math.max(movement.min, e.clientX));
        const delta = (nextX - movement.startX) / props.width;
        if (movement.point.type === 'window') {
            setStart(Math.min(movement.point.values[0] + delta, end - BUFFER_ZONE));
            setEnd(Math.max(movement.point.values[1] + delta, start + BUFFER_ZONE));
        } else if (movement.point.type === 'start') {
            setStart(Math.min(movement.point.value + delta, end - BUFFER_ZONE));
        } else {
            setEnd(Math.max(movement.point.value + delta, start + BUFFER_ZONE));
        }
    };
    const onMouseUp = (e: React.MouseEvent): void => {
        setMovement(null);
        props.onUpdate(start, end);
    };
    return (
        <Wrapper
            ref={ref}
            onMouseMove={onMouseMove}
        >
            <Window
                color={color}
                start={start}
                end={end}
                onMouseDown={onWindowMouseDown}
                onMouseUp={onMouseUp}
            >
                <Line
                    color={color}
                    styleKey="left"
                    width={handlerWidth}
                    onMouseDown={(e) => onHandlerMouseDown(e, 'start')}
                    onMouseUp={onMouseUp}
                />
                <Line
                    color={color}
                    styleKey="right"
                    width={handlerWidth}
                    onMouseDown={(e) => onHandlerMouseDown(e, 'end')}
                    onMouseUp={onMouseUp}
                />
            </Window>
        </Wrapper>
    );
};

interface LineProps extends WithColor {
    width: number;
    styleKey: 'left' | 'right';
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
}

const LineWrapper = styled.div<WithColor>((props) => ({
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 1,
    background: props.color
}));

interface HandlerProps extends WithColor {
    width: number
}

const LineHandler = styled.div<HandlerProps>((props) => ({
    position: 'absolute',
    top: '20%',
    height: '60%',
    borderRadius: props.width / 2,
    width: props.width,
    left: -((props.width - 1) / 2),
    cursor: 'col-resize',
    background: props.color
}));

const Line: React.FC<LineProps> = (props) => (
    <LineWrapper color={props.color} style={{[props.styleKey]: 0}}>
        <LineHandler
            color={props.color}
            width={props.width}
            onMouseDown={props.onMouseDown}
            onMouseUp={props.onMouseUp}
        />
    </LineWrapper>
);

export default Brush;
