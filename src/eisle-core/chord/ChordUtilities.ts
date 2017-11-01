import { StringUtilities } from "../../music-core/Core/Utilities/StringUtilities";

export namespace ChordUtilities {
    export function normalizeChordFileName(ordinalName: string): string {
        let name = ordinalName.replace(/\//g, "_")
            .replace(/♭/g, "-flat-")
            .replace(/[♯\#]/g, "-sharp-");
        if (name.endsWith("-")) {
            name = name.substr(0, name.length - 1);
        }
        return name;
    }

    export function normalizeNoteFileName(noteName: string): string {
        return noteName.replace(new RegExp(StringUtilities.fixedFromCharCode(0x1d12b), "g"), "-double-flat")
            .replace(new RegExp(StringUtilities.fixedFromCharCode(0x1d12a), "g"), "-double-sharp")
            .replace(/♭/g, "-flat")
            .replace(/♯/g, "-sharp");
    }
}