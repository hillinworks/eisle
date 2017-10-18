import { Scanner } from "../Scanner";
import { Interval } from "../../Core/MusicTheory/Interval";
import { ParseResult, ParseHelper, ParseSuccessOrEmptyResult, ParseResultMaybeEmpty } from "../ParseResult";
import { NoteNameNode } from "./NoteNameNode";
import { Chord } from "../../Core/MusicTheory/Chord";
import { NoteName } from "../../Core/MusicTheory/NoteName";
import { TextRange } from "../../Core/Parsing/TextRange";
import { Messages } from "../Messages";
import { ChordType } from "../../Core/MusicTheory/ChordType";

export class ChordParser {

    private scanner: Scanner;
    private helper: ParseHelper;
    private chordType: ChordType;

    parse(chordName: string): ParseResult<Chord> {

        this.helper = new ParseHelper();
        this.scanner = new Scanner(chordName.trim());

        const noteName = this.helper.absorb(NoteNameNode.parse(this.scanner));
        if (!ParseHelper.isSuccessful(noteName)) {
            return this.helper.fail();
        }

        const root = noteName.value.toNoteName();

        if (this.scanner.isEndOfInput) {
            // simple major triad: C
            return this.helper.success(Chord.X(root));
        }

        if (this.scanner.expectChar("5")) { // fifth (power chord): C5

            this.chordType = ChordType.Fifth;

        } else if (this.scanner.expect("ø7")) { // half diminished seventh: Eø7

            this.chordType = ChordType.HalfDiminishedSeventh;

        } else {

            // try read dominant chord: D7, C13
            if (!ParseHelper.isSuccessful(this.helper.absorb(this.readDominant()))) {

                // read triad, note this should always success
                ParseHelper.assert(this.helper.absorb(this.readTriad()));

                // try read simplified added tones: C2, C69
                if (!ParseHelper.isSuccessful(this.helper.absorb(this.readSimplifiedAddedTone()))) {

                    // try read seventh (e.g. not Am7, Gmaj7)
                    if (!ParseHelper.isSuccessful(this.helper.absorb(this.readSeventh()))) {

                        if (ParseHelper.isFailed(this.helper.absorb(this.readExtended()))) {
                            return this.helper.fail();  // failure message is already stored in this.helper, don't relay
                        }
                    }
                }
            }
        }

        // handle extended altered notes: C9#11
        if (ParseHelper.isFailed(this.helper.absorb(this.readExtendedAltered()))) {
            return this.helper.fail();
        }

        // try read suspended chord: Dsus4
        if (ParseHelper.isFailed(this.helper.absorb(this.readSuspended()))) {
            return this.helper.fail();
        }

        while (true) {
            const readAddedToneResult = this.helper.absorb(this.readAddedTone())
            // try read ordinal added tone: Cadd9
            if (ParseHelper.isFailed(readAddedToneResult)) {
                return this.helper.fail();
            }

            if (ParseHelper.isEmpty(readAddedToneResult)) {
                break;
            }
        }

        while (true) {
            const readAlteredResult = this.helper.absorb(this.readAltered());
            // try read altered notes: C11#5
            if (ParseHelper.isFailed(readAlteredResult)) {
                return this.helper.fail();
            }

            if(ParseHelper.isEmpty(readAlteredResult)) {
                break;
            }
        }

        let bass: NoteName | undefined = undefined;
        // try read slash chord or inverted chord
        const readBassResult = this.helper.absorb(this.readBass());
        if (ParseHelper.isSuccessful(readBassResult)) {
            bass = readBassResult.value;
        } else if (ParseHelper.isFailed(readBassResult)) {
            return this.helper.fail();
        }

        this.scanner.skipWhitespaces();
        if (!this.scanner.isEndOfInput) {
            return this.helper.fail(new TextRange(this.scanner.textPointer,
                this.scanner.remainingLine.length,
                this.scanner.source),
                Messages.Error_ChordNameUnexpectedText,
                this.scanner.remainingLine);
        }

        const chord = new Chord(chordName, root, this.chordType);
        chord.bass = bass;

        return this.helper.success(chord);

    }


