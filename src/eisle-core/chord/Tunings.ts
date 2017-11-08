import { Tuning } from "../../music-core/Core/MusicTheory/String/Tuning";
import { GuitarTunings } from "../../music-core/Core/MusicTheory/String/Plucked/GuitarTunings";
import { BanjoTunings } from "../../music-core/Core/MusicTheory/String/Plucked/BanjoTunings";
import { UkuleleTunings } from "../../music-core/Core/MusicTheory/String/Plucked/UkuleleTunings";
export class TuningInfo {
    readonly shortName: string;
    readonly fullName: string;
    readonly key: string;
    readonly tuning: Tuning;

    constructor(key: string, shortName: string, fullName: string, tuning: Tuning) {
        this.key = key;
        this.shortName = shortName;
        this.fullName = fullName;
        this.tuning = tuning;
    }
}

export namespace Tunings {

    type TuningGroup = { [isCommon: number]: TuningInfo[] };

    export const groups: { [key: string]: TuningGroup } = {};
    export const tuningLookup: { [key: string]: TuningInfo } = {};

    function addTuning(groupName: string, common: boolean, key: string, shortName: string, fullName: string, tuning: Tuning) {
        const group = groups[groupName] || (groups[groupName] = {});
        const commonKey = common ? 1 : 0;
        const commonGroup = group[commonKey] || (group[commonKey] = []);
        const tuningInfo = new TuningInfo(key, shortName, fullName, tuning);
        commonGroup.push(tuningInfo);
        tuningLookup[key] = tuningInfo;
    }

    export function getTuning(key: string): TuningInfo {
        return tuningLookup[key];
    }

    addTuning("吉他", true, "guitar-standard", "标准", "吉他标准调弦", GuitarTunings.standard);
    addTuning("吉他", true, "guitar-standard-eflat", "降半音", "吉他降半音调弦", GuitarTunings.standardEFlat);
    addTuning("吉他", true, "guitar-standard-d", "降全音", "吉他降全音调弦", GuitarTunings.standardD);
    addTuning("吉他", true, "guitar-drop-d", "Drop D", "吉他Drop D调弦", GuitarTunings.dropD);
    addTuning("吉他", true, "guitar-dadgad", "DADGAD", "DADGAD调弦", GuitarTunings.dadgad);
    addTuning("吉他", false, "guitar-drop-c", "Drop C", "吉他Drop C调弦", GuitarTunings.dropC);
    addTuning("吉他", false, "guitar-drop-b", "Drop B", "吉他Drop B调弦", GuitarTunings.dropB);
    addTuning("吉他", false, "guitar-double-drop-d", "双重Drop D", "吉他双重Drop D调弦", GuitarTunings.doubleDropD);
    addTuning("吉他", false, "guitar-open-a", "开放A", "吉他开放A调弦", GuitarTunings.openA);
    addTuning("吉他", false, "guitar-open-c", "开放C", "吉他开放C调弦", GuitarTunings.openC);
    addTuning("吉他", false, "guitar-open-d", "开放D", "吉他开放D调弦", GuitarTunings.openD);
    addTuning("吉他", false, "guitar-open-e", "开放E", "吉他开放E调弦", GuitarTunings.openE);
    addTuning("吉他", false, "guitar-open-g", "开放G", "吉他开放G调弦", GuitarTunings.openG);
    addTuning("吉他", false, "guitar-all-fourths", "纯四度", "吉他纯四度调弦", GuitarTunings.allFourths);
    addTuning("尤克里里", true, "ukulele-standard", "标准", "尤克里里标准调弦", UkuleleTunings.standard);
    addTuning("尤克里里", true, "ukulele-standard-a", "升全音", "尤克里里升全音调弦", UkuleleTunings.standardA);
    addTuning("尤克里里", true, "ukulele-low-g", "低音G", "尤克里里低音G调弦", UkuleleTunings.lowG);
    addTuning("尤克里里", false, "ukulele-baritone", "中音", "中音尤克里里调弦", UkuleleTunings.baritone);
    addTuning("中音吉他", true, "baritone-guitar-a", "A-A", "中音吉他A-A调弦", GuitarTunings.baritoneA);
    addTuning("中音吉他", true, "baritone-guitar-b", "B-B", "中音吉他B-B调弦", GuitarTunings.baritoneA);
    addTuning("中音吉他", false, "baritone-guitar-bflat", "B♭-B♭", "中音吉他B♭-B♭调弦", GuitarTunings.baritoneA);
    addTuning("高音班卓/吉他", true, "tenor-banjor-a", "纯五度", "高音班卓/吉他纯五度调弦", BanjoTunings.tenorFifth);
    addTuning("高音班卓/吉他", false, "tenor-banjor-b", "芝加哥", "高音班卓/吉他芝加哥式调弦", GuitarTunings.baritoneA);
    addTuning("高音班卓/吉他", false, "tenor-banjor-bflat", "爱尔兰", "高音班卓/吉他爱尔兰式调弦", GuitarTunings.baritoneA);

    export const defaultTuning = tuningLookup["guitar-standard"];
}