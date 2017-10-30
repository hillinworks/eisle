import { Chord } from "../Chord";
import { Tuning } from "./Tuning";
import { NoteName } from "../NoteName";
import { Pitch } from "../Pitch";
import { ChordType } from "../ChordType";
import { first, repeat, except, L, contains, all, skip, range, count, min, sum, select } from "../../Utilities/LinqLite";
import { Interval } from "../Interval";
import { ChordFingering, FingerRange } from "./ChordFingering";
import { ChordFingeringPreset } from "./ChordFingeringPreset";

export class ChordDetail {
    readonly chord: Chord;
    readonly notes: ReadonlyArray<NoteName>;
    readonly frets: ReadonlyArray<number>;
    readonly omittedIntervals: ReadonlyArray<Interval>;
    fingering: FingerRange[];
    rating: number;

    constructor(chord: Chord, notes: ReadonlyArray<NoteName>, frets: ReadonlyArray<number>, omittedInterval: ReadonlyArray<Interval>) {
        this.chord = chord;
        this.notes = notes;
        this.frets = frets;
        this.omittedIntervals = omittedInterval;
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
    private omittedIntervals: Interval[];

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

    private calculateFingeringRating(detail: ChordDetail): number {
        const fretRange = L(detail.frets).where(f => !isNaN(f) && f > 0).minMax();
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
        for (const fret of detail.frets) {
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
        for (let i = 0; i < detail.fingering.length; ++i) {

            const finger = detail.fingering[i];

            if (i > 1) {
                if (!isNaN(lastFingerFret)) {
                    const fingerSpan = finger.fret - lastFingerFret;
                    // penalty for two fingers getting too divided
                    if (fingerSpan > 1) {
                        rating += Math.pow(fingerSpan * 2, 2);
                    }
                }
            }

            lastFingerFret = finger.fret;

            if (isNaN(finger.from)) {
                continue;
            }
            if (finger.from === finger.to) {
                // penalty for thumb/pinky fingers
                rating += [2, 1, 1, 1, 3][i];
            } else {
                // barred chord
                rating += (finger.to - finger.from + 1) * [0, 0.4, 2, 1.5, 3][i];
            }
        }

        return rating;
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
            candidate.rating = this.calculateFingeringRating(candidate);
        }
    }

    private sortCandidates(candidates: ChordDetail[]) {
        candidates.sort((a, b) => {
            if (a.omittedIntervals.length !== b.omittedIntervals.length) {
                return a.omittedIntervals.length - b.omittedIntervals.length;
            }

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
                const omittedIntervals: Interval[] = [];
                for (let i = 0; i < this.omittedIntervals.length; ++i) {
                    if (mask & (1 << i)) {
                        omittedIntervals.push(this.omittedIntervals[i]);
                    }
                }
                const allNotes = L(this.notes)
                    .where(n => {
                        const interval = this.chord.root.getIntervalTo(n);
                        return all(omittedIntervals, i => !i.equals(interval));
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
        omittedIntervals: ReadonlyArray<Interval>,
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