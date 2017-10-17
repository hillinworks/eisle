import { Interval } from "./Interval";



/* STRUCTURE
 *
 *       28 |       24 |       20 |       16 |       12 |        8 |        4 |
 * 0000     | 0000     | 0000     | 0000     | 0000     | 0000     | 0000     | 0000
 * ---------+---------------------+----------+-----------------------------------------
 * Special  | Base chord Types    | Notes
 */
export enum ChordType {

    NoteMask = 0b111,

    Mask2 = NoteMask,
    m2 = 1,
    M2 = 2,
    A2 = 3,

    Mask3 = NoteMask << 3,
    m3 = 1 << 3,
    M3 = 2 << 3,
    A3 = 3 << 3,
    d3 = 4 << 3,

    Mask4 = NoteMask << 6,
    P4 = 1 << 6,
    A4 = 2 << 6,

    Mask5 = NoteMask << 9,
    P5 = 1 << 9,
    A5 = 2 << 9,
    d5 = 3 << 9,

    Mask6 = NoteMask << 12,
    m6 = 1 << 12,
    M6 = 2 << 12,
    A6 = 3 << 12,

    Mask7 = NoteMask << 15,
    m7 = 1 << 15,
    M7 = 2 << 15,
    d7 = 3 << 15,

    OttavaAlta = 1 << 19,

    Mask9 = Mask2 | OttavaAlta,
    m9 = m2 | OttavaAlta,
    M9 = M2 | OttavaAlta,
    A9 = A2 | OttavaAlta,

    Mask11 = Mask4 | OttavaAlta,
    P11 = P4 | OttavaAlta,
    A11 = A4 | OttavaAlta,

    Mask13 = Mask6 | OttavaAlta,
    m13 = m6 | OttavaAlta,
    M13 = M6 | OttavaAlta,
    A13 = A6 | OttavaAlta,

    BasicChordTypeMask = 0b11111111 << 20,
    PowerChord = 0b00000001 << 20,
    Triad = 0b000000010 << 20,
    SeventhChord = 0b00000110 << 20,
    ExtendedChordMask = 0b0111000 << 20,
    ExtendedNinthChord = 0b00001110 << 20,
    ExtendedEleventhChord = 0b00011110 << 20,
    ExtendedThirteenthChord = 0b0111110 << 20,

    AddedTone = 0b0001 << 28,
    WithAlteredNotes = 0b0010 << 28,
    SlashOrInverted = 0b0100 << 28,

    TriadMask = Triad | Mask3 | Mask5,
    MajorTriad = Triad | M3 | P5,
    MinorTriad = Triad | m3 | P5,
    AugmentedTriad = Triad | M3 | A5,
    DiminishedTriad = Triad | m3 | d5,
    Suspended2 = Triad | M2 | P5,
    Suspended4 = Triad | P4 | P5,
    Fifth = PowerChord | P5,
    Sixth = AddedTone | MajorTriad | M6,
    DominantSeventh = SeventhChord | MajorTriad | m7,
    MajorSeventh = SeventhChord | MajorTriad | M7,
    MinorSeventh = SeventhChord | MinorTriad | m7,
    AugmentedSeventh = SeventhChord | AugmentedTriad | m7,
    HalfDiminishedSeventh = SeventhChord | MinorTriad | M7,
    DiminishedSeventh = SeventhChord | DiminishedTriad | d7,
    DominantNinth = DominantSeventh | ExtendedNinthChord | M9,
    DominantEleventh = DominantNinth | ExtendedEleventhChord | P11,
    DominantThirteenth = DominantEleventh | ExtendedThirteenthChord | M13
}

export namespace ChordType {

    const intervalMasks = [
        ChordType.Mask2,
        ChordType.Mask3,
        ChordType.Mask4,
        ChordType.Mask5,
        ChordType.Mask6,
        ChordType.Mask7,
        ChordType.Mask9,
        ChordType.Mask11,
        ChordType.Mask13,
    ];

    const intervalLookup: { [type: number]: Interval } = {
        [ChordType.m2]: Interval.m2,
        [ChordType.M2]: Interval.M2,
        [ChordType.A2]: Interval.A2,
        [ChordType.m3]: Interval.m3,
        [ChordType.M3]: Interval.M3,
        [ChordType.A3]: Interval.A3,
        [ChordType.d3]: Interval.d3,
        [ChordType.P4]: Interval.P4,
        [ChordType.A4]: Interval.A4,
        [ChordType.P5]: Interval.P5,
        [ChordType.A5]: Interval.A5,
        [ChordType.d5]: Interval.d5,
        [ChordType.m6]: Interval.m6,
        [ChordType.M6]: Interval.M6,
        [ChordType.A6]: Interval.A6,
        [ChordType.m7]: Interval.m7,
        [ChordType.M7]: Interval.M7,
        [ChordType.d7]: Interval.d7,
        [ChordType.m9]: Interval.m9,
        [ChordType.M9]: Interval.M9,
        [ChordType.A9]: Interval.A9,
        [ChordType.P11]: Interval.P11,
        [ChordType.A11]: Interval.A11,
        [ChordType.m13]: Interval.m13,
        [ChordType.M13]: Interval.M13,
        [ChordType.A13]: Interval.A13
    };

    export function getIntervals(type: ChordType): Interval[] {
        const intervals: Interval[] = [];

        function addInterval(mask: ChordType, leastValue: ChordType = 0): boolean {
            const value = type & mask;
            if (value > leastValue) {
                intervals.push(intervalLookup[value]);
                return true;
            }
            return false;
        }

        addInterval(ChordType.Mask3);
        addInterval(ChordType.Mask5);
        addInterval(ChordType.Mask7);

        if (!addInterval(ChordType.Mask9, ChordType.OttavaAlta)) {
            addInterval(ChordType.Mask2);
        }

        if (!addInterval(ChordType.Mask11, ChordType.OttavaAlta)) {
            addInterval(ChordType.Mask4);
        }

        if (!addInterval(ChordType.Mask13, ChordType.OttavaAlta)) {
            addInterval(ChordType.Mask6);
        }

        intervals.sort(i => -i.number);
        return intervals;
    }

}