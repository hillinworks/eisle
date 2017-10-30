import { L, toArray, count, take, firstOrUndefined, sum, any, contains, withMax, withMin } from "../../Utilities/LinqLite";
import { ChordDetail } from "./ChordDetail";
enum FretPressablility {
    MustPress = 0b01,
    CanPress = 0b00,
    MustNotPress = 0b10
}

enum BarreableState {
    CannotBarre,
    FullyBarreable,
    PartiallyBarreable
}

class ColumnPressability {
    readonly strings: FretPressablility[];
    readonly mustPressStrings: number[];
    constructor(pressabilities: FretPressablility[]) {
        this.strings = pressabilities;
        this.mustPressStrings = L(this.strings)
            .where(e => e === FretPressablility.MustPress)
            .select((e, i) => i)
            .toArray();
    }

    clone(): ColumnPressability {
        const clonedFrets = Object.assign([], this.strings);
        return new ColumnPressability(clonedFrets);
    }
}

class ChordPressability {
    readonly columns: ColumnPressability[];
    constructor(columns: ColumnPressability[]) {
        this.columns = columns;
    }

    clone(): ChordPressability {
        const clonedColumns = [];
        for (const column of this.columns) {
            clonedColumns.push(column.clone());
        }
        const clone = new ChordPressability(clonedColumns);
        return clone;
    }
}

class ArrangeContext {
    pressabilities: ChordPressability;
    fingers: FingerRange[];
    private _nonThumbLowestString: number;
    columnIndex: number;
    stringIndex: number;

    constructor() {
        this.columnIndex = 0;
        this.stringIndex = 0;
    }

    get stringCount(): number {
        return this.pressabilities.columns[this.columnIndex].strings.length;
    }

    get columnCount(): number {
        return this.pressabilities.columns.length;
    }

    get nonThumbLowestString(): number {
        return this._nonThumbLowestString;
    }

    set nonThumbLowestString(value: number) {
        this._nonThumbLowestString = value;
        this.stringIndex = Math.max(value, this.stringIndex);
    }

    get currentFretPressability(): FretPressablility {
        return this.getPressability(this.columnIndex, this.stringIndex);
    }

    set currentFretPressability(value: FretPressablility) {
        this.setPressability(this.columnIndex, this.stringIndex, value);
    }

    get isEndOfContext(): boolean {
        return this.columnIndex >= this.columnCount
            || (this.columnIndex === this.columnCount - 1 && this.stringIndex >= this.stringCount);
    }

    getPressability(columnIndex: number, stringIndex: number): FretPressablility {
        return this.pressabilities.columns[columnIndex].strings[stringIndex];
    }

    setPressability(columnIndex: number, stringIndex: number, value: FretPressablility) {
        this.pressabilities.columns[columnIndex].strings[stringIndex] = value;
    }

    skipEmptyFrets() {
        for (; this.columnIndex < this.columnCount; ++this.columnIndex) {
            for (; this.stringIndex < this.stringCount; ++this.stringIndex) {
                if (this.currentFretPressability === FretPressablility.MustPress) {
                    return;
                }
            }
            this.stringIndex = this.nonThumbLowestString;
        }
    }

    clone(): ArrangeContext {
        const context = new ArrangeContext();
        context.pressabilities = this.pressabilities.clone();
        context.fingers = Object.assign([], this.fingers);
        context.nonThumbLowestString = this.nonThumbLowestString;
        context.columnIndex = this.columnIndex;
        context.stringIndex = this.stringIndex;
        return context;
    }
}

const fingerMaxBarreRange = [0, Infinity, 3, 3, 2];

class ChordFingeringArranger {
    private readonly frets: ReadonlyArray<number>;
    private readonly fretRange: { min: number, max: number };

    constructor(frets: ReadonlyArray<number>) {
        this.frets = frets;
        this.fretRange = L(frets).where(f => !isNaN(f) && f > 0).minMax();
    }

    private analysePressabilities(): ChordPressability {
        const columns: ColumnPressability[] = [];
        for (let currentFret = this.fretRange.min; currentFret <= this.fretRange.max; ++currentFret) {
            const pressabilities: FretPressablility[] = [];
            for (let stringIndex = 0; stringIndex < this.frets.length; ++stringIndex) {
                const fret = this.frets[stringIndex];
                if (isNaN(fret) || fret > currentFret) {
                    pressabilities.push(FretPressablility.CanPress);
                } else if (fret === currentFret) {
                    pressabilities.push(FretPressablility.MustPress);
                } else {
                    pressabilities.push(FretPressablility.MustNotPress);
                }
            }
            columns.push(new ColumnPressability(pressabilities));
        }

        return new ChordPressability(columns);
    }

