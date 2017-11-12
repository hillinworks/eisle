import { ChordInversionTolerance } from "../../music-core/Core/MusicTheory/String/ChordInversionTolerance";
import { Tuning } from "../../music-core/Core/MusicTheory/String/Tuning";
import { GuitarTunings } from "../../music-core/Core/MusicTheory/String/Plucked/GuitarTunings";
import { BanjoTunings } from "../../music-core/Core/MusicTheory/String/Plucked/BanjoTunings";
import { UkuleleTunings } from "../../music-core/Core/MusicTheory/String/Plucked/UkuleleTunings";
import { StringBuilder } from "../../music-core/Core/Utilities/StringBuilder";
import { MandolinTunings } from "../../music-core/Core/MusicTheory/String/Plucked/MandolinTunings";

export interface IChordResolvingOptions {
    readonly chordInversionTolerance: ChordInversionTolerance;
    readonly maxFretToFindRoot: number;
    readonly maxChordFretWidth: number;
}

function getTuningDescriptor(tuning: Tuning) {
    const builder = new StringBuilder();

    for (let i = 0; i < tuning.pitches.length; ++i) {
        const pitch = tuning.pitches[i];
        if (i > 0) {
            builder.append(" ");
        }
        builder.append(pitch.noteName.toString())
            .append("<sub>")
            .append(pitch.octaveGroup.toString())
            .append("</sub>");
    }

    return builder.toString();
}

export class InstrumentInfo {
    readonly shortName: string;
    readonly fullName: string;
    readonly key: string;
    readonly tuningDescriptor: string;
    readonly tuning: Tuning;
    readonly stringCount: number;
    readonly chordResolvingOptions: IChordResolvingOptions;

    constructor(key: string, shortName: string, fullName: string, tuning: Tuning, chordResolvingOptions: IChordResolvingOptions) {
        this.key = key;
        this.shortName = shortName;
        this.fullName = fullName;
        this.tuning = tuning;
        this.tuningDescriptor = getTuningDescriptor(tuning);
        this.stringCount = tuning.pitches.length;
        this.chordResolvingOptions = chordResolvingOptions;
    }
}

export namespace Instruments {


    export const groups: { [key: string]: InstrumentInfo[] } = {};
    export const instrumentLookup: { [key: string]: InstrumentInfo } = {};

    function addInstrument(
        groupName: string,
        common: boolean,
        key: string,
        shortName: string,
        fullName: string,
        tuning: Tuning,
        chordResolvingOptions: IChordResolvingOptions) {
        const group = groups[groupName] || (groups[groupName] = []);
        const info = new InstrumentInfo(key, shortName, fullName, tuning, chordResolvingOptions);
        group.push(info);
        instrumentLookup[key] = info;
    }

    export function getInstrumentInfo(key: string): InstrumentInfo {
        return instrumentLookup[key];
    }

    const guitarChordResolvingOptions = {
        chordInversionTolerance: ChordInversionTolerance.NotAllowed,
        maxFretToFindRoot: 11,
        maxChordFretWidth: 4
    };

    const ukuleleChordResolvingOptions = {
        chordInversionTolerance: ChordInversionTolerance.Allowed,
        maxFretToFindRoot: 11,
        maxChordFretWidth: 5
    };

    const ukuleleNoPreferInversionChordResolvingOptions = {
        chordInversionTolerance: ChordInversionTolerance.NotPrefered,
        maxFretToFindRoot: 11,
        maxChordFretWidth: 5
    };

    const banjoChordResolvingOptions = {
        chordInversionTolerance: ChordInversionTolerance.Allowed,
        maxFretToFindRoot: 11,
        maxChordFretWidth: 5
    };

    const mandolinChordResolvingOptions = {
        chordInversionTolerance: ChordInversionTolerance.Allowed,
        maxFretToFindRoot: 11,
        maxChordFretWidth: 5
    };

