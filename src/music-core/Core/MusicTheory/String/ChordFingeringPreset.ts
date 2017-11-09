import { FingerRange, ChordFingering } from "./ChordFingering";
import { L, range, contains } from "../../Utilities/LinqLite";
export namespace ChordFingeringPreset {

    const idle = FingerRange.idle;
    function barre(fret: number, from: number, to: number) {
        return new FingerRange(fret, from, to);
    }
    function press(fret: number, stringIndex: number) {
        return new FingerRange(fret, stringIndex, stringIndex);
    }

    type InstrumentPresets = { [hash: number]: FingerRange[] };

    const presets: { [stringCount: number]: InstrumentPresets } = {
        [4]: {
            [0o1110]: [idle, idle, press(1, 0), press(1, 1), press(1, 2)],
            [0o3331]: [idle, press(1, 3), press(3, 0), press(3, 1), press(3, 2)],
        },
        [6]: {
            [0o001110]: [idle, idle, press(1, 2), press(1, 3), press(1, 4)],
            [0o013321]: [idle, barre(1, 1, 5), press(2, 4), press(3, 2), press(3, 3)],
            [0o013121]: [idle, barre(1, 1, 5), press(2, 4), press(3, 2), idle],
            [0o013331]: [idle, barre(1, 1, 5), idle, barre(3, 2, 4), idle],
            [0o013131]: [idle, barre(1, 1, 5), idle, press(3, 2), press(3, 4)],
        }
    };

    export function getPreset(frets: ReadonlyArray<number>): ChordFingering {

        const instrumentPresets = presets[frets.length];
        if (!instrumentPresets) {
            return undefined;
        }

        const minFret = L(frets).where(f => !isNaN(f) && f > 0).min();
        const pattern = L(frets).select(f => (isNaN(f) || f === 0) ? 0 : f - minFret + 1).toArray();
        let hash = 0;
        for (let i = 0; i < pattern.length; ++i) {
            hash += pattern[i] << ((pattern.length - i - 1) * 3);
        }

        let preset = instrumentPresets[hash];
        if (preset === undefined) {
            return undefined;
        }

        preset = Object.assign([], preset);
        for (let i = 0; i < preset.length; ++i) {
            const range = preset[i];
            if (isNaN(range.fret) || range.fret === 0) {
                continue;
            }

            preset[i] = new FingerRange(range.fret + minFret - 1, range.from, range.to);
        }

        return new ChordFingering(preset, ChordFingering.calculateFingeringRating(frets, preset));
    }

}