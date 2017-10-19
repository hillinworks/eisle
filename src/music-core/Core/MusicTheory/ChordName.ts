
import { ChordType } from "./ChordType";
import { Chord } from "./Chord";
import { toArrayMap } from "../Utilities/LinqLite";
import { StringBuilder } from "../Utilities/StringBuilder";

export namespace ChordName {

    const baseNameLookup = {

        [ChordType.BT_MajorTriadOmittingFifth]: { extendable: false, baseName: "", superscript: "", subscript: "(no5)" },
        [ChordType.BT_MinorTriadOmittingFifth]: { extendable: false, baseName: "m", superscript: "", subscript: "(no5)" },

        [ChordType.BT_PowerChord]: { extendable: false, baseName: "5", superscript: "", subscript: "" },
        [ChordType.BT_PowerChordSharpenFifth]: { extendable: false, baseName: "5", superscript: "", subscript: "♯5" },
        [ChordType.BT_PowerChordFlattenFifth]: { extendable: false, baseName: "5", superscript: "", subscript: "♭5" },

        [ChordType.BT_MajorTriad]: { extendable: false, baseName: "", superscript: "", subscript: "" },
        [ChordType.BT_MinorTriad]: { extendable: false, baseName: "m", superscript: "", subscript: "" },
        [ChordType.BT_DiminishedTriad]: { extendable: false, baseName: "dim", superscript: "", subscript: "" },
        [ChordType.BT_AugmentedTriad]: { extendable: false, baseName: "aug", superscript: "", subscript: "" },

        [ChordType.BT_MinorTriadSharpenFifth]: { extendable: false, baseName: "m", superscript: "", subscript: "♯5" },
        [ChordType.BT_MajorTriadFlattenFifth]: { extendable: false, baseName: "maj", superscript: "", subscript: "♭5" },

        [ChordType.BT_SuspendedSecond]: { extendable: false, baseName: "", superscript: "", subscript: "sus2" },
        [ChordType.BT_SuspendedFourth]: { extendable: false, baseName: "", superscript: "", subscript: "sus4" },
        [ChordType.BT_DiminishedSuspendedSecond]: { extendable: false, baseName: "dim", superscript: "", subscript: "sus2" },
        [ChordType.BT_DiminishedSuspendedFourth]: { extendable: false, baseName: "dim", superscript: "", subscript: "sus4" },
        [ChordType.BT_AugmentedSuspendedSecond]: { extendable: false, baseName: "aug", superscript: "", subscript: "sus2" },
        [ChordType.BT_AugmentedSuspendedFourth]: { extendable: false, baseName: "aug", superscript: "", subscript: "sus4" },

        [ChordType.BT_DominantSeventhOmittingFifth]: { extendable: true, baseName: "", superscript: "*", subscript: "(no5)" },
        [ChordType.BT_MajorSeventhOmittingFifth]: { extendable: true, baseName: "maj", superscript: "*", subscript: "(no5)" },
        [ChordType.BT_MinorSeventhOmittingFifth]: { extendable: true, baseName: "m", superscript: "*", subscript: "(no5)" },
        [ChordType.BT_MinorMajorSeventhOmittingFifth]: { extendable: true, baseName: "m", superscript: "maj*", subscript: "(no5)" },

        [ChordType.BT_DominantSeventh]: { extendable: true, baseName: "", superscript: "*", subscript: "" },
        [ChordType.BT_DominantSeventhFlattenFifth]: { extendable: true, baseName: "", superscript: "*", subscript: "♭5" },
        [ChordType.BT_MajorSeventh]: { extendable: true, baseName: "maj", superscript: "*", subscript: "" },
        [ChordType.BT_MinorSeventh]: { extendable: true, baseName: "m", superscript: "*", subscript: "" },
        [ChordType.BT_AugmentedSeventh]: { extendable: true, baseName: "aug", superscript: "*", subscript: "" },
        [ChordType.BT_AugmentedMajorSeventh]: { extendable: true, baseName: "maj", superscript: "*", subscript: "♯5" },
        [ChordType.BT_MinorMajorSeventh]: { extendable: true, baseName: "m", superscript: "maj*", subscript: "" },
        [ChordType.BT_HalfDiminishedSeventh]: { extendable: true, baseName: "m", superscript: "*", subscript: "♭5" },
        [ChordType.BT_DiminishedSeventh]: { extendable: true, baseName: "dim", superscript: "*", subscript: "" },
        [ChordType.BT_DiminishedMajorSeventh]: { extendable: true, baseName: "m", superscript: "maj*", subscript: "♭5" },

        [ChordType.BT_DominantSeventhSuspendedSecond]: { extendable: true, baseName: "", superscript: "*", subscript: "sus2" },
        [ChordType.BT_DominantSeventhSuspendedFourth]: { extendable: true, baseName: "", superscript: "*", subscript: "sus4" },
        [ChordType.BT_DominantSeventhFlattenFifthSuspendedSecond]: { extendable: true, baseName: "", superscript: "*", subscript: "sus2♭5" },
        [ChordType.BT_DominantSeventhFlattenFifthSuspendedFourth]: { extendable: true, baseName: "", superscript: "*", subscript: "sus4♭5" },
        [ChordType.BT_MajorSeventhSuspendedSecond]: { extendable: true, baseName: "maj", superscript: "*", subscript: "sus2" },
        [ChordType.BT_MajorSeventhSuspendedFourth]: { extendable: true, baseName: "maj", superscript: "*", subscript: "sus4" },
        [ChordType.BT_AugmentedSeventhSuspendedSecond]: { extendable: true, baseName: "aug", superscript: "*", subscript: "sus2" },
        [ChordType.BT_AugmentedSeventhSuspendedFourth]: { extendable: true, baseName: "aug", superscript: "*", subscript: "sus4" },
        [ChordType.BT_AugmentedMajorSeventhSuspendedSecond]: { extendable: true, baseName: "maj", superscript: "*", subscript: "sus2♯5" },
        [ChordType.BT_AugmentedMajorSeventhSuspendedFourth]: { extendable: true, baseName: "maj", superscript: "*", subscript: "sus4♯5" },
        [ChordType.BT_HalfDiminishedSeventhSuspendedSecond]: { extendable: true, baseName: "m", superscript: "*", subscript: "sus2♭5" },
        [ChordType.BT_HalfDiminishedSeventhSuspendedFourth]: { extendable: true, baseName: "m", superscript: "*", subscript: "sus4♭5" },
        [ChordType.BT_DiminishedSeventhSuspendedSecond]: { extendable: true, baseName: "dim", superscript: "*", subscript: "sus2" },
        [ChordType.BT_DiminishedSeventhSuspendedFourth]: { extendable: true, baseName: "dim", superscript: "*", subscript: "sus4" },
        [ChordType.BT_DiminishedMajorSeventhSuspendedSecond]: { extendable: true, baseName: "m", superscript: "maj*", subscript: "sus2♭5" },
        [ChordType.BT_DiminishedMajorSeventhSuspendedFourth]: { extendable: true, baseName: "m", superscript: "maj*", subscript: "sus4♭5" },

    };

