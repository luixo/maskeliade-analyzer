function uploadFile(
    file: File,
    audioContext: AudioContext
): Promise<AudioBuffer | undefined> {
    return new Promise(async (resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const decodedData = await audioContext.decodeAudioData(event.target!.result as ArrayBuffer);
                resolve(decodedData);
            } catch (e) {
                console.log('Sorry this browser unable to download this file... try Chrome', e);
            }
        };
        reader.onerror = (evt) => {
            console.error('An error ocurred reading the file: ', evt);
            reject(evt);
        };
        reader.readAsArrayBuffer(file);
    })
}

export {uploadFile};
