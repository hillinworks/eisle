
import { NoteName } from "./NoteName";
import { Interval } from "./Interval";
import { ChordType } from "./ChordType";

export class Chord {

    readonly root: NoteName;
    readonly type: ChordType;
    readonly name: string;
    bass?: NoteName;

    constructor(name: string, root: NoteName, type: ChordType) {
        this.name = name;
        this.root = root;
        this.type = type;
    }

    getNotes(): NoteName[] {
        const notes: NoteName[] = [];
        if (this.bass) {
            notes.push(this.bass);
        }

        function addNote(self: Chord, note: NoteName) {
            if (self.bass !== undefined && note.equals(self.bass)) {
                return;
            }
            notes.push(note);
        }

        addNote(this, this.root);

        const intervals = ChordType.getIntervals(this.type);

        for (const interval of intervals) {
            addNote(this, this.root.offset(interval));
        }

        return notes;
    }
}

export namespace Chord {
    // ReSharper disable InconsistentNaming
    export function X(root: NoteName): Chord {
        return new Chord(root.toString(), root, ChordType.MajorTriad);
    }

    export function Xm(root: NoteName): Chord {
        return new Chord(`${root}m`, root, ChordType.MinorTriad);
    }

    export function Xaug(root: NoteName): Chord {
        return new Chord(`${root}aug`, root, ChordType.AugmentedTriad);
    }

    export function Xdim(root: NoteName): Chord {
        return new Chord(`${root}dim`, root, ChordType.DiminishedTriad);
    }

    export function Xsus2(root: NoteName): Chord {
        return new Chord(`${root}sus2`, root, ChordType.Suspended2);
    }

    export function Xsus4(root: NoteName): Chord {
        return new Chord(`${root}sus4`, root, ChordType.Suspended4);
    }

    export function X6(root: NoteName): Chord {
        return new Chord(`${root}6`, root, ChordType.Sixth);
    }

    export function Xm6(root: NoteName): Chord {
        return new Chord(`${root}m6`, root, ChordType.MinorTriad | ChordType.M6);
    }

    export function X7(root: NoteName): Chord {
        return new Chord(`${root}7`, root, ChordType.DominantSeventh);
    }

    export function Xmaj7(root: NoteName): Chord {
        return new Chord(`${root}maj7`, root, ChordType.MajorSeventh);
    }

    export function Xm7(root: NoteName): Chord {
        return new Chord(`${root}m7`, root, ChordType.MinorSeventh);
    }

    export function XmM7(root: NoteName): Chord {
        return new Chord(`${root}mM7`, root, ChordType.HalfDiminishedSeventh);
    }

    export function Xdim7(root: NoteName): Chord {
        return new Chord(`${root}dim7`, root, ChordType.DiminishedSeventh);
    }

    export function X7sus2(root: NoteName): Chord {
        return new Chord(`${root}7sus2`, root, ChordType.DominantSeventh | ChordType.Suspended2);
    }

    export function X7sus4(root: NoteName): Chord {
        return new Chord(`${root}7sus4`, root, ChordType.DominantSeventh | ChordType.Suspended4);
    }

    export function Xmaj7sus2(root: NoteName): Chord {
        return new Chord(`${root}maj7sus2`, root, ChordType.MajorSeventh | ChordType.Suspended2);
    }

    export function Xmaj7sus4(root: NoteName): Chord {
        return new Chord(`${root}maj7sus4`, root, ChordType.MajorSeventh | ChordType.Suspended4);
    }

    // ReSharper restore InconsistentNaming
}