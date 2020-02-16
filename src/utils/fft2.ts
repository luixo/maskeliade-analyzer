function radianToDegree(radian: number): number {
    return radian * (180 / Math.PI);
}

class ComplexNumber {
    re: number;
    im: number;

    constructor({re = 0, im = 0}: {re?: number, im?: number} = {re: 0, im: 0}) {
        this.re = re;
        this.im = im;
    }

    add(addend: ComplexNumber | number): ComplexNumber {
        // Make sure we're dealing with complex number.
        const complexAddend = ComplexNumber.toComplexNumber(addend);

        return new ComplexNumber({
            re: this.re + complexAddend.re,
            im: this.im + complexAddend.im,
        });
    }

    subtract(subtrahend: ComplexNumber | number): ComplexNumber {
        // Make sure we're dealing with complex number.
        const complexSubtrahend = ComplexNumber.toComplexNumber(subtrahend);

        return new ComplexNumber({
            re: this.re - complexSubtrahend.re,
            im: this.im - complexSubtrahend.im,
        });
    }

    multiply(multiplicand:ComplexNumber | number): ComplexNumber {
        // Make sure we're dealing with complex number.
        const complexMultiplicand = ComplexNumber.toComplexNumber(multiplicand);

        return new ComplexNumber({
            re: this.re * complexMultiplicand.re - this.im * complexMultiplicand.im,
            im: this.re * complexMultiplicand.im + this.im * complexMultiplicand.re,
        });
    }

    divide(divider: ComplexNumber | number): ComplexNumber {
        // Make sure we're dealing with complex number.
        const complexDivider = ComplexNumber.toComplexNumber(divider);

        // Get divider conjugate.
        const dividerConjugate = ComplexNumber.conjugate(complexDivider);

        // Multiply dividend by divider's conjugate.
        const finalDivident = this.multiply(dividerConjugate);

        // Calculating final divider using formula (a + bi)(a − bi) = a^2 + b^2
        const finalDivider = (complexDivider.re ** 2) + (complexDivider.im ** 2);

        return new ComplexNumber({
            re: finalDivident.re / finalDivider,
            im: finalDivident.im / finalDivider,
        });
    }

    static conjugate(number: ComplexNumber | number): ComplexNumber {
        // Make sure we're dealing with complex number.
        const complexNumber = ComplexNumber.toComplexNumber(number);

        return new ComplexNumber({
            re: complexNumber.re,
            im: -1 * complexNumber.im,
        });
    }

    getRadius(): number {
        return Math.sqrt((this.re ** 2) + (this.im ** 2));
    }

    getPhase(inRadians = true): number {
        let phase = Math.atan(Math.abs(this.im) / Math.abs(this.re));

        if (this.re < 0 && this.im > 0) {
            phase = Math.PI - phase;
        } else if (this.re < 0 && this.im < 0) {
            phase = -(Math.PI - phase);
        } else if (this.re > 0 && this.im < 0) {
            phase = -phase;
        } else if (this.re === 0 && this.im > 0) {
            phase = Math.PI / 2;
        } else if (this.re === 0 && this.im < 0) {
            phase = -Math.PI / 2;
        } else if (this.re < 0 && this.im === 0) {
            phase = Math.PI;
        } else if (this.re > 0 && this.im === 0) {
            phase = 0;
        } else if (this.re === 0 && this.im === 0) {
            // More correctly would be to set 'indeterminate'.
            // But just for simplicity reasons let's set zero.
            phase = 0;
        }

        if (!inRadians) {
            phase = radianToDegree(phase);
        }

        return phase;
    }

    getPolarForm(inRadians = true): {radius: number, phase: number} {
        return {
            radius: this.getRadius(),
            phase: this.getPhase(inRadians),
        };
    }

    static toComplexNumber(number: ComplexNumber | number): ComplexNumber {
        if (number instanceof ComplexNumber) {
            return number;
        }

        return new ComplexNumber({re: number});
    }
}

function reverseBits(input: number, bitsCount: number): number {
    let reversedBits = 0;

    for (let bitIndex = 0; bitIndex < bitsCount; bitIndex += 1) {
        reversedBits *= 2;

        if (Math.floor(input / (1 << bitIndex)) % 2 === 1) {
            reversedBits += 1;
        }
    }

    return reversedBits;
}

function bitLength(number: number): number {
    let bitsCounter = 0;

    while ((1 << bitsCounter) <= number) {
        bitsCounter += 1;
    }

    return bitsCounter;
}

function fft(rawInputData: number[]): number[] {
    const inputData = rawInputData.map(ComplexNumber.toComplexNumber);
    const bitsCount = bitLength(inputData.length - 1);
    const N = 1 << bitsCount;

    while (inputData.length < N) {
        inputData.push(new ComplexNumber());
    }

    const output: ComplexNumber[] = [];
    for (let dataSampleIndex = 0; dataSampleIndex < N; dataSampleIndex += 1) {
        output[dataSampleIndex] = inputData[reverseBits(dataSampleIndex, bitsCount)];
    }

    for (let blockLength = 2; blockLength <= N; blockLength *= 2) {
        const phaseStep = new ComplexNumber({
            re: Math.cos(2 * Math.PI / blockLength),
            im: Math.sin(2 * Math.PI / blockLength),
        });

        for (let blockStart = 0; blockStart < N; blockStart += blockLength) {
            let phase = new ComplexNumber({ re: 1, im: 0 });

            for (let signalId = blockStart; signalId < (blockStart + blockLength / 2); signalId += 1) {
                const component = output[signalId + blockLength / 2].multiply(phase);

                const upd1 = output[signalId].add(component);
                const upd2 = output[signalId].subtract(component);

                output[signalId] = upd1;
                output[signalId + blockLength / 2] = upd2;

                phase = phase.multiply(phaseStep);
            }
        }
    }

    const halfBins = inputData.length / 2;
    return output
        .slice(0, halfBins)
        // converted to db
        .map((n) => 20 * Math.log10(n.getRadius() / halfBins));
}

export {fft};
