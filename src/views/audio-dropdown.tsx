import React from 'react';
import styled from 'styled-components/macro';
import {uploadFile} from '../utils/audio-utils';

interface Props {
    texts: {
        no: number;
        title: string;
    };
    audioContext: AudioContext;
    onFileLoad: (file: AudioBuffer) => void;
}

const Wrapper = styled.div({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    border: '2px dashed currentColor',
    textTransform: 'uppercase',
    height: '100%'
});

const No = styled.div({
    width: 40,
    height: 40,
    borderRadius: 10,
    border: '3px solid white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    fontSize: 24,
    lineHeight: '31px'
});

const Title = styled.div({
    textAlign: 'center',
    margin: '0 20%',
    marginTop: 20
});

const AudioDropdown: React.FC<Props> = (props) => {
    return (
        <Wrapper
            onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            onDrop={async (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (!file) {
                    return;
                }
                const audio = await uploadFile(file, props.audioContext);
                if (!audio) {
                    return;
                }
                props.onFileLoad(audio);
            }}
        >
            <No>{props.texts.no}</No>
            <Title>{props.texts.title}</Title>
        </Wrapper>
    );
};

export default AudioDropdown;
