import React from 'react';
import styled from 'styled-components/macro';
import Uploader from './uploader';

interface Props {
    title: string;
    isPaused: boolean;
    onPlay: () => void;
    onPause: () => void;
    isFileLoaded: boolean;
    audioContext: AudioContext;
    onFileLoad: (file: AudioBuffer) => void;
    progress?: {
        text: string;
        percentage?: number;
    };
    colors: {
        immediate: string;
        range: string;
    };
}

const Wrapper = styled.div({
    padding: 20,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

const ControlGroup = styled.div<{paranja: boolean}>((props) => ({
    position: 'relative',
    padding: '0 8px',
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

const Button = styled.div<{isActive: boolean}>((props) => ({
    opacity: props.isActive ? 1 : 0.5,
    cursor: 'pointer'
}));

const Progress = styled.div(() => ({
    fontSize: 12
}));

const Main = styled.div({
    background: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    padding: 8
});

const Header = styled.div({
    display: 'inline-flex'
});

const Color = styled.div<{color: string}>(({color}) => ({
    width: 15,
    height: 15,
    backgroundColor: color,
    marginLeft: 6
}));

const Controls: React.FC<Props> = (props) => {
    return (
        <Wrapper>
            <ControlGroup paranja={!props.isFileLoaded}>
                <Button isActive={!props.isPaused} onClick={props.onPlay}>
                    <svg viewBox="0 0 512 512" width="24px" height="24px" xmlns="http://www.w3.org/2000/svg"><path d="m256 0c-140.96875 0-256 115.050781-256 256 0 140.96875 115.050781 256 256 256 140.96875 0 256-115.050781 256-256 0-140.96875-115.050781-256-256-256zm0 482c-124.617188 0-226-101.382812-226-226s101.382812-226 226-226 226 101.382812 226 226-101.382812 226-226 226zm0 0"/><path d="m181 404.027344 222.042969-148.027344-222.042969-148.027344zm30-240 137.957031 91.972656-137.957031 91.972656zm0 0"/></svg>
                </Button>
                <Button isActive={props.isPaused} onClick={props.onPause}>
                    <svg viewBox="0 0 512 512" width="24px" height="24px" xmlns="http://www.w3.org/2000/svg"><path d="m256 0c-140.96875 0-256 115.050781-256 256 0 140.96875 115.050781 256 256 256 140.96875 0 256-115.050781 256-256 0-140.972656-115.050781-256-256-256zm0 482c-124.617188 0-226-101.382812-226-226s101.382812-226 226-226 226 101.382812 226 226-101.382812 226-226 226zm0 0"/><path d="m151 361h90v-210h-90zm30-180h30v150h-30zm0 0"/><path d="m271 361h90v-210h-90zm30-180h30v150h-30zm0 0"/></svg>
                </Button>
            </ControlGroup>
            <Main>
                <Header>
                    {props.title}
                    <Color color={props.colors.range} />
                    <Color color={props.colors.immediate} />
                </Header>
                <Uploader
                    audioContext={props.audioContext}
                    onUpload={props.onFileLoad}
                />
                {props.progress ?
                    <Progress>
                        <span>{props.progress.text}</span>
                        {typeof props.progress.percentage === 'number' ?
                            <span>: {Math.floor(props.progress.percentage * 100)} / 100</span> :
                            null
                        }
                    </Progress> :
                    null
                }
            </Main>
        </Wrapper>
    )
};

export default Controls;