    addInstrument("吉他", true, "guitar-standard", "标准", "吉他标准调弦", GuitarTunings.standard, guitarChordResolvingOptions);
    addInstrument("吉他", true, "guitar-standard-eflat", "降半音", "吉他降半音调弦", GuitarTunings.standardEFlat, guitarChordResolvingOptions);
    addInstrument("吉他", true, "guitar-standard-d", "降全音", "吉他降全音调弦", GuitarTunings.standardD, guitarChordResolvingOptions);
    addInstrument("吉他", true, "guitar-drop-d", "Drop D", "吉他Drop D调弦", GuitarTunings.dropD, guitarChordResolvingOptions);
    addInstrument("吉他", true, "guitar-dadgad", "DADGAD", "DADGAD调弦", GuitarTunings.dadgad, guitarChordResolvingOptions);
    addInstrument("吉他（不常用）", false, "guitar-drop-c", "Drop C", "吉他Drop C调弦", GuitarTunings.dropC, guitarChordResolvingOptions);
    addInstrument("吉他（不常用）", false, "guitar-drop-b", "Drop B", "吉他Drop B调弦", GuitarTunings.dropB, guitarChordResolvingOptions);
    addInstrument("吉他（不常用）", false, "guitar-double-drop-d", "双重Drop D", "吉他双重Drop D调弦", GuitarTunings.doubleDropD, guitarChordResolvingOptions);
    addInstrument("吉他（不常用）", false, "guitar-open-a", "开放A", "吉他开放A调弦", GuitarTunings.openA, guitarChordResolvingOptions);
    addInstrument("吉他（不常用）", false, "guitar-open-c", "开放C", "吉他开放C调弦", GuitarTunings.openC, guitarChordResolvingOptions);
    addInstrument("吉他（不常用）", false, "guitar-open-d", "开放D", "吉他开放D调弦", GuitarTunings.openD, guitarChordResolvingOptions);
    addInstrument("吉他（不常用）", false, "guitar-open-e", "开放E", "吉他开放E调弦", GuitarTunings.openE, guitarChordResolvingOptions);
    addInstrument("吉他（不常用）", false, "guitar-open-g", "开放G", "吉他开放G调弦", GuitarTunings.openG, guitarChordResolvingOptions);
    addInstrument("吉他（不常用）", false, "guitar-all-fourths", "纯四度", "吉他纯四度调弦", GuitarTunings.allFourths, guitarChordResolvingOptions);
    addInstrument("尤克里里", true, "ukulele-standard", "标准", "尤克里里标准调弦", UkuleleTunings.standard, ukuleleChordResolvingOptions);
    addInstrument("尤克里里", true, "ukulele-standard-a", "升全音", "尤克里里升全音调弦", UkuleleTunings.standardA, ukuleleChordResolvingOptions);
    addInstrument("尤克里里", true, "ukulele-low-g", "低音G", "尤克里里低音G调弦", UkuleleTunings.lowG, ukuleleNoPreferInversionChordResolvingOptions);
    addInstrument("尤克里里", true, "guitalele", "吉他里里", "吉他里里标准调弦", UkuleleTunings.guitalele, ukuleleNoPreferInversionChordResolvingOptions);
    addInstrument("尤克里里", false, "ukulele-baritone", "中音", "中音尤克里里调弦", UkuleleTunings.baritone, ukuleleChordResolvingOptions);
    addInstrument("中音吉他", true, "baritone-guitar-a", "A-A", "中音吉他A-A调弦", GuitarTunings.baritoneA, guitarChordResolvingOptions);
    addInstrument("中音吉他", true, "baritone-guitar-b", "B-B", "中音吉他B-B调弦", GuitarTunings.baritoneB, guitarChordResolvingOptions);
    addInstrument("中音吉他", false, "baritone-guitar-bflat", "B♭-B♭", "中音吉他B♭-B♭调弦", GuitarTunings.baritoneBFlat, guitarChordResolvingOptions);
    addInstrument("班卓", true, "tenor-banjor-a", "纯五度", "班卓纯五度调弦", BanjoTunings.tenorFifth, banjoChordResolvingOptions);
    addInstrument("班卓", false, "tenor-banjor-b", "芝加哥", "班卓芝加哥式调弦", BanjoTunings.tenorChicago, banjoChordResolvingOptions);
    addInstrument("班卓", false, "tenor-banjor-bflat", "爱尔兰", "班卓爱尔兰式调弦", BanjoTunings.tenorIrish, banjoChordResolvingOptions);
    addInstrument("曼陀铃", true, "mandolin-standard", "标准", "曼陀铃标准调弦", MandolinTunings.standard, mandolinChordResolvingOptions);
    addInstrument("曼陀铃", true, "mandola", "中音", "中音曼陀铃调弦", MandolinTunings.mandola, mandolinChordResolvingOptions);
    addInstrument("曼陀铃", true, "tenor-mandolin", "次中音", "次中音曼陀铃调弦", MandolinTunings.tenor, mandolinChordResolvingOptions);

    export const defaultInstrument = instrumentLookup["guitar-standard"];
}