import { Chord } from "../Chord";
import { Tuning } from "./Tuning";
import { NoteName } from "../NoteName";
import { Pitch } from "../Pitch";
import { ChordType } from "../ChordType";
import { first, repeat, except, L, contains, all, skip, range } from "../../Utilities/LinqLite";
import { Interval } from "../Interval";


export namespace ChordFingering {

    export function getChordFingerings(chord: Chord, tuning: Tuning): ChordFingeringCandidate[] {
        return new ChordFingeringResolver(chord, tuning).resolve();
    }

}

export class ChordFingeringCandidate {
    readonly fingerings: number[];
    readonly omittedIntervals: Interval[];

    constructor(fingering: number[], omittedInterval: Interval[]) {
        this.fingerings = fingering;
        this.omittedIntervals = omittedInterval;
    }
}

const MaxFretToFindRoot = 11;
const MaxFingeringFretWidth = 5;

class ChordFingeringResolver {

    private readonly chord: Chord;
    private readonly tuning: Tuning;
    private notes: NoteName[];
    private omittedIntervals: Interval[];

    constructor(chord: Chord, tuning: Tuning) {
        this.chord = chord;
        this.tuning = tuning;
    }

    resolve(): ChordFingeringCandidate[] {
        this.notes = this.chord.getNotes();
        this.omittedIntervals = this.getOmittedIntervals();

        const leastNoteCount = this.notes.length - this.omittedIntervals.length;

        let candidates: ChordFingeringCandidate[] = [];
        for (let i = 0; i <= this.tuning.stringTunings.length - leastNoteCount; ++i) {
            this.resolveChordFingerings(candidates, i);
        }

        candidates = this.simplifyCandidates(candidates);
        this.sortCandidates(candidates);
        return candidates;
    }

    private sortCandidates(candidates: ChordFingeringCandidate[]) {
        candidates.sort((a, b) => {
            if (a.omittedIntervals.length != b.omittedIntervals.length) {
                return a.omittedIntervals.length - b.omittedIntervals.length;
            }

            for (let i = 0; i < a.fingerings.length; ++i) {
                const fa = a.fingerings[i];
                const fb = b.fingerings[i];
                if (fa === fb) {
                    continue;
                } else if (isNaN(fa) && isNaN(fb)) {
                    continue;
                } else if (isNaN(fa)) {
                    return -fb;
                } else if (isNaN(fb)) {
                    return fa;
                } else {
                    return fa - fb;
                }
            }

            return 0;
        });
    }

