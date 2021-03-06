import { Interval } from "./Interval";



/* STRUCTURE
 *
 *       28 |       24 |       20 |       16 |       12 |        8 |        4 |
 * 0000     | 0000     | 0000     | 0000     | 0000     | 0000     | 0000     | 0000
 * ---------+---------------------+----------+-----------------------------------------
 * Special  | Base chord Types    | Notes
 */
export enum ChordType {

    NoteMask3Bits = 0b111,
    NoteMask2Bits = 0b11,

    Position2 = 0,
    // 3 bits for 2nds
    Mask2 = NoteMask3Bits << Position2,
    d2 = 1 << Position2,
    m2 = 2 << Position2,
    M2 = 3 << Position2,
    A2 = 4 << Position2,

    Position3 = Position2 + 3,
    // 3 bits for 3rds
    Mask3 = NoteMask3Bits << Position3,
    d3 = 1 << Position3,
    m3 = 2 << Position3,
    M3 = 3 << Position3,
    A3 = 4 << Position3,

    Position4 = Position3 + 3,
    // 2 bits for 4ths
    Mask4 = NoteMask2Bits << Position4,
    d4 = 1 << Position4,
    P4 = 2 << Position4,
    A4 = 3 << Position4,

    Position5 = Position4 + 2,
    // 2 bits for 5ths
    Mask5 = NoteMask2Bits << Position5,
    d5 = 1 << Position5,
    P5 = 2 << Position5,
    A5 = 3 << Position5,

    Position6 = Position5 + 2,
    // 3 bits for 6ths
    Mask6 = NoteMask3Bits << Position6,
    d6 = 1 << Position6,
    m6 = 2 << Position6,
    M6 = 3 << Position6,
    A6 = 4 << Position6,

    Position7 = Position6 + 3,
    // 3 bits for 7ths
    Mask7 = NoteMask3Bits << Position7,
    d7 = 1 << Position7,
    m7 = 2 << Position7,
    M7 = 3 << Position7,
    A7 = 4 << Position7,

    // 1 bit for 9ths (and sharing 3 bits from 2nds)
    OttavaAlta9 = 1 << 16,

    Mask9 = Mask2 | OttavaAlta9,
    d9 = d2 | OttavaAlta9,
    m9 = m2 | OttavaAlta9,
    M9 = M2 | OttavaAlta9,
    A9 = A2 | OttavaAlta9,

    // 1 bit for 11ths (and sharing 3 bits from 4ths)
    OttavaAlta11 = 1 << 17,

    Mask11 = Mask4 | OttavaAlta11,
    d11 = d4 | OttavaAlta11,
    P11 = P4 | OttavaAlta11,
    A11 = A4 | OttavaAlta11,

    // 1 bit for 13ths (and sharing 3 bits from 6ths)
    OttavaAlta13 = 1 << 18,

    Mask13 = Mask6 | OttavaAlta13,
    d13 = d6 | OttavaAlta13,
    m13 = m6 | OttavaAlta13,
    M13 = M6 | OttavaAlta13,
    A13 = A6 | OttavaAlta13,

    BaseChordTypeMask = 0b11111111 << 20,
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
    SeventhMask = SeventhChord | TriadMask | Mask7,
    DominantSeventh = SeventhChord | MajorTriad | m7,
    MajorSeventh = SeventhChord | MajorTriad | M7,
    MinorSeventh = SeventhChord | MinorTriad | m7,
    AugmentedSeventh = SeventhChord | AugmentedTriad | m7,
    HalfDiminishedSeventh = SeventhChord | DiminishedTriad | m7,
    DiminishedSeventh = SeventhChord | DiminishedTriad | d7,
    DominantNinth = DominantSeventh | ExtendedNinthChord | M9,
    DominantEleventh = DominantNinth | ExtendedEleventhChord | P11,
    DominantThirteenth = DominantEleventh | ExtendedThirteenthChord | M13,

    BT_Mask = Mask3 | Mask5 | Mask7,
    BT_MaskWithSuspension = Mask2 | Mask3 | Mask4 | Mask5 | Mask7,

    BT_MajorTriadOmittingFifth = M3,
    BT_MinorTriadOmittingFifth = m3,

    BT_PowerChord = P5,
    BT_PowerChordSharpenFifth = A5,
    BT_PowerChordFlattenFifth = d5,

    BT_MajorTriad = M3 | P5,
    BT_MinorTriad = m3 | P5,
    BT_DiminishedTriad = m3 | d5,
    BT_AugmentedTriad = M3 | A5,

    BT_MinorTriadSharpenFifth = m3 | A5,
    BT_MajorTriadFlattenFifth = M3 | d5,

    BT_SuspendedSecond = M2 | P5,
    BT_SuspendedFourth = P4 | P5,
    BT_DiminishedSuspendedSecond = M2 | d5,
    BT_DiminishedSuspendedFourth = P4 | d5,
    BT_AugmentedSuspendedSecond = M2 | A5,
    BT_AugmentedSuspendedFourth = P4 | A5,

    BT_DominantSeventhOmittingFifth = M3 | m7,
    BT_MajorSeventhOmittingFifth = M3 | M7,
    BT_MinorSeventhOmittingFifth = m3 | m7,
    BT_MinorMajorSeventhOmittingFifth = m3 | M7,

