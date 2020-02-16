import React from 'react';

interface Props {
    audioContext: AudioContext;
    onUpload: (data: AudioBuffer) => void;
}

const Uploader: React.FC<Props> = (props) => {
    return (
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
            style={{padding: '8px 0'}}
        />
    )
};

export default Uploader;