    private readExtended(): ParseResultMaybeEmpty<void> {
        switch (this.scanner.readAnyPatternOf("9", "11", "13")) {
            case "9":
                switch (this.chordType & ChordType.TriadMask) {
                    case ChordType.DiminishedTriad:
                        return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordDim9NotSupported); // Cdim9 not existed (d9 == P8)
                    case ChordType.MinorTriad:  // Cm9
                        this.chordType |= ChordType.m7 | ChordType.M9 | ChordType.ExtendedNinthChord;
                        return ParseHelper.voidSuccess;
                    case ChordType.MajorTriad:  // Cmaj9
                        this.chordType |= ChordType.M7 | ChordType.M9 | ChordType.ExtendedNinthChord;
                        return ParseHelper.voidSuccess;
                    case ChordType.AugmentedTriad:  // Caug9
                        this.chordType |= ChordType.m7 | ChordType.M9 | ChordType.ExtendedNinthChord;
                        return ParseHelper.voidSuccess;
                }
                throw new Error();  // should not reach here
            case "11":
                switch (this.chordType & ChordType.TriadMask) {
                    case ChordType.DiminishedTriad:
                        return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordDim11NotSupported);   // Cdim11 not existed
                    case ChordType.MinorTriad:  // Cm11
                        this.chordType |= ChordType.m7 | ChordType.M9 | ChordType.P11 | ChordType.ExtendedEleventhChord;
                        return ParseHelper.voidSuccess;
                    case ChordType.MajorTriad:  // Cmaj11
                        this.chordType |= ChordType.M7 | ChordType.M9 | ChordType.P11 | ChordType.ExtendedEleventhChord;
                        return ParseHelper.voidSuccess;
                    case ChordType.AugmentedTriad:  // Caug11
                        this.chordType |= ChordType.m7 | ChordType.M9 | ChordType.P11 | ChordType.ExtendedEleventhChord;
                        return ParseHelper.voidSuccess;
                }
                throw new Error();  // should not reach here
            case "13":
                switch (this.chordType & ChordType.TriadMask) {
                    case ChordType.DiminishedTriad:
                        return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordDim13NotSupported);   // Cdim13 not existed
                    case ChordType.MinorTriad:  // Cm13
                        this.chordType |= ChordType.m7 | ChordType.M9 | ChordType.P11 | ChordType.M13 | ChordType.ExtendedThirteenthChord;
                        return ParseHelper.voidSuccess;
                    case ChordType.MajorTriad:  // Cmaj13
                        this.chordType |= ChordType.M7 | ChordType.M9 | ChordType.P11 | ChordType.M13 | ChordType.ExtendedThirteenthChord;
                        return ParseHelper.voidSuccess;
                    case ChordType.AugmentedTriad:  // Caug13
                        this.chordType |= ChordType.m7 | ChordType.M9 | ChordType.P11 | ChordType.M13 | ChordType.ExtendedThirteenthChord;
                        return ParseHelper.voidSuccess;
                }
                throw new Error();  // should not reach here
        }

        return ParseHelper.empty();
    }

    private readBass(): ParseResultMaybeEmpty<NoteName> {

        if (!this.scanner.expectChar("/"))
            return this.helper.empty();

        const noteName = this.helper.absorb(NoteNameNode.parse(this.scanner));
        if (!ParseHelper.isSuccessful(noteName)) {
            return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordMissingOrInvalidBassNote);
        }

        this.chordType |= ChordType.SlashOrInverted;

        return this.helper.success(noteName.value!.toNoteName());
    }

    private readAltered(): ParseResultMaybeEmpty<void> {
        this.scanner.skipWhitespaces();
        switch (this.scanner.readAnyPatternOf("\\-5", "b5", "♭5", "\\+5", "\\#5", "♯5", "\\-9", "b9", "♭9", "\\+9", "\\#9", "♯9", "\\+11", "\\#11", "♯11")) {

            case "-5":
            case "b5":
            case "♭5":
                if ((this.chordType & ChordType.SeventhChord) < ChordType.SeventhChord) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAltered5thNotAvailable);   // only available to 7th+
                }

                if ((this.chordType & ChordType.Mask5) === ChordType.d5) {
                    // todo: already has it
                }

                this.chordType = this.chordType & ~ChordType.Mask5 | ChordType.d5 | ChordType.WithAlteredNotes;
                return ParseHelper.voidSuccess;
            case "+5":
            case "#5":
            case "♯5":
                if ((this.chordType & ChordType.SeventhChord) < ChordType.SeventhChord) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAltered5thNotAvailable);   // only available to 7th+
                }

                if ((this.chordType & ChordType.Mask5) === ChordType.A5) {
                    // todo: already has it
                }

                this.chordType = this.chordType & ~ChordType.Mask5 | ChordType.A5 | ChordType.WithAlteredNotes;
                return ParseHelper.voidSuccess;
            case "-9":
            case "b9":
            case "♭9":
                if ((this.chordType & ChordType.ExtendedEleventhChord) < ChordType.ExtendedEleventhChord) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAltered9thNotAvailable);   // only available to 11th+
                }

                if ((this.chordType & ChordType.Mask2) === ChordType.m2) {
                    // already has it
                }

                this.chordType = this.chordType & ~ChordType.Mask2 | ChordType.m9 | ChordType.WithAlteredNotes;
                return ParseHelper.voidSuccess;
            case "+9":
            case "#9":
            case "♯9":
                if ((this.chordType & ChordType.ExtendedEleventhChord) < ChordType.ExtendedEleventhChord) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAltered9thNotAvailable);   // only available to 11th+
                }

                if ((this.chordType & ChordType.Mask2) === ChordType.A2) {
                    // already has it
                }

                this.chordType = this.chordType & ~ChordType.Mask2 | ChordType.A9 | ChordType.WithAlteredNotes;
                return ParseHelper.voidSuccess;
            case "+11":
            case "#11":
            case "♯11":
                if ((this.chordType & ChordType.ExtendedThirteenthChord) < ChordType.ExtendedThirteenthChord) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAltered11thNotAvailable);   // only available to 13th+
                }

                if ((this.chordType & ChordType.Mask4) === ChordType.A4) {
                    // already has it
                }

                this.chordType = this.chordType & ~ChordType.Mask4 | ChordType.A11 | ChordType.WithAlteredNotes;
                return ParseHelper.voidSuccess;
        }

        return ParseHelper.empty();
    }

    private readSuspended(): ParseResultMaybeEmpty<void> {
        this.scanner.skipWhitespaces();
        switch (this.scanner.readAnyPatternOf("sus2", "sus4", "sus")) {
            case "sus2":

                if ((this.chordType & ChordType.Mask3) !== ChordType.M3) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordSuspended2NotAvailable);
                }

                this.chordType = this.chordType & ~ChordType.Mask3 | ChordType.M2;
                return ParseHelper.voidSuccess;

            case "sus4":
            case "sus":
                if ((this.chordType & ChordType.Mask3) !== ChordType.M3) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordSuspended4NotAvailable);
                }

                this.chordType = this.chordType & ~ChordType.Mask3 | ChordType.P4;
                return ParseHelper.voidSuccess;
        }

        return ParseHelper.empty();
    }

    private readAddedTone(): ParseResultMaybeEmpty<void> {
        this.scanner.skipWhitespaces();
        switch (this.scanner.readAnyPatternOf("add\\#9", "add♯9", "addb9", "add♭9", "add9", "add\\#11", "add♯11", "add11", "add\\#13", "add♯13", "addb13", "add♭13", "add13")) {
            case "add#9":
            case "add♯9":

                if ((this.chordType & ChordType.BasicChordTypeMask) > ChordType.Triad) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAdded9thNotAvailable);   // only available to triads
                }

                if ((this.chordType & ChordType.Mask2) === ChordType.A2) {
                    // todo: already have it
                }

                this.chordType |= ChordType.A9 | ChordType.AddedTone;

                return ParseHelper.voidSuccess;
            case "addb9":
            case "add♭9":

                if ((this.chordType & ChordType.BasicChordTypeMask) > ChordType.Triad) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAdded9thNotAvailable);   // only available to triads
                }

                if ((this.chordType & ChordType.Mask2) === ChordType.m2) {
                    // todo: already have it
                }

                this.chordType |= ChordType.m9 | ChordType.AddedTone;

                return ParseHelper.voidSuccess;
            case "add9":

                if ((this.chordType & ChordType.BasicChordTypeMask) > ChordType.Triad) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAdded9thNotAvailable);  // only available to triads
                }

                if ((this.chordType & ChordType.Mask2) === ChordType.M2) {
                    // todo: already have it
                }

                this.chordType |= ChordType.M9 | ChordType.AddedTone;

                return ParseHelper.voidSuccess;
            case "add#11":
            case "add♯11":

                if ((this.chordType & ChordType.BasicChordTypeMask) > ChordType.SeventhChord) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAdded11thNotAvailable);   // only available to triads or seventh
                }

                if ((this.chordType & ChordType.Mask4) === ChordType.A11) {
                    // todo: already have it
                }

                this.chordType |= ChordType.A11 | ChordType.AddedTone;
                return ParseHelper.voidSuccess;
            case "add11":

                if ((this.chordType & ChordType.BasicChordTypeMask) > ChordType.SeventhChord) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAdded11thNotAvailable);   // only available to triads or seventh
                }

                if ((this.chordType & ChordType.Mask4) === ChordType.P11) {
                    // todo: already have it
                }

                this.chordType |= ChordType.P11 | ChordType.AddedTone;
                return ParseHelper.voidSuccess;
            case "add#13":
            case "add♯13":

                if ((this.chordType & ChordType.BasicChordTypeMask) > ChordType.ExtendedNinthChord) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAdded13thNotAvailable);  // only available to triads, sevenths, or ninths
                }

                if ((this.chordType & ChordType.Mask6) === ChordType.A13) {
                    // todo: already have it
                }

                this.chordType |= ChordType.A13 | ChordType.AddedTone;
                return ParseHelper.voidSuccess;
            case "addb13":
            case "add♭13":

                if ((this.chordType & ChordType.BasicChordTypeMask) > ChordType.ExtendedNinthChord) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAdded13thNotAvailable);  // only available to triads, sevenths, or ninths
                }

                if ((this.chordType & ChordType.Mask6) === ChordType.m13) {
                    // todo: already have it
                }

                this.chordType |= ChordType.m13 | ChordType.AddedTone;
                return ParseHelper.voidSuccess;
            case "add13":

                if ((this.chordType & ChordType.BasicChordTypeMask) > ChordType.ExtendedNinthChord) {
                    return this.helper.fail(this.scanner.lastReadRange, Messages.Error_ChordAdded13thNotAvailable);   // only available to triads, sevenths, or ninths
                }

                if ((this.chordType & ChordType.Mask6) === ChordType.M13) {
                    // todo: already have it
                }

                this.chordType |= ChordType.M13 | ChordType.AddedTone;
                return ParseHelper.voidSuccess;
        }

        return ParseHelper.empty();
    }

    private readSimplifiedAddedTone(): ParseSuccessOrEmptyResult<void> {
        switch (this.scanner.readAnyPatternOf("6\\/9", "69", "2", "4", "6")) {
            case "6/9":
            case "69":
                this.chordType |= ChordType.AddedTone | ChordType.M6 | ChordType.M9;
                return ParseHelper.voidSuccess;
            case "2":
                this.chordType |= ChordType.AddedTone | ChordType.M2;
                return ParseHelper.voidSuccess;
            case "4":
                this.chordType |= ChordType.AddedTone | ChordType.P4;
                return ParseHelper.voidSuccess;
            case "6":
                this.chordType |= ChordType.AddedTone | ChordType.M6;
                return ParseHelper.voidSuccess;
        }
        return ParseHelper.empty();
    }

    private readExtendedAltered(): ParseSuccessOrEmptyResult<void> {
        if ((this.chordType & ChordType.SeventhChord) !== ChordType.SeventhChord) {
            return ParseHelper.empty();
        }

        if ((this.chordType & ChordType.Mask6) !== 0) {
            return ParseHelper.empty();
        }

        const has7th = (this.chordType & ChordType.Mask7) !== 0;
        const has9th = (this.chordType & ChordType.Mask2) !== 0;
        const has11th = (this.chordType & ChordType.Mask4) !== 0;

        let success = false;

        if (has7th && !has9th && !has11th) {
            switch (this.scanner.readAnyPatternOf("\\-9", "b9", "♭9", "\\+9", "\\#9", "♯9")) {
                case "-9":
                case "b9":
                case "♭9":
                    this.chordType |= ChordType.WithAlteredNotes
                        | ChordType.m9
                        | ChordType.ExtendedNinthChord;
                    success = true;
                    break;
                case "+9":
                case "#9":
                case "♯9":
                    this.chordType |= ChordType.WithAlteredNotes
                        | ChordType.A9
                        | ChordType.ExtendedNinthChord;
                    success = true;
                    break;
                default:
                    return ParseHelper.empty();
            }
        }

        if (has9th && !has11th) {
            if (this.scanner.readAnyPatternOf("\\+11", "\\#11", "♯11")) {
                this.chordType |= ChordType.WithAlteredNotes
                    | ChordType.A11
                    | ChordType.ExtendedEleventhChord;
                success = true;
            } else {
                return ParseHelper.empty();
            }
        }

        if (has11th) {

            switch (this.scanner.readAnyPatternOf("\\-13", "b13", "♭13", "\\+13", "\\#13", "♯13")) {
                case "-13":
                case "b13":
                case "♭13":
                    this.chordType |= ChordType.WithAlteredNotes
                        | ChordType.m13
                        | ChordType.ExtendedThirteenthChord;
                    success = true;
                    break;
                case "+13":
                case "#13":
                case "♯13":
                    this.chordType |= ChordType.WithAlteredNotes
                        | ChordType.A13
                        | ChordType.ExtendedThirteenthChord;
                    success = true;
                    break;
                default:
                    return ParseHelper.empty();
            }

        }

        return success ? ParseHelper.voidSuccess : ParseHelper.empty();
    }

    private readDominant(): ParseSuccessOrEmptyResult<void> {
        switch (this.scanner.readAnyPatternOf("dom7", "7", "9", "11", "13")) {
            case "dom7":
            case "7":
                this.chordType = ChordType.DominantSeventh;
                return ParseHelper.voidSuccess;
            case "9":
                this.chordType = ChordType.DominantNinth;
                return ParseHelper.voidSuccess;
            case "11":
                this.chordType = ChordType.DominantEleventh;
                return ParseHelper.voidSuccess;
            case "13":
                this.chordType = ChordType.DominantThirteenth;
                return ParseHelper.voidSuccess;
        }

        return ParseHelper.empty();
    }

    private readSeventh(): ParseSuccessOrEmptyResult<void> {
        this.scanner.skipWhitespaces();
        switch (this.scanner.readAnyPatternOf("maj7", "M7", "Δ7", "7")) {
            case "maj7":
            case "M7":
            case "Δ7":
                this.chordType |= ChordType.SeventhChord | ChordType.M7;
                return ParseHelper.voidSuccess;
            case "7":
                switch (this.chordType & ChordType.TriadMask) {
                    case ChordType.DiminishedTriad:   // Cdim7
                        this.chordType |= ChordType.SeventhChord | ChordType.d7;
                        return ParseHelper.voidSuccess;
                    case ChordType.MinorTriad:    // Cm7
                    case ChordType.AugmentedTriad:    // Caug7
                        this.chordType |= ChordType.SeventhChord | ChordType.m7;
                        return ParseHelper.voidSuccess;
                    case ChordType.MajorTriad:    // CM7
                        this.chordType |= ChordType.SeventhChord | ChordType.M7;
                        return ParseHelper.voidSuccess;
                }
                break;
        }

        return ParseHelper.empty();
    }

    private readTriad(): ParseSuccessOrEmptyResult<void> {
        switch (this.scanner.readAnyPatternOf("maj", "min", "aug", "dim", "M", "m", "Δ", "\\+", "\\-", "°")) {
            case undefined:
            case "maj":
            case "M":
            case "Δ":
                this.chordType = ChordType.MajorTriad;
                return ParseHelper.voidSuccess;
            case "min":
            case "m":
                this.chordType = ChordType.MinorTriad;
                return ParseHelper.voidSuccess;
            case "aug":
            case "+":
                this.chordType = ChordType.AugmentedTriad;
                return ParseHelper.voidSuccess;
            case "dim":
            case "-":
            case "°":
                this.chordType = ChordType.DiminishedTriad;
                return ParseHelper.voidSuccess;
        }

        return ParseHelper.empty();
    }
}
