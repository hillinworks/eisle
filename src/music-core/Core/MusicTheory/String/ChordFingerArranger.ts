import { L, toArray, count, take, firstOrUndefined, sum, any } from "../../Utilities/LinqLite";
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
    arrangeResult: FingerRange[];
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
        context.arrangeResult = Object.assign([], this.arrangeResult);
        context.nonThumbLowestString = this.nonThumbLowestString;
        context.columnIndex = this.columnIndex;
        context.stringIndex = this.stringIndex;
        return context;
    }
}

class Arranger {
    private readonly fingerings: number[];
    private readonly fretRange: { min: number, max: number };

    constructor(fingerings: number[]) {
        this.fingerings = fingerings;
        this.fretRange = L(fingerings).where(f => !isNaN(f) && f > 0).minMax();
    }

    private analysePressabilities(): ChordPressability {
        const columns: ColumnPressability[] = [];
        for (let fret = this.fretRange.min; fret <= this.fretRange.max; ++fret) {
            const pressabilities: FretPressablility[] = [];
            for (let i = 0; i < this.fingerings.length; ++i) {
                const fingering = this.fingerings[i];
                if (isNaN(fingering) || fingering > fret) {
                    pressabilities.push(FretPressablility.CanPress);
                } else if (fingering === fret) {
                    pressabilities.push(FretPressablility.MustPress);
                } else {
                    pressabilities.push(FretPressablility.MustNotPress);
                }
            }
            columns.push(new ColumnPressability(pressabilities));
        }

        return new ChordPressability(columns);
    }

    arrange(): FingerRange[] {

        const context = new ArrangeContext();
        context.pressabilities = this.analysePressabilities();
        context.arrangeResult = [];

        return this.tryArrange(false, context.clone())
            || this.tryArrange(true, context.clone());
    }

    private fillIdlesIfEndOfContext(context: ArrangeContext): boolean {
        if (context.isEndOfContext) {
            for (let i = context.arrangeResult.length; i < 5; ++i) {
                context.arrangeResult.push(FingerRange.idle);
            }

            return true;
        }

        return false;
    }

    private tryArrange(useThumb: boolean, context: ArrangeContext): FingerRange[] | undefined {

        if (useThumb) {
            // with a thumb fingering, it's only possible to reach the higher 4 strings with other fingers
            context.nonThumbLowestString = this.fingerings.length - 4;
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
                        return undefined;
                    }

                    context.setPressability(i, stringIndex, FretPressablility.MustNotPress);
                }
            }

            if (thumbFrets.length > 1) {
                // there are more than 1 note which must be pressed with thumb
                return undefined;
            }

            const thumbFret = thumbFrets[0];
            const thumbMaxColumnIndex = 2;   // I can't reach the 4th fret with my thumb
            if (thumbFret > thumbMaxColumnIndex) {
                return undefined;
            }

            // mark this note as it's already pressed by the thumb
            context.setPressability(thumbFret, 0, FretPressablility.MustNotPress);
            context.arrangeResult.push(new FingerRange(thumbFret, 0, 0));

        } else {
            context.nonThumbLowestString = 0;
            context.arrangeResult.push(FingerRange.idle);
        }

        context.skipEmptyFrets();
        if (this.fillIdlesIfEndOfContext(context)) {
            return context.arrangeResult;
        }

        return this.tryArrangeFinger(false, context.clone())
            || this.tryArrangeFinger(true, context.clone());

    }

    private tryArrangeFinger(allowBarre: boolean, context: ArrangeContext): FingerRange[] | undefined {
        const columnIndex = context.columnIndex;

        if (allowBarre) {
            let barreStart: number | undefined = undefined;
            let barreEnd: number | undefined = undefined;
            for (; context.stringIndex < this.fingerings.length; ++context.stringIndex) {
                switch (context.currentFretPressability) {
                    case FretPressablility.MustPress:
                        if (barreStart === undefined) {
                            barreStart = context.stringIndex;
                        } else {
                            barreEnd = context.stringIndex;
                        }
                        break;
                    case FretPressablility.MustNotPress: {
                        if (barreStart !== undefined && barreEnd === undefined) {
                            // blocked by a MustNotPress fret, cannot barre
                            return undefined;
                        }
                        break;
                    }
                }
            }

            if (barreEnd === undefined) {
                // no barre found
                return undefined;
            }

            context.arrangeResult.push(new FingerRange(context.columnIndex + this.fretRange.min, barreStart, barreEnd));
        } else {
            for (; context.stringIndex < this.fingerings.length; ++context.stringIndex) {
                if (context.currentFretPressability === FretPressablility.MustPress) {
                    context.arrangeResult.push(new FingerRange(context.columnIndex + this.fretRange.min, context.stringIndex));
                    ++context.stringIndex;
                    break;
                }
            }
        }

        context.skipEmptyFrets();
        if (this.fillIdlesIfEndOfContext(context)) {
            return context.arrangeResult;
        }

        // if we are still in the same column, we should not start a barre attempt
        const shouldTryBarre = columnIndex !== context.columnIndex;

        if (context.arrangeResult.length === 5) {
            if (context.isEndOfContext) {
                return context.arrangeResult;
            } else {
                // there are still notes not assigned to fingers
                return undefined;
            }
        }

        const result = this.tryArrangeFinger(false, context.clone());
        if (result !== undefined) {
            return result;
        } else if (shouldTryBarre) {
            return this.tryArrangeFinger(true, context.clone());
        }

        return undefined;
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


export namespace ChordFingerArranger {
    export function arrangeFingers(fingering: number[]): FingerRange[] {
        return new Arranger(fingering).arrange();
    }
}