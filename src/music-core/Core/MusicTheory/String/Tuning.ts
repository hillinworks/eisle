import { Pitch } from "../Pitch";
import { all, L } from "../../Utilities/LinqLite";

export class Tuning {
    readonly name?: string;
    readonly pitches: Pitch[];

    constructor(name: string | undefined, ...stringTunings: Pitch[]) {
        this.name = name;
        this.pitches = stringTunings;
    }

    equals(other: Tuning): boolean {
        return other && all(this.pitches, (p, i) => other.pitches[i].equals(p));
    }

    inOctaveEquals(other: Tuning): boolean {
        return other && all(this.pitches, (p, i) => other.pitches[i].noteName.equals(p.noteName));
    }
}


