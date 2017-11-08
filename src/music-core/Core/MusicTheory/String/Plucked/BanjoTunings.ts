import { Tuning } from "../Tuning";
import { Pitch } from "../../Pitch";

export namespace BanjoTunings {
    export const tenorFifth
        = new Tuning("Tenor Fifth", Pitch.C(3), Pitch.G(3), Pitch.D(4), Pitch.A(4));

    export const tenorChicago
        = new Tuning("Tenor Chicago", Pitch.D(3), Pitch.G(3), Pitch.B(3), Pitch.E(4));

    export const tenorIrish
        = new Tuning("Tenor Irish", Pitch.G(2), Pitch.D(3), Pitch.A(3), Pitch.E(4));

    export const knownTunings: { [key: string]: Tuning } = {};
    for (const tuning of [tenorFifth, tenorChicago, tenorIrish]) {
        knownTunings[tuning.name!.toLowerCase()] = tuning;
    }

    export function getKnownTunings(name: string): Tuning {
        return knownTunings[name];
    }
}