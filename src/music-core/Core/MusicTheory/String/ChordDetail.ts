import { Chord } from "../Chord";
import { Tuning } from "./Tuning";
import { NoteName } from "../NoteName";
import { Pitch } from "../Pitch";
import { ChordType } from "../ChordType";
import { first, repeat, except, L, contains, all, skip, range, count, min, sum, select } from "../../Utilities/LinqLite";
import { Interval } from "../Interval";
import { ChordFingering, FingerRange } from "./ChordFingering";
import { ChordFingeringPreset } from "./ChordFingeringPreset";

export class OmittedInterval {
    readonly interval: Interval;
    readonly rating: number;

    constructor(interval: Interval, rating: number) {
        this.interval = interval;
        this.rating = rating;
    }
}

export class ChordDetail {
    readonly chord: Chord;
    readonly notes: ReadonlyArray<NoteName>;
    readonly frets: ReadonlyArray<number>;
    readonly omits: ReadonlyArray<OmittedInterval>;
    readonly omitsRating: number;
    fingering: ChordFingering;
    rating: number;

    constructor(chord: Chord, notes: ReadonlyArray<NoteName>, frets: ReadonlyArray<number>, omittedInterval: ReadonlyArray<OmittedInterval>) {
        this.chord = chord;
        this.notes = notes;
        this.frets = frets;
        this.omits = omittedInterval;
        this.omitsRating = sum(omittedInterval, i => i.rating);
    }
}

export namespace ChordDetail {

    export function getChordDetail(chord: Chord, tuning: Tuning): ChordDetail[] {
        return new ChordDetailResolver(chord, tuning).resolve();
    }

}


const MaxFretToFindRoot = 11;
const MaxChordFretWidth = 4;

class ChordDetailResolver {

    private readonly chord: Chord;
    private readonly tuning: Tuning;
    private notes: NoteName[];
    private omittedIntervals: OmittedInterval[];

    constructor(chord: Chord, tuning: Tuning) {
        this.chord = chord;
        this.tuning = tuning;
    }

    resolve(): ChordDetail[] {
        this.notes = this.chord.getNotes();
        this.omittedIntervals = this.getOmittedIntervals();

        const leastNoteCount = this.notes.length - this.omittedIntervals.length;

        let candidates: ChordDetail[] = [];
        for (let i = 0; i <= this.tuning.stringTunings.length - leastNoteCount; ++i) {
            this.resolveChordFretting(candidates, i);
        }

        candidates = this.simplifyCandidates(candidates);
        this.arrangeFingering(candidates);
        this.sortCandidates(candidates);
        return candidates;
    }

    private arrangeFingering(candidates: ChordDetail[]) {
        for (let i = candidates.length - 1; i >= 0; --i) {
            const candidate = candidates[i];
            const fingering = ChordFingeringPreset.getPreset(candidate.frets)
                || ChordFingering.arrangeFingering(candidate.frets);

            if (fingering === undefined) {
                candidates.splice(i, 1);
                continue;
            }

            candidate.fingering = fingering;
            candidate.rating = fingering.rating + candidate.omitsRating;
        }
    }

    private sortCandidates(candidates: ChordDetail[]) {
        candidates.sort((a, b) => {

            if (a.rating !== b.rating) {
                return a.rating - b.rating;
            }

            for (let i = 0; i < a.frets.length; ++i) {
                const fa = isNaN(a.frets[i]) ? 0 : a.frets[i];
                const fb = isNaN(b.frets[i]) ? 0 : b.frets[i];

                if (fa === fb) {
                    continue;
                } else {
                    return fa - fb;
                }
            }

            return 0;
        });
    }

    private simplifyCandidates(candidates: ChordDetail[]) {
        const simplifiedCandidates: ChordDetail[] = [];
        const skipMap: { [index: number]: boolean } = {};
        for (let i = 0; i < candidates.length - 1; ++i) {
            let skipped = false;
            for (let j = 0; j < candidates.length - 1; ++j) {
                if (i === j) {
                    continue;
                }
                if (skipMap[j]) {
                    continue;
                }
                if (this.simplifySkip(candidates[i], candidates[j])) {
                    skipped = true;
                    skipMap[i] = true;
                    break;
                }
            }
            if (!skipped) {
                simplifiedCandidates.push(candidates[i]);
            }
        }

        return simplifiedCandidates;
    }

    private simplifySkip(c1: ChordDetail, c2: ChordDetail) {
        return all(range(0, this.tuning.stringTunings.length),
            i => c1.frets[i] === c2.frets[i]
                || isNaN(c1.frets[i]));
    }

    private getNoteFretOnString(note: NoteName, stringIndex: number): number {
        return (note.semitones + 12 - this.tuning.stringTunings[stringIndex].noteName.semitones) % 12;
    }

    private getNoteFretOnStringInRange(note: NoteName, stringIndex: number, fromFret: number, toFret: number): number | undefined {
        const fret = this.getNoteFretOnString(note, stringIndex);
        if (fret >= fromFret && fret <= toFret) {
            return fret;
        } else {
            const ottavaAlta = fret + 12;
            if (ottavaAlta >= fromFret && ottavaAlta <= toFret) {
                return ottavaAlta;
            }
        }

        return undefined;
    }

