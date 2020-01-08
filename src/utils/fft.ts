interface FftPreparation {
    levels: number;
    sinTable: number[];
    cosTable: number[];
}

const cache: Record<number, FftPreparation> = {};

function prepareFft(n: number): FftPreparation {
    if (cache[n]) {
        return cache[n];
    }

    let levels = -1;
    for (let i = 0; i < 32; i++) {
        if (1 << i === n) {
            levels = i;
        }
    }

    let cosTable = new Array(n / 2);
    let sinTable = new Array(n / 2);
    for (let i = 0; i < n / 2; i++) {
        cosTable[i] = Math.cos(2 * Math.PI * i / n);
        sinTable[i] = Math.sin(2 * Math.PI * i / n);
    }
    cache[n] = {levels, cosTable, sinTable};
    return cache[n];
}

function forward(n: number, real: number[]): number[] {
    const fftOptions = prepareFft(n);
    const imag = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        const j = reverseBits(i, fftOptions.levels);
        if (j > i) {
            let temp = real[i];
            real[i] = real[j];
            real[j] = temp;
            temp = imag[i];
            imag[i] = imag[j];
            imag[j] = temp;
        }
    }

    for (let size = 2; size <= n; size *= 2) {
        const halfsize = size / 2;
        const tablestep = n / size;
        for (let i = 0; i < n; i += size) {
            for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
                const tpReal =  real[j + halfsize] * fftOptions.cosTable[k] +
                    imag[j + halfsize] * fftOptions.sinTable[k];
                const tpImag = -real[j + halfsize] * fftOptions.sinTable[k] +
                    imag[j + halfsize] * fftOptions.cosTable[k];
                real[j + halfsize] = real[j] - tpReal;
                imag[j + halfsize] = imag[j] - tpImag;
                real[j] += tpReal;
                imag[j] += tpImag;
            }
        }
    }

    let result = [];
    for (let i = 0; i < n; i++) {
        result[i] = Math.sqrt(sqr(real[i]) * sqr(imag[i]));
    }
    return result;
}

function sqr(x: number): number {
    return x * x;
}

function reverseBits(x: number, bits: number): number {
    let y = 0;
    for (let i = 0; i < bits; i++) {
        y = (y << 1) | (x & 1);
        x >>>= 1;
    }
    return y;
}

export {forward};
