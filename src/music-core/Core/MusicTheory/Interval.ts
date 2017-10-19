import { IntervalQuality } from "./IntervalQuality";
import { StringBuilder } from "../Utilities/StringBuilder";

export class Interval {

    readonly number: number;
    readonly quality: IntervalQuality;

    constructor(number: number, quality: IntervalQuality) {
        if (!Interval.isValid(number, quality))
            throw new RangeError("number and quality mismatch");

        this.number = number;
        this.quality = quality;
    }

    get octaves(): number {
        return Math.trunc(this.number / 7);
    }

    get normalizedNumber(): number {
        return this.number % 7;
    }

    get couldBePerfect(): boolean {
        const normalizedNumber = this.normalizedNumber;
        return normalizedNumber === 0 || normalizedNumber === 3 || normalizedNumber === 4;
    }

    get semitoneOffset() {
        let baseValue: number;
        const normalizedNumber = this.normalizedNumber;
        switch (normalizedNumber) {
            case 0: baseValue = 0; break;
            case 1: baseValue = 1; break;
            case 2: baseValue = 3; break;
            case 3: baseValue = 5; break;
            case 4: baseValue = 7; break;
            case 5: baseValue = 8; break;
            case 6: baseValue = 10; break;
            default:
                throw new RangeError();
        }

        switch (this.quality) {
            case IntervalQuality.Major:
                baseValue += 1; break;
            case IntervalQuality.Augmented:
                if (this.couldBePerfect)
                    baseValue += 1;
                else
                    baseValue += 2;
                break;
            case IntervalQuality.Diminished:
                baseValue -= 1; break;
        }

        return this.octaves * 12 + baseValue;
    }

    equals(other: Interval): boolean {
        return other && this.number === other.number && this.quality === other.quality;
    }


    toString(): string {
        const builder = new StringBuilder();
        switch (this.quality) {
            case IntervalQuality.Perfect:
                builder.append("P"); break;
            case IntervalQuality.Major:
                builder.append("M"); break;
            case IntervalQuality.Minor:
                builder.append("m"); break;
            case IntervalQuality.Augmented:
                builder.append("A"); break;
            case IntervalQuality.Diminished:
                builder.append("d"); break;
        }

        builder.append((this.number + 1).toString());
        return builder.toString();
    }
    // todo: implement toString
}

export namespace Interval {

    // must be declared before the consts below
    export function isValid(number: number, quality: IntervalQuality): boolean {
        const normalizedNumber = number % 7;
        if (normalizedNumber === 0 || normalizedNumber === 3 || normalizedNumber === 4)
            return quality !== IntervalQuality.Major && quality !== IntervalQuality.Minor;
        else
            return quality !== IntervalQuality.Perfect;
    }

