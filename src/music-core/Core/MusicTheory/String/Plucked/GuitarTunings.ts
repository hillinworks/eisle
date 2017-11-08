import { Tuning } from "../Tuning";
import { Pitch } from "../../Pitch";

export namespace GuitarTunings {
    export const standard
        = new Tuning("Standard", Pitch.E(2), Pitch.A(2), Pitch.D(3), Pitch.G(3), Pitch.B(3), Pitch.E(4));

    export const standardEFlat
        = new Tuning("Standard E♭", Pitch.EFlat(2), Pitch.AFlat(2), Pitch.DFlat(3), Pitch.GFlat(3), Pitch.BFlat(3), Pitch.EFlat(4));

    export const standardD
        = new Tuning("Standard D", Pitch.D(2), Pitch.G(2), Pitch.C(3), Pitch.F(3), Pitch.A(3), Pitch.D(4));

    export const dropD
        = new Tuning("Drop D", Pitch.D(2), Pitch.A(2), Pitch.D(3), Pitch.G(3), Pitch.B(3), Pitch.E(4));

    export const dropC
        = new Tuning("Drop C", Pitch.C(2), Pitch.G(2), Pitch.C(3), Pitch.F(3), Pitch.A(3), Pitch.D(4));

    export const dropB
        = new Tuning("Drop B", Pitch.B(1), Pitch.FSharp(2), Pitch.B(2), Pitch.E(3), Pitch.GSharp(3), Pitch.CSharp(4));

    export const doubleDropD
        = new Tuning("Double Drop D", Pitch.D(2), Pitch.A(2), Pitch.D(3), Pitch.G(3), Pitch.B(3), Pitch.D(4));

    export const openA
        = new Tuning("Open A", Pitch.E(2), Pitch.A(2), Pitch.CSharp(3), Pitch.E(3), Pitch.A(3), Pitch.E(4));

    export const openC
        = new Tuning("Open C", Pitch.C(2), Pitch.G(2), Pitch.C(3), Pitch.G(3), Pitch.C(4), Pitch.E(4));

    export const openD
        = new Tuning("Open D", Pitch.D(2), Pitch.A(2), Pitch.D(3), Pitch.FSharp(3), Pitch.A(3), Pitch.D(4));

    export const openE
        = new Tuning("Open E", Pitch.E(2), Pitch.B(2), Pitch.E(3), Pitch.GSharp(3), Pitch.B(3), Pitch.E(4));

    export const openG
        = new Tuning("Open G", Pitch.D(2), Pitch.G(2), Pitch.D(3), Pitch.G(3), Pitch.B(3), Pitch.D(4));

    export const dadgad
        = new Tuning("DADGAD", Pitch.D(2), Pitch.A(2), Pitch.D(3), Pitch.G(3), Pitch.A(3), Pitch.D(4));

    export const allFourths
        = new Tuning("All Fourths", Pitch.E(2), Pitch.A(2), Pitch.D(3), Pitch.G(3), Pitch.C(3), Pitch.F(4));

    export const baritoneA
        = new Tuning("Baritone A", Pitch.A(1), Pitch.D(2), Pitch.G(2), Pitch.C(3), Pitch.E(3), Pitch.A(3));

    export const baritoneBFlat
        = new Tuning("Baritone B♭", Pitch.BFlat(1), Pitch.EFlat(2), Pitch.AFlat(2), Pitch.DFlat(3), Pitch.F(3), Pitch.BFlat(3));

    export const baritoneB
        = new Tuning("Baritone B", Pitch.B(1), Pitch.E(2), Pitch.A(2), Pitch.D(3), Pitch.FSharp(3), Pitch.B(3));


    export const knownTunings: { [key: string]: Tuning } = {};
    for (const tuning of [standard, standardEFlat, standardD, dropD, dropC, dropB, doubleDropD, openA, openC, openD, openE, openG, dadgad, allFourths, baritoneA, baritoneB, baritoneBFlat]) {
        knownTunings[tuning.name!.toLowerCase()] = tuning;
    }

    export function getKnownTunings(name: string): Tuning {
        return knownTunings[name];
    }
}