    BT_DominantSeventh = M3 | P5 | m7,
    BT_DominantSeventhFlattenFifth = M3 | d5 | m7,
    BT_MajorSeventh = M3 | P5 | M7,
    BT_MajorSeventhFlattenFifth = M3 | d5 | M7,
    BT_MinorSeventh = m3 | P5 | m7,
    BT_MinorSeventhSharppenFifith = m3 | A5 | m7,
    BT_AugmentedSeventh = M3 | A5 | m7,
    BT_AugmentedMajorSeventh = M3 | A5 | M7,
    BT_MinorMajorSeventh = m3 | P5 | M7,
    BT_HalfDiminishedSeventh = m3 | d5 | m7,
    BT_DiminishedSeventh = m3 | d5 | d7,
    BT_DiminishedMajorSeventh = m3 | d5 | M7,

    BT_DominantSeventhSuspendedSecond = M2 | P5 | m7,
    BT_DominantSeventhSuspendedFourth = P4 | P5 | m7,
    BT_DominantSeventhFlattenFifthSuspendedSecond = M2 | d5 | m7,
    BT_DominantSeventhFlattenFifthSuspendedFourth = P4 | d5 | m7,
    BT_MajorSeventhSuspendedSecond = M2 | P5 | M7,
    BT_MajorSeventhSuspendedFourth = P4 | P5 | M7,
    BT_AugmentedSeventhSuspendedSecond = M2 | A5 | m7,
    BT_AugmentedSeventhSuspendedFourth = P4 | A5 | m7,
    BT_AugmentedMajorSeventhSuspendedSecond = M2 | A5 | M7,
    BT_AugmentedMajorSeventhSuspendedFourth = P4 | A5 | M7,
    BT_HalfDiminishedSeventhSuspendedSecond = M2 | d5 | m7,
    BT_HalfDiminishedSeventhSuspendedFourth = P4 | d5 | m7,
    BT_DiminishedSeventhSuspendedSecond = M2 | d5 | d7,
    BT_DiminishedSeventhSuspendedFourth = P4 | d5 | d7,
    BT_DiminishedMajorSeventhSuspendedSecond = M2 | d5 | M7,
    BT_DiminishedMajorSeventhSuspendedFourth = P4 | d5 | M7,

}

export namespace ChordType {

    export const degreePositions: { [degree: number]: ChordType } = {
        2: ChordType.Position2,
        3: ChordType.Position3,
        4: ChordType.Position4,
        5: ChordType.Position5,
        6: ChordType.Position6,
        7: ChordType.Position7,
        9: ChordType.Position2,
        11: ChordType.Position4,
        13: ChordType.Position6
    };

    export const degreeMasks: { [degree: number]: ChordType } = {
        2: ChordType.Mask2,
        3: ChordType.Mask3,
        4: ChordType.Mask4,
        5: ChordType.Mask5,
        6: ChordType.Mask6,
        7: ChordType.Mask7,
        9: ChordType.Mask9,
        11: ChordType.Mask11,
        13: ChordType.Mask13,
    };

    export const advancedDegreeMasks: { [degree: number]: ChordType } = {
        2: ChordType.Mask9,
        3: ChordType.Mask3,
        4: ChordType.Mask11,
        5: ChordType.Mask5,
        6: ChordType.Mask13,
        7: ChordType.Mask7,
        9: ChordType.Mask9,
        11: ChordType.Mask11,
        13: ChordType.Mask13,
    };

    const intervalLookup: { [type: number]: Interval } = {
        [ChordType.m2]: Interval.m2,
        [ChordType.M2]: Interval.M2,
        [ChordType.A2]: Interval.A2,
        [ChordType.d2]: Interval.d2,
        [ChordType.m3]: Interval.m3,
        [ChordType.M3]: Interval.M3,
        [ChordType.A3]: Interval.A3,
        [ChordType.d3]: Interval.d3,
        [ChordType.P4]: Interval.P4,
        [ChordType.A4]: Interval.A4,
        [ChordType.d4]: Interval.d4,
        [ChordType.P5]: Interval.P5,
        [ChordType.A5]: Interval.A5,
        [ChordType.d5]: Interval.d5,
        [ChordType.m6]: Interval.m6,
        [ChordType.M6]: Interval.M6,
        [ChordType.A6]: Interval.A6,
        [ChordType.d6]: Interval.d6,
        [ChordType.m7]: Interval.m7,
        [ChordType.M7]: Interval.M7,
        [ChordType.A7]: Interval.A7,
        [ChordType.d7]: Interval.d7,
        [ChordType.m9]: Interval.m9,
        [ChordType.M9]: Interval.M9,
        [ChordType.A9]: Interval.A9,
        [ChordType.d9]: Interval.d9,
        [ChordType.P11]: Interval.P11,
        [ChordType.A11]: Interval.A11,
        [ChordType.d11]: Interval.d11,
        [ChordType.m13]: Interval.m13,
        [ChordType.M13]: Interval.M13,
        [ChordType.A13]: Interval.A13,
        [ChordType.d13]: Interval.d13
    };

    export function getIntervals(type: ChordType): Interval[] {
        let intervals: Interval[] = [];

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

        if (!addInterval(ChordType.Mask9, ChordType.OttavaAlta9)) {
            addInterval(ChordType.Mask2);
        }

        if (!addInterval(ChordType.Mask11, ChordType.OttavaAlta11)) {
            addInterval(ChordType.Mask4);
        }

        if (!addInterval(ChordType.Mask13, ChordType.OttavaAlta13)) {
            addInterval(ChordType.Mask6);
        }

        intervals = intervals.sort((a, b) => a.number - b.number);
        return intervals;
    }

}