    // generate a list of omittable notes for a chord, especially for high extended chords
    // the notes are in a lease-significant to most-significant order
    private getOmittedIntervals(): OmittedInterval[] {
        const root = this.notes[0];
        const omittedIntervals: OmittedInterval[] = [];
        const type = this.chord.type;

        if ((type & (ChordType.Mask7 | ChordType.Mask9 | ChordType.Mask11 | ChordType.Mask13)) !== 0) {
            if ((type & ChordType.Mask5) === ChordType.P5) {
                omittedIntervals.push(new OmittedInterval(Interval.P5, 0));
            }
        }

        const isMinor = (type & ChordType.Mask3) === ChordType.m3;
        const isMajor = (type & ChordType.Mask3) === ChordType.M3;
        const isSeventhMinor = (type & ChordType.Mask7) === ChordType.m7;
        const isNinthMajor = (type & ChordType.Mask9) === ChordType.M9;
        const isEleventhPerfect = (type & ChordType.Mask11) === ChordType.P11;

        const isExtended11th = (type & ChordType.Mask9) > ChordType.OttavaAlta9
            && (type & ChordType.Mask11) > ChordType.OttavaAlta11;
        const isExtended13th = isExtended11th
            && (type & ChordType.Mask13) > ChordType.OttavaAlta13;

        if (isExtended13th) {

            // remove P11 because it is a weak tendency tone and dissonance with the 3rd
            if (isEleventhPerfect) {
                // however the dissonance is more tolerable if this is a minor chord
                omittedIntervals.push(new OmittedInterval(Interval.P11, isMinor ? 0 : -2));
            }

            // remove M9 because it is a weak tendency tone
            if (isNinthMajor) {
                omittedIntervals.push(new OmittedInterval(Interval.M9, 0));
            }

            if (isMinor) {
                // in minor 13th, omit m7 because it only has a slight tendency (the d5 between M3 and m7 disappeared)
                if (isSeventhMinor) {
                    omittedIntervals.push(new OmittedInterval(Interval.m7, 1));
                }
            }
        } else if (isExtended11th) {

            if (isMajor && isEleventhPerfect) {
                // remove M3 because of the dissonance with P11
                omittedIntervals.push(new OmittedInterval(Interval.M3, -2));
            }

            // remove M9 because it is a weak tendency tone
            if (isNinthMajor) {
                omittedIntervals.push(new OmittedInterval(Interval.M9, 0));
            }
        }

        return omittedIntervals;
    }


    private resolveChordFretting(candidates: ChordDetail[], stringIndex: number) {
        const frets: number[] = [];
        const currentNotes: NoteName[] = [];
        for (let i = 0; i < stringIndex; ++i) {
            frets.push(NaN);
            currentNotes.push(undefined);
        }
        const rootFret = this.getNoteFretOnString(this.notes[0], stringIndex);
        frets.push(rootFret);
        currentNotes.push(this.notes[0]);

        if (this.omittedIntervals.length === 0) {
            this.resolveChordFrettingRecursive(
                candidates,
                frets,
                this.notes,
                L(this.notes).skip(1).toArray(),
                currentNotes,
                [],
                rootFret - MaxChordFretWidth + 1,
                rootFret + MaxChordFretWidth - 1);
        } else {
            // make full combination of omittable notes
            for (let mask = 0; mask < (1 << this.omittedIntervals.length); ++mask) {
                const omittedIntervals: OmittedInterval[] = [];
                for (let i = 0; i < this.omittedIntervals.length; ++i) {
                    if (mask & (1 << i)) {
                        omittedIntervals.push(this.omittedIntervals[i]);
                    }
                }
                const allNotes = L(this.notes)
                    .where(n => {
                        const interval = this.chord.root.getIntervalTo(n);
                        return all(omittedIntervals, i => !i.interval.equals(interval));
                    }).toArray();
                this.resolveChordFrettingRecursive(
                    candidates,
                    frets,
                    allNotes,
                    L(allNotes).skip(1).toArray(),
                    currentNotes,
                    omittedIntervals,
                    rootFret - MaxChordFretWidth + 1,
                    rootFret + MaxChordFretWidth - 1);
            }
        }

        return candidates;
    }

    private resolveChordFrettingRecursive(
        candidates: ChordDetail[],
        currentFrets: ReadonlyArray<number>,
        allNotes: ReadonlyArray<NoteName>,
        remainingNotes: ReadonlyArray<NoteName>,
        currentNotes: ReadonlyArray<NoteName>,
        omittedIntervals: ReadonlyArray<OmittedInterval>,
        minFret: number,
        maxFret: number) {
        const stringIndex = currentFrets.length;
        for (let i = 0; i < allNotes.length; ++i) {
            const note = allNotes[i];

            const newFrets: number[] = Object.assign([], currentFrets);
            const newCurrentNotes: NoteName[] = Object.assign([], currentNotes);

            const fret = this.getNoteFretOnStringInRange(note, stringIndex, minFret, maxFret);

            let newRemainingNotes: NoteName[] = Object.assign([], remainingNotes);
            let newMinFret = minFret;
            let newMaxFret = maxFret;

            if (fret === undefined) {
                newFrets.push(NaN);
                newCurrentNotes.push(undefined);
            } else {

                newFrets.push(fret);
                newMinFret = Math.max(minFret, fret - MaxChordFretWidth + 1);
                newMaxFret = Math.min(maxFret, fret + MaxChordFretWidth - 1);

                newCurrentNotes.push(note);

                const indexInRemainingNotes = remainingNotes.indexOf(note);
                if (indexInRemainingNotes >= 0) {
                    newRemainingNotes = Object.assign([], remainingNotes);
                    newRemainingNotes.splice(indexInRemainingNotes, 1);
                }
            }

            if (stringIndex === this.tuning.stringTunings.length - 1) {
                if (newRemainingNotes.length === 0) {
                    candidates.push(new ChordDetail(this.chord, newCurrentNotes, newFrets, omittedIntervals));
                }
            } else {
                this.resolveChordFrettingRecursive(
                    candidates,
                    newFrets,
                    allNotes,
                    newRemainingNotes,
                    newCurrentNotes,
                    omittedIntervals,
                    newMinFret,
                    newMaxFret);
            }
        }
    }
}