    arrange(): ChordFingering {

        const context = new ArrangeContext();
        context.pressabilities = this.analysePressabilities();
        context.fingers = [];

        const result: ChordFingering[] = [];

        this.tryArrange(false, context.clone(), result);
        this.tryArrange(true, context.clone(), result);

        return L(result).withMin(r => r.rating).firstOrUndefined();
    }

    private fillIdlesIfEndOfContext(context: ArrangeContext): boolean {
        if (context.isEndOfContext) {
            for (let i = context.fingers.length; i < 5; ++i) {
                context.fingers.push(FingerRange.idle);
            }

            return true;
        }

        return false;
    }

    private tryArrange(useThumb: boolean, context: ArrangeContext, result: ChordFingering[]): void {

        if (useThumb) {
            // with a thumb fingering, it's only possible to reach the higher 4 strings with other fingers
            context.nonThumbLowestString = this.frets.length - 4;
            context.stringIndex = context.nonThumbLowestString;

            const thumbFrets: number[] = [];

            for (let i = 0; i < context.columnCount; ++i) {

                // collect possible notes with can be pressed with thumb
                if (context.getPressability(i, 0) === FretPressablility.MustPress) {
                    thumbFrets.push(i + this.fretRange.min);
                }

                // check notes which cannot be reached by neither the thumb nor other fingers
                for (let stringIndex = 1; stringIndex < context.nonThumbLowestString; ++stringIndex) {
                    if (context.getPressability(i, stringIndex) === FretPressablility.MustPress) {
                        return;
                    }

                    context.setPressability(i, stringIndex, FretPressablility.MustNotPress);
                }
            }

            if (thumbFrets.length !== 1) {
                // there are more than 1 note which must be pressed with thumb, or no frets available for a thumb
                return;
            }

            const thumbFret = thumbFrets[0];
            const thumbMaxColumnIndex = 2;   // I can't reach the 4th fret with my thumb
            if (thumbFret > thumbMaxColumnIndex) {
                return;
            }

            // mark this note as it's already pressed by the thumb
            context.setPressability(thumbFret, 0, FretPressablility.MustNotPress);
            context.fingers.push(new FingerRange(thumbFret, 0, 0));

        } else {
            context.nonThumbLowestString = 0;
            context.fingers.push(FingerRange.idle);
        }

        context.skipEmptyFrets();
        if (this.fillIdlesIfEndOfContext(context)) {
            result.push(new ChordFingering(context.fingers, ChordFingering.calculateFingeringRating(this.frets, context.fingers)));
            return;
        }

        this.tryArrangeFingering(false, context.clone(), result);
        this.tryArrangeFingering(true, context.clone(), result);

        return;
    }