    export function getOrdinalName(chord: Chord): { baseName: string, superscript: string, subscript: string, bass?: string } {

        let testType = chord.type;

        // remove 9th, 11th and 13th so they won't conflict with 2nd, 4th and 6th
        if (testType & ChordType.OttavaAlta9) {
            testType &= ~ChordType.Mask9;
        }

        if (testType & ChordType.OttavaAlta11) {
            testType &= ~ChordType.Mask11;
        }

        if (testType & ChordType.OttavaAlta13) {
            testType &= ~ChordType.Mask13;
        }

        const isSus2 = (testType & ChordType.Mask2) === ChordType.M2;
        const isSus4 = (testType & ChordType.Mask4) === ChordType.P4;

        let nameRule = baseNameLookup[testType & ChordType.BT_MaskWithSuspension]
            || baseNameLookup[testType & ChordType.BT_Mask];

        if (!nameRule) {
            return { baseName: "", superscript: "", subscript: "" };
        }

        nameRule = Object.assign({}, nameRule);

        let extension = nameRule.extendable ? "7" : undefined;
        let extendable = nameRule.extendable;
        const alterBuilder = new StringBuilder();
        const addBuilder = new StringBuilder();

        function increaseExtensionOrAdd(note: string) {
            if (extendable) {
                extension = note;
            } else {
                addBuilder.append("add").append(note);
            }
        }

        function appendAlteredOrAdded(note: string) {
            if (extendable) {
                extendable = false;
                alterBuilder.append(note);
            } else {
                addBuilder.append("add").append(note);
            }
        }

        function appendAdded(note: string) {
            extendable = false;
            addBuilder.append("add").append(note);
        }

        const ninth = chord.type & ChordType.Mask9;
        const eleventh = chord.type & ChordType.Mask11;
        const thirteenth = chord.type & ChordType.Mask13;

        if (isSus2) {
            extendable = false;
        } else {
            switch (ninth) {
                case ChordType.M9:
                    increaseExtensionOrAdd("9"); break;
                case ChordType.A9:
                    appendAlteredOrAdded("♯9"); break;
                case ChordType.m9:
                    appendAlteredOrAdded("♭9"); break;
                case ChordType.M2:
                    appendAdded("2"); break;
                case ChordType.A2:
                    appendAdded("♯2"); break;
                case ChordType.m2:
                    appendAdded("♭2"); break;
                case 0:
                    extendable = false; break;
            }
        }

        if (isSus4) {
            extendable = false;
        } else {
            switch (eleventh) {
                case ChordType.P11:
                    increaseExtensionOrAdd("11"); break;
                case ChordType.A11:
                    appendAlteredOrAdded("♯11"); break;
                case ChordType.d11:
                    appendAlteredOrAdded("♭11"); break;
                case ChordType.P4:
                    appendAdded("4"); break;
                case ChordType.A4:
                    appendAdded("♯4"); break;
                case ChordType.d4:
                    appendAdded("♭4"); break;
                case 0:
                    extendable = false; break;
            }
        }

        switch (thirteenth) {
            case ChordType.M13:
                increaseExtensionOrAdd("13"); break;
            case ChordType.A13:
                appendAlteredOrAdded("♯13"); break;
            case ChordType.m13:
                appendAlteredOrAdded("♭13"); break;
            case ChordType.M6:
                addBuilder.append("6"); break;
            case ChordType.A6:
                appendAdded("♯6"); break;
            case ChordType.m6:
                appendAdded("♭6"); break;
        }

        const result = {
            baseName: chord.root.toString() + nameRule.baseName,
            superscript: extension ? nameRule.superscript.replace("*", extension.toString()) : nameRule.superscript,
            subscript: nameRule.subscript + alterBuilder.toString() + addBuilder.toString(),
            bass: chord.bass ? chord.bass.toString() : undefined
        };

        return result;
    }

    export function getOrdinalNamePlain(chord: Chord): string {
        const name = getOrdinalName(chord);
        const builder = new StringBuilder();
        builder.append(name.baseName)
            .append(name.superscript)
            .append(name.subscript);
        if (name.bass) {
            builder.append("/").append(name.bass);
        }
        return builder.toString();
    }
}
