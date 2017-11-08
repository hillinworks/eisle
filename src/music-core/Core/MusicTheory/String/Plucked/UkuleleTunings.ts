import { Tuning } from "../Tuning";
import { Pitch } from "../../Pitch";

export namespace UkuleleTunings {

    export const standard
        = new Tuning("Soprano Standard", Pitch.G(4), Pitch.C(4), Pitch.E(4), Pitch.A(4));

    export const standardA
        = new Tuning("Soprano Standard A", Pitch.A(4), Pitch.D(4), Pitch.FSharp(4), Pitch.B(4));

    export const lowG
        = new Tuning("Low G", Pitch.G(3), Pitch.C(4), Pitch.E(4), Pitch.A(4));

    export const baritone
        = new Tuning("Baritone", Pitch.D(3), Pitch.G(3), Pitch.B(3), Pitch.E(4));

    export const knownTunings: { [key: string]: Tuning } = {};
    for (const tuning of [standard, standardA, lowG, baritone]) {
        knownTunings[tuning.name!.toLowerCase()] = tuning;
    }

    export function getKnownTunings(name: string): Tuning {
        return knownTunings[name];
    }
}