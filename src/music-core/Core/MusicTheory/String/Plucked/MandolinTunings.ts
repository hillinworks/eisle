import { Tuning } from "../Tuning";
import { Pitch } from "../../Pitch";

export namespace MandolinTunings {
    export const standard
        = new Tuning("Standard", Pitch.G(3), Pitch.D(4), Pitch.A(4), Pitch.E(5));

    export const mandola
        = new Tuning("Mandola", Pitch.C(3), Pitch.G(3), Pitch.D(4), Pitch.A(4));

    export const tenor
        = new Tuning("Standard", Pitch.G(2), Pitch.D(3), Pitch.A(3), Pitch.E(4));

    export const mandocello
        = new Tuning("Mandocello", Pitch.C(2), Pitch.G(2), Pitch.D(3), Pitch.A(3));

    export const mandobass
        = new Tuning("Mandobass", Pitch.E(1), Pitch.A(1), Pitch.D(2), Pitch.G(2));

    export const knownTunings: { [key: string]: Tuning } = {};
    for (const tuning of [standard, mandola, tenor, mandocello, mandobass]) {
        knownTunings[tuning.name!.toLowerCase()] = tuning;
    }

    export function getKnownTunings(name: string): Tuning {
        return knownTunings[name];
    }
}