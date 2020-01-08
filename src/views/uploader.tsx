import React from 'react';
import styled from 'styled-components/macro';

interface Props {
    prompt: string;
    audioContext: AudioContext;
    onUpload: (data: AudioBuffer) => void;
}

const Wrapper = styled.div({
    background: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    padding: 8
});

const Prompt = styled.div({
    paddingBottom: 8
});

const Uploader: React.FC<Props> = (props) => {
    return (
        <Wrapper>
            <Prompt>{props.prompt}</Prompt>
            <input
                type="file"
                onChange={(e) => {
                    if (!e.target.files || e.target.files.length === 0) {
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const decodedData = await props.audioContext.decodeAudioData(event.target!.result as ArrayBuffer);
                            props.onUpload(decodedData);
                        } catch (e) {
                            console.log('Sorry this browser unable to download this file... try Chrome', e);
                        }
                    };

                    reader.onerror = (evt) => {
                        console.error('An error ocurred reading the file: ', evt);
                    };
                    reader.readAsArrayBuffer(e.target.files[0]);
                }}
            />
        </Wrapper>
    )
};

export default Uploader;
