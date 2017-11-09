
import { ChordType } from "./ChordType";
import { Chord } from "./Chord";
import { toArrayMap, elementAt, select, L } from "../Utilities/LinqLite";
import { StringBuilder } from "../Utilities/StringBuilder";
import { OmittedInterval } from "./String/ChordDetail";
import { StringUtilities } from "../Utilities/StringUtilities";

export interface IChordOrdinalName { baseName: string; superscript: string; subscript: string; bass?: string; }

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
        [ChordType.BT_MajorSeventhFlattenFifth]: { extendable: true, baseName: "maj", superscript: "*", subscript: "♭5" },
        [ChordType.BT_MinorSeventh]: { extendable: true, baseName: "m", superscript: "*", subscript: "" },
        [ChordType.BT_MinorSeventhSharppenFifith]: { extendable: true, baseName: "m", superscript: "*", subscript: "♯5" },
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


    const shortAddedTones = {
        [ChordType.M2]: "2",
        [ChordType.M6]: "6",
        [ChordType.P4]: "4",
        [ChordType.M6 | ChordType.M9]: "6/9",
    };

    export function getOrdinalName(chord: Chord): IChordOrdinalName {

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

        const baseType = testType & ChordType.BT_Mask;

        const isPlainTriad = baseType === ChordType.BT_MajorTriad
            || baseType === ChordType.BT_MinorTriad
            || baseType === ChordType.BT_AugmentedTriad
            || baseType === ChordType.BT_DiminishedTriad;

        const hasThird = (testType & ChordType.Mask3) !== 0;
        const isSus2 = !hasThird && (testType & ChordType.Mask2) === ChordType.M2;
        const isSus4 = !hasThird && (testType & ChordType.Mask4) === ChordType.P4;

        let nameRule = baseNameLookup[testType & ChordType.BT_MaskWithSuspension]
            || baseNameLookup[baseType];

        if (!nameRule) {
            return { baseName: "", superscript: "", subscript: "" };
        }

        nameRule = Object.assign({}, nameRule);

        let extensionText: string = undefined;

        const alterBuilder = new StringBuilder();
        const addBuilder = new StringBuilder();

        const ninth = chord.type & ChordType.Mask9;
        const eleventh = chord.type & ChordType.Mask11;
        const thirteenth = chord.type & ChordType.Mask13;

        const shortAdded = shortAddedTones[ninth | eleventh | thirteenth];
        if (isPlainTriad && !isSus2 && !isSus4 && shortAdded) {
            addBuilder.append(shortAdded);
        } else {
            // the highest possible extension degree (e.g. 13 in c7addb9add11addb13)
            let psuedoExtension = 0;
            // the actual extension degree(e.g. 11 in c7addb9add11addb13)
            let extension = 0;
            if (nameRule.extendable) {
                psuedoExtension = 7;
                extension = 7;
                if (ninth > ChordType.OttavaAlta9) {
                    psuedoExtension = 9;
                    if (ninth === ChordType.M9) {
                        extension = 9;
                    }
                    if (eleventh > ChordType.OttavaAlta11) {
                        psuedoExtension = 11;
                        if (eleventh === ChordType.P11) {
                            extension = 11;
                        }
                        if (thirteenth > ChordType.OttavaAlta13) {
                            psuedoExtension = 13;
                            if (thirteenth === ChordType.M13) {
                                extension = 13;
                            }
                        }
                    }
                }

                extensionText = extension.toString();
            }

            function appendAdded(note: string, degree?: number) {
                if (degree === undefined || extension < degree) {
                    addBuilder.append("add").append(note);
                }
            }

            function appendAlteredOrAdded(note: string, degree: number) {
                if (degree !== undefined && (extension > degree || psuedoExtension === degree)) {
                    alterBuilder.append(note);
                } else {
                    addBuilder.append("add").append(note);
                }
            }

            if (!isSus2) {
                switch (ninth) {
                    case ChordType.M2:
                        appendAdded("2"); break;
                    case ChordType.A2:
                        appendAdded("♯2"); break;
                    case ChordType.m2:
                        appendAdded("♭2"); break;
                }
            }

            if (!isSus4) {
                switch (eleventh) {
                    case ChordType.P4:
                        appendAdded("4"); break;
                    case ChordType.A4:
                        appendAdded("♯4"); break;
                    case ChordType.d4:
                        appendAdded("♭4"); break;
                }
            }

            switch (thirteenth) {
                case ChordType.M6:
                    appendAdded("6"); break;
                case ChordType.A6:
                    appendAdded("♯6"); break;
                case ChordType.m6:
                    appendAdded("♭6"); break;
            }

            switch (ninth) {
                case ChordType.M9:
                    appendAdded("9", 9); break;
                case ChordType.A9:
                    appendAlteredOrAdded("♯9", 9); break;
                case ChordType.m9:
                    appendAlteredOrAdded("♭9", 9); break;

            }

            switch (eleventh) {
                case ChordType.P11:
                    appendAdded("11", 11); break;
                case ChordType.A11:
                    appendAlteredOrAdded("♯11", 11); break;
                case ChordType.d11:
                    appendAlteredOrAdded("♭11", 11); break;
            }

            switch (thirteenth) {
                case ChordType.M13:
                    appendAdded("13", 13); break;
                case ChordType.A13:
                    appendAlteredOrAdded("♯13", 13); break;
                case ChordType.m13:
                    appendAlteredOrAdded("♭13", 13); break;
            }
        }

        const result = {
            baseName: chord.root.toString() + nameRule.baseName,
            superscript: extensionText ? nameRule.superscript.replace(/\*/g, extensionText.toString()) : nameRule.superscript,
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

    export function getOmitsEnglish(chord: Chord, omittedIntervals: ReadonlyArray<OmittedInterval>): string {
        if (omittedIntervals.length === 0) {
            return "";
        }

        const intervals = L(omittedIntervals)
            .orderBy(i => i.interval.number)
            .select(i => StringUtilities.toOrdinal(i.interval.number + 1))
            .toArray()
            .join(", ");
        return `omit ${intervals}`;
    }

    export function getOmits(chord: Chord, omittedIntervals: ReadonlyArray<OmittedInterval>): string {
        if (omittedIntervals.length === 0) {
            return "";
        }

        const intervals = L(omittedIntervals)
            .orderBy(i => i.interval.number)
            .select(i => `${i.interval.number + 1}音`)
            .toArray()
            .join("、");
        return `省略 ${intervals}`;
    }
}