    private simplifyCandidates(candidates: ChordFingeringCandidate[]) {
        const simplifiedCandidates: ChordFingeringCandidate[] = [];
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

    private simplifySkip(c1: ChordFingeringCandidate, c2: ChordFingeringCandidate) {
        return all(range(0, this.tuning.stringTunings.length),
            i => c1.fingerings[i] === c2.fingerings[i]
                || isNaN(c1.fingerings[i]));
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
    private getOmittedIntervals(): Interval[] {
        const root = this.notes[0];
        const omittedIntervals: Interval[] = [];
        const type = this.chord.type;

        if ((type & (ChordType.Mask7 | ChordType.Mask9 | ChordType.Mask11 | ChordType.Mask13)) !== 0) {
            if ((type & ChordType.Mask5) === ChordType.P5) {
                omittedIntervals.push(Interval.P5);
            }
        }

        const isMinor = (type & ChordType.Mask3) === ChordType.m3;
        const isMajor = (type & ChordType.Mask3) === ChordType.M3;
        const isSeventhMinor = (type & ChordType.Mask7) === ChordType.m7;
        const isNinthMajor = (type & ChordType.Mask9) === ChordType.M9;
        const isEleventhPerfect = (type & ChordType.Mask11) === ChordType.P11;

        if (type & ChordType.OttavaAlta13) {

            // remove P11 because it is a weak tendency tone
            if (isEleventhPerfect) {
                omittedIntervals.push(Interval.P11);
            }

            // remove M9 because it is a weak tendency tone
            if (isNinthMajor) {
                omittedIntervals.push(Interval.M9);
            }

            if (isMinor) {
                // in minor 13th, omit m7 because it only has a slight tendency (the d5 between M3 and m7 disappeared)
                if (isSeventhMinor) {
                    omittedIntervals.push(Interval.m7);
                }
            }
        } else if (type & ChordType.OttavaAlta11) {

            if (isMajor && isEleventhPerfect) {
                // remove M3 because of the dissonance with P11
                omittedIntervals.push(Interval.M3);
            }

            // remove M9 because it is a weak tendency tone
            if (isNinthMajor) {
                omittedIntervals.push(Interval.M9);
            }
        }

        return omittedIntervals;
    }


    private resolveChordFingerings(candidates: ChordFingeringCandidate[], stringIndex: number) {
        const fingerings: number[] = [];
        for (let i = 0; i < stringIndex; ++i) {
            fingerings.push(NaN);
        }
        const rootFret = this.getNoteFretOnString(this.notes[0], stringIndex);
        fingerings.push(rootFret);

        if (this.omittedIntervals.length === 0) {
            this.resolveChordFingeringsRecursive(
                candidates,
                fingerings,
                this.notes,
                L(this.notes).skip(1).toArray(),
                [],
                rootFret - MaxFingeringFretWidth + 1,
                rootFret + MaxFingeringFretWidth - 1);
        } else {
            // make full combination of omittable notes
            for (let mask = 0; mask < (1 << this.omittedIntervals.length); ++mask) {
                const omittedIntervals: Interval[] = [];
                for (let i = 0; i < this.omittedIntervals.length; ++i) {
                    if (mask & (1 << i)) {
                        omittedIntervals.push(this.omittedIntervals[i]);
                    }
                }
                const notes = L(this.notes)
                    .where(n => {
                        const interval = this.notes[0].getIntervalTo(n);
                        return all(omittedIntervals, i => !i.equals(interval));
                    }).toArray();
                this.resolveChordFingeringsRecursive(
                    candidates,
                    fingerings,
                    notes,
                    L(notes).skip(1).toArray(),
                    omittedIntervals,
                    rootFret - MaxFingeringFretWidth + 1,
                    rootFret + MaxFingeringFretWidth - 1);
            }
        }

        return candidates;
    }

    private resolveChordFingeringsRecursive(
        candidates: ChordFingeringCandidate[],
        currentFingerings: number[],
        allNotes: NoteName[],
        remainingNotes: NoteName[],
        omittedIntervals: Interval[],
        minFret: number,
        maxFret: number) {
        const stringIndex = currentFingerings.length;
        for (let i = 0; i < allNotes.length; ++i) {
            const note = allNotes[i];

            const newFingerings: number[] = Object.assign([], currentFingerings);

            const fret = this.getNoteFretOnStringInRange(note, stringIndex, minFret, maxFret);

            let newRemainingNotes = remainingNotes;
            let newMinFret = minFret;
            let newMaxFret = maxFret;

            if (fret === undefined) {
                newFingerings.push(NaN);
            } else {

                newFingerings.push(fret);
                newMinFret = Math.max(minFret, fret - MaxFingeringFretWidth + 1);
                newMaxFret = Math.min(maxFret, fret + MaxFingeringFretWidth - 1);

                const indexInRemainingNotes = remainingNotes.indexOf(note);
                if (indexInRemainingNotes >= 0) {
                    newRemainingNotes = Object.assign([], remainingNotes);
                    newRemainingNotes.splice(indexInRemainingNotes, 1);
                }
            }

            if (stringIndex === this.tuning.stringTunings.length - 1) {
                if (newRemainingNotes.length === 0) {
                    candidates.push(new ChordFingeringCandidate(newFingerings, omittedIntervals));
                }
            } else {
                this.resolveChordFingeringsRecursive(candidates, newFingerings, allNotes, newRemainingNotes, omittedIntervals, newMinFret, newMaxFret);
            }
        }
    }
}