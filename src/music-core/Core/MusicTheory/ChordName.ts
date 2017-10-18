
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

    export function getOrdinalName(chord: Chord): { baseName: string, superscript: string, subscript: string } {
        let nameRule = baseNameLookup[chord.type & ChordType.BT_MaskWithSuspension]
            || baseNameLookup[chord.type & ChordType.BT_Mask];

        if (!nameRule) {
            return { baseName: "", superscript: "", subscript: "" };
        }

        nameRule = Object.assign({}, nameRule);

        nameRule.baseName = chord.root.toString() + nameRule.baseName;

        let extension = nameRule.extendable ? 7 : undefined;
        let extensionSealed = false;
        let extendable = nameRule.extendable;
        const alterBuilder = new StringBuilder();
        const addBuilder = new StringBuilder();

        function addAlteredNote(note: string) {
            if (extendable) {
                extensionSealed = true;
                alterBuilder.append(note);
            } else {
                addBuilder.append("add").append(note);
            }
        }

        const ninth = chord.type & ChordType.Mask9;
        const eleventh = chord.type & ChordType.Mask11;
        const thirteenth = chord.type & ChordType.Mask13;

        switch (ninth) {
            case ChordType.M9:
                if (extendable && !extensionSealed) {
                    extension = 9;
                } else {
                    addBuilder.append("add9");
                }
                break;
            case ChordType.A9:
                addAlteredNote("♯9"); break;
            case ChordType.m9:
                addAlteredNote("♭9"); break;
            case ChordType.M2:
                extensionSealed = true;
                addBuilder.append("add2");
                break;
            case ChordType.A2:
                extensionSealed = true;
                addBuilder.append("add♯2");
                break;
            case ChordType.m2:
                extensionSealed = true;
                addBuilder.append("add♭2");
                break;
            case undefined:
                extensionSealed = true;
                extendable = false;
                break;
        }

        switch (eleventh) {
            case ChordType.P11:
                if (extendable && !extensionSealed) {
                    extension = 11;
                } else {
                    addBuilder.append("add11");
                }
                break;
            case ChordType.A11:
                addAlteredNote("♯11"); break;
            case ChordType.d11:
                addAlteredNote("♭11"); break;
            case ChordType.P4:
                extensionSealed = true;
                addBuilder.append("add4");
                break;
            case ChordType.A4:
                extensionSealed = true;
                addBuilder.append("add♯4");
                break;
            case ChordType.d4:
                extensionSealed = true;
                addBuilder.append("add♭4");
                break;
            case undefined:
                extensionSealed = true;
                extendable = true;
                break;
        }

        switch (thirteenth) {
            case ChordType.M13:
                if (extendable && !extensionSealed) {
                    extension = 13;
                } else {
                    addBuilder.append("add13");
                }
                break;
            case ChordType.A13:
                addAlteredNote("♯13"); break;
            case ChordType.m13:
                addAlteredNote("♭13"); break;
            case ChordType.M6:
                extensionSealed = true;
                addBuilder.append("add6");
                break;
            case ChordType.A6:
                extensionSealed = true;
                addBuilder.append("add♯6");
                break;
            case ChordType.m6:
                extensionSealed = true;
                addBuilder.append("add♭6");
                break;
        }

        if (extension) {
            nameRule.superscript = nameRule.superscript.replace("*", extension.toString());
        }

        if (chord.bass) {
            nameRule.subscript += "/" + chord.bass.toString();
        }

        nameRule.subscript += alterBuilder.toString() + addBuilder.toString();

        return nameRule;
    }

    export function getOrdinalNamePlain(chord: Chord): string {
        const nameRule = getOrdinalName(chord);
        return nameRule.baseName + nameRule.superscript + nameRule.subscript;
    }
}