    // ReSharper disable InconsistentNaming
    export const P1 = new Interval(0, IntervalQuality.Perfect);
    export const m2 = new Interval(1, IntervalQuality.Minor);
    export const M2 = new Interval(1, IntervalQuality.Major);
    export const m3 = new Interval(2, IntervalQuality.Minor);
    export const M3 = new Interval(2, IntervalQuality.Major);
    export const P4 = new Interval(3, IntervalQuality.Perfect);
    export const P5 = new Interval(4, IntervalQuality.Perfect);
    export const m6 = new Interval(5, IntervalQuality.Minor);
    export const M6 = new Interval(5, IntervalQuality.Major);
    export const m7 = new Interval(6, IntervalQuality.Minor);
    export const M7 = new Interval(6, IntervalQuality.Major);
    export const P8 = new Interval(7, IntervalQuality.Perfect);
    export const m9 = new Interval(8, IntervalQuality.Minor);
    export const M9 = new Interval(8, IntervalQuality.Major);
    export const m10 = new Interval(9, IntervalQuality.Minor);
    export const M10 = new Interval(9, IntervalQuality.Major);
    export const P11 = new Interval(10, IntervalQuality.Perfect);
    export const P12 = new Interval(11, IntervalQuality.Perfect);
    export const m13 = new Interval(12, IntervalQuality.Minor);
    export const M13 = new Interval(12, IntervalQuality.Major);
    export const m14 = new Interval(13, IntervalQuality.Minor);
    export const M14 = new Interval(13, IntervalQuality.Major);
    export const P15 = new Interval(14, IntervalQuality.Perfect);
    export const A1 = new Interval(0, IntervalQuality.Augmented);
    export const A2 = new Interval(1, IntervalQuality.Augmented);
    export const A3 = new Interval(2, IntervalQuality.Augmented);
    export const A4 = new Interval(3, IntervalQuality.Augmented);
    export const A5 = new Interval(4, IntervalQuality.Augmented);
    export const A6 = new Interval(5, IntervalQuality.Augmented);
    export const A7 = new Interval(6, IntervalQuality.Augmented);
    export const A8 = new Interval(7, IntervalQuality.Augmented);
    export const A9 = new Interval(8, IntervalQuality.Augmented);
    export const A10 = new Interval(9, IntervalQuality.Augmented);
    export const A11 = new Interval(10, IntervalQuality.Augmented);
    export const A12 = new Interval(11, IntervalQuality.Augmented);
    export const A13 = new Interval(12, IntervalQuality.Augmented);
    export const A14 = new Interval(13, IntervalQuality.Augmented);
    export const A15 = new Interval(14, IntervalQuality.Augmented);
    export const d1 = new Interval(0, IntervalQuality.Diminished);
    export const d2 = new Interval(1, IntervalQuality.Diminished);
    export const d3 = new Interval(2, IntervalQuality.Diminished);
    export const d4 = new Interval(3, IntervalQuality.Diminished);
    export const d5 = new Interval(4, IntervalQuality.Diminished);
    export const d6 = new Interval(5, IntervalQuality.Diminished);
    export const d7 = new Interval(6, IntervalQuality.Diminished);
    export const d8 = new Interval(7, IntervalQuality.Diminished);
    export const d9 = new Interval(8, IntervalQuality.Diminished);
    export const d10 = new Interval(9, IntervalQuality.Diminished);
    export const d11 = new Interval(10, IntervalQuality.Diminished);
    export const d12 = new Interval(11, IntervalQuality.Diminished);
    export const d13 = new Interval(12, IntervalQuality.Diminished);
    export const d14 = new Interval(13, IntervalQuality.Diminished);
    export const d15 = new Interval(14, IntervalQuality.Diminished);
    // ReSharper restore InconsistentNaming

    const semitoneToIntervalLookup = [
        Interval.P1,
        Interval.m2,
        Interval.M2,
        Interval.m3,
        Interval.M3,
        Interval.P4,
        Interval.A4,
        Interval.P5,
        Interval.m6,
        Interval.M6,
        Interval.m7,
        Interval.M7
    ];

    // [0][-1] is used for the following case:
    //      fromSemitones(12, 6)
    // which should return A7.
    const semitoneToIntervalSnappedToDegreeLookup: { [key: number]: Interval }[] = [
    /*0*/ { [-1]: new Interval(-1, IntervalQuality.Augmented), 0: Interval.P1, 1: Interval.d2 },
    /*1*/ { 0: Interval.A1, 1: Interval.m2 },
    /*2*/ { 1: Interval.M2, 2: Interval.d3 },
    /*3*/ { 1: Interval.A2, 2: Interval.m3 },
    /*4*/ { 2: Interval.M3, 3: Interval.d4 },
    /*5*/ { 2: Interval.A3, 3: Interval.P4 },
    /*6*/ { 3: Interval.A4, 4: Interval.d5 },
    /*7*/ { 4: Interval.P5, 5: Interval.d6 },
    /*8*/ { 4: Interval.A5, 5: Interval.m6 },
    /*9*/ { 5: Interval.M6, 6: Interval.d7 },
    /*10*/ { 5: Interval.A6, 6: Interval.m7 },
    /*11*/ { 6: Interval.M7, 0: Interval.d8 },
    ];

    export function fromSemitones(semitones: number, degreeToSnap?: number): Interval {
        const baseSemitones = semitones % 12;
        const octaves = Math.trunc(semitones / 12);
        const additionalDegrees = octaves * 7;
        const baseDegreeToSnap = degreeToSnap === undefined
            ? undefined
            : degreeToSnap - additionalDegrees;
        const baseInterval = baseDegreeToSnap === undefined
            ? semitoneToIntervalLookup[baseSemitones]
            : semitoneToIntervalSnappedToDegreeLookup[baseSemitones][degreeToSnap];

        if (baseInterval === undefined)
            throw new RangeError("cannot resolve to specified degree");

        if (octaves === 0)
            return baseInterval;

        return new Interval(baseInterval.number + additionalDegrees, baseInterval.quality);
    }


}