    private tryArrangeFingering(allowBarre: boolean, context: ArrangeContext, result: ChordFingering[]): void {
        const columnIndex = context.columnIndex;

        if (context.fingers.length < 4) {
            const contextWithIdle = context.clone();
            contextWithIdle.fingers.push(FingerRange.idle);
            this.tryArrangeFingering(false, contextWithIdle.clone(), result);
            this.tryArrangeFingering(true, contextWithIdle.clone(), result);
        }

        if (allowBarre) {
            let barreStart: number | undefined = undefined;
            // stops at the last MustPress fret
            let barreEnd: number | undefined = undefined;
            // stops at the last CanPress or MustPress fret
            let extendedBarreEnd: number | undefined = undefined;
            for (; context.stringIndex < this.frets.length; ++context.stringIndex) {
                let breakLoop = false;
                switch (context.currentFretPressability) {
                    case FretPressablility.MustPress:
                        if (barreStart === undefined) {
                            barreStart = context.stringIndex;
                        } else {
                            barreEnd = context.stringIndex;
                            extendedBarreEnd = barreEnd;
                        }
                        break;
                    case FretPressablility.MustNotPress: {
                        if (barreStart !== undefined && barreEnd === undefined) {
                            // blocked by a MustNotPress fret, cannot barre
                            return;
                        }
                        breakLoop = true;
                        break;
                    }
                    case FretPressablility.CanPress: {
                        if (extendedBarreEnd !== undefined) {
                            extendedBarreEnd = context.stringIndex;
                        }
                        break;
                    }
                }
                if (breakLoop) {
                    break;
                }
            }

            if (barreEnd === undefined) {
                // no barre found
                return;
            }

            const fingerIndex = context.fingers.length;
            const barreRange = barreEnd - barreStart + 1;
            const maxBarreRange = fingerMaxBarreRange[fingerIndex];

            if (barreRange > maxBarreRange) {
                return;
            } else {
                // barre as many frets as possible
                barreEnd = Math.min(barreStart + maxBarreRange - 1, extendedBarreEnd);
            }

            context.fingers.push(new FingerRange(context.columnIndex + this.fretRange.min, barreStart, barreEnd));
        } else {
            for (; context.stringIndex < this.frets.length; ++context.stringIndex) {
                if (context.currentFretPressability === FretPressablility.MustPress) {
                    context.fingers.push(new FingerRange(context.columnIndex + this.fretRange.min, context.stringIndex));
                    ++context.stringIndex;
                    break;
                }
            }
        }

        context.skipEmptyFrets();
        if (this.fillIdlesIfEndOfContext(context)) {
            result.push(new ChordFingering(context.fingers, ChordFingering.calculateFingeringRating(this.frets, context.fingers)));
            return;
        }

        // if we are still in the same column, we should not start a barre attempt
        const canBarre = columnIndex !== context.columnIndex;

        if (context.fingers.length === 5) {
            if (context.isEndOfContext) {
                result.push(new ChordFingering(context.fingers, ChordFingering.calculateFingeringRating(this.frets, context.fingers)));
            }
            return;
        }

        this.tryArrangeFingering(false, context.clone(), result);
        if (canBarre) {
            this.tryArrangeFingering(true, context.clone(), result);
        }
    }
}

export class FingerRange {

    static readonly idle: FingerRange = new FingerRange();

    readonly fret: number;
    readonly from: number;
    readonly to: number;

    constructor(fret: number = NaN, from: number = NaN, to: number = NaN) {
        this.fret = fret;
        this.from = from;
        this.to = isNaN(to) ? from : to;
    }
}

export class ChordFingering {
    readonly fingers: ReadonlyArray<FingerRange>;
    readonly rating: number;
    constructor(fingers: ReadonlyArray<FingerRange>, rating: number) {
        this.fingers = fingers;
        this.rating = rating;
    }
}


export namespace ChordFingering {
    export function arrangeFingering(frets: ReadonlyArray<number>): ChordFingering {
        return new ChordFingeringArranger(frets).arrange();
    }

    export function calculateFingeringRating(frets: ReadonlyArray<number>, fingering: ReadonlyArray<FingerRange>): number {
        const fretRange = L(frets).where(f => !isNaN(f) && f > 0).minMax();
        const fretSpan = fretRange.max - fretRange.min + 1;

        let rating = 0;
        rating += fretSpan * 1;
        if (fretSpan > 3) {
            // additional penalty for wide-span
            rating += (fretSpan - 3) * 5;
        }

        rating += fretRange.min * 0.4;

        // prefer fingering with less breaks (more continuity, e.g. prefer x02220 more than x02x20)
        let noteAppeared = false;
        let breaks = 0;
        for (let i = 1; i < frets.length; ++i) {
            const fret = frets[i];
            if (isNaN(fret)) {
                if (noteAppeared) {
                    ++breaks;
                }
            } else {
                noteAppeared = true;
            }
        }
        rating += breaks * 5;

        let lastFingerFret = 0;
        for (let i = 0; i < fingering.length; ++i) {

            const finger = fingering[i];

            const isIdle = isNaN(finger.fret);

            if (i > 1 && !isIdle) {
                if (!isNaN(lastFingerFret)) {
                    const fingerSpan = finger.fret - lastFingerFret;
                    // penalty for two fingers getting too divided
                    if (fingerSpan > 1) {
                        rating += Math.pow(fingerSpan * [0, 0, 1.5, 2, 0.5][i], 2);
                    }
                }
            }

            lastFingerFret = finger.fret;

            if (isIdle) {
                continue;
            }
            if (finger.from === finger.to) {
                // penalty for thumb/pinky fingers
                rating += [2, 1, 1, 1, 2.5][i];
            } else {
                // barred chord
                rating += (finger.to - finger.from + 1) * [0, 0.4, 3, 2, 4][i];
            }
        }

        return rating;
    }
}