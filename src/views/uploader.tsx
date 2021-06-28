import React from 'react';
import {uploadFile} from '../utils/audio-utils';

interface Props {
    audioContext: AudioContext;
    onUpload: (data: AudioBuffer) => void;
}

const Uploader: React.FC<Props> = (props) => {
    return (
        <input
            type="file"
            onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) {
                    return;
                }
                const audio = await uploadFile(file, props.audioContext);
                if (audio) {
                    props.onUpload(audio);
                }
            }}
            style={{padding: '8px 0'}}
        />
    )
};

export default Uploader;
