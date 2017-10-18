import { Scanner } from "./Scanner";
import { Interval } from "../Core/MusicTheory/Interval";
import { ParseResult, ParseHelper, ParseSuccessOrEmptyResult, ParseResultMaybeEmpty } from "./ParseResult";
import { NoteNameNode } from "./AST/NoteNameNode";
import { Chord } from "../Core/MusicTheory/Chord";
import { NoteName } from "../Core/MusicTheory/NoteName";
import { TextRange } from "../Core/Parsing/TextRange";
import { ChordParseMessages } from "./ChordParseMessages";
import { ChordType } from "../Core/MusicTheory/ChordType";

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
            if (!ParseHelper.isSuccessful(this.readDominant())) {

                // read triad, note this should always success
                ParseHelper.assert(this.readTriad());

                // try read simplified added tones: C2, C69
                if (!ParseHelper.isSuccessful(this.readSimplifiedAddedTone())) {

                    // try read seventh (e.g. not Am7, Gmaj7)
                    if (!ParseHelper.isSuccessful(this.readSeventh())) {

                        if (ParseHelper.isFailed(this.readExtended())) {
                            return this.helper.fail();  // failure message is already stored in this.helper, don't relay
                        }
                    }
                }
            }
        }

        // handle extended altered notes: C9#11
        if (ParseHelper.isFailed(this.readExtendedAltered())) {
            return this.helper.fail();
        }

        // try read suspended chord: Dsus4
        if (ParseHelper.isFailed(this.readSuspended())) {
            return this.helper.fail();
        }

        while (true) {
            const readAddedToneResult = this.readAddedTone();
            // try read ordinal added tone: Cadd9
            if (ParseHelper.isFailed(readAddedToneResult)) {
                return this.helper.fail();
            }

            if (ParseHelper.isEmpty(readAddedToneResult)) {
                break;
            }
        }

        while (true) {
            const readAlteredResult = this.readAltered();
            // try read altered notes: C11#5
            if (ParseHelper.isFailed(readAlteredResult)) {
                return this.helper.fail();
            }

            if (ParseHelper.isEmpty(readAlteredResult)) {
                break;
            }
        }

        let bass: NoteName | undefined = undefined;
        // try read slash chord or inverted chord
        const readBassResult = this.readBass();
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
                ChordParseMessages.Error_ChordNameUnexpectedText,
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
                        return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_ChordDim9NotSupported); // Cdim9 not existed
                    case ChordType.MinorTriad:  // Cm9
                        this.chordType |= ChordType.m7 | ChordType.M9 | ChordType.ExtendedNinthChord;
                        return this.helper.voidSuccess();
                    case ChordType.MajorTriad:  // Cmaj9
                        this.chordType |= ChordType.M7 | ChordType.M9 | ChordType.ExtendedNinthChord;
                        return this.helper.voidSuccess();
                    case ChordType.AugmentedTriad:  // Caug9
                        this.chordType |= ChordType.m7 | ChordType.M9 | ChordType.ExtendedNinthChord;
                        return this.helper.voidSuccess();
                }
                throw new Error();  // should not reach here
            case "11":
                switch (this.chordType & ChordType.TriadMask) {
                    case ChordType.DiminishedTriad:
                        return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_ChordDim11NotSupported);   // Cdim11 not existed
                    case ChordType.MinorTriad:  // Cm11
                        this.chordType |= ChordType.m7 | ChordType.M9 | ChordType.P11 | ChordType.ExtendedEleventhChord;
                        return this.helper.voidSuccess();
                    case ChordType.MajorTriad:  // Cmaj11
                        this.chordType |= ChordType.M7 | ChordType.M9 | ChordType.P11 | ChordType.ExtendedEleventhChord;
                        return this.helper.voidSuccess();
                    case ChordType.AugmentedTriad:  // Caug11
                        this.chordType |= ChordType.m7 | ChordType.M9 | ChordType.P11 | ChordType.ExtendedEleventhChord;
                        return this.helper.voidSuccess();
                }
                throw new Error();  // should not reach here
            case "13":
                switch (this.chordType & ChordType.TriadMask) {
                    case ChordType.DiminishedTriad:
                        return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_ChordDim13NotSupported);   // Cdim13 not existed
                    case ChordType.MinorTriad:  // Cm13
                        this.chordType |= ChordType.m7 | ChordType.M9 | ChordType.P11 | ChordType.M13 | ChordType.ExtendedThirteenthChord;
                        return this.helper.voidSuccess();
                    case ChordType.MajorTriad:  // Cmaj13
                        this.chordType |= ChordType.M7 | ChordType.M9 | ChordType.P11 | ChordType.M13 | ChordType.ExtendedThirteenthChord;
                        return this.helper.voidSuccess();
                    case ChordType.AugmentedTriad:  // Caug13
                        this.chordType |= ChordType.m7 | ChordType.M9 | ChordType.P11 | ChordType.M13 | ChordType.ExtendedThirteenthChord;
                        return this.helper.voidSuccess();
                }
                throw new Error();  // should not reach here
        }

        return this.helper.empty();
    }

    private readBass(): ParseResultMaybeEmpty<NoteName> {

        if (!this.scanner.expectChar("/"))
            return this.helper.empty();

        const noteName = this.helper.absorb(NoteNameNode.parse(this.scanner));
        if (!ParseHelper.isSuccessful(noteName)) {
            return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_ChordMissingOrInvalidBassNote);
        }

        this.chordType |= ChordType.SlashOrInverted;

        return this.helper.success(noteName.value!.toNoteName());
    }

    private checkTritone(): boolean {

        if ((this.chordType & ChordType.Mask5) === ChordType.d5) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveDiminishedFifth);
            return true;
        }

        if ((this.chordType & ChordType.Mask11) === ChordType.A11) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveAugmentedEleventh);
            return true;
        } else {
            if ((this.chordType & ChordType.Mask4) === ChordType.A4) {
                this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveAugmentedFourth);
                return true;
            }
        }

        return false;
    }

    private readAltered(): ParseResultMaybeEmpty<void> {
        this.scanner.skipWhitespaces();
        switch (this.scanner.readAnyPatternOf("\\-5", "b5", "♭5", "\\+5", "\\#5", "♯5", "\\-9", "b9", "♭9", "\\+9", "\\#9", "♯9", "\\+11", "\\#11", "♯11")) {

            case "-5":
            case "b5":
            case "♭5":

                if (this.checkTritone()) {
                    return this.helper.empty();
                }

                this.chordType = this.chordType & ~ChordType.Mask5 | ChordType.d5 | ChordType.WithAlteredNotes;
                return this.helper.voidSuccess();
            case "+5":
            case "#5":
            case "♯5":

                if ((this.chordType & ChordType.Mask5) === ChordType.A5) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveAugmentedFifth);
                    return this.helper.empty();
                } else if ((this.chordType & ChordType.Mask6) === ChordType.m6) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveMinorSixth);
                    return this.helper.empty();
                }

                this.chordType = this.chordType & ~ChordType.Mask5 | ChordType.A5 | ChordType.WithAlteredNotes;
                return this.helper.voidSuccess();
            case "-9":
            case "b9":
            case "♭9":

                if ((this.chordType & ChordType.Mask9) === ChordType.m9) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveMinorNinth);
                    return this.helper.empty();
                } else if ((this.chordType & ChordType.Mask2) === ChordType.m2) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveMinorSecond);
                    return this.helper.empty();
                }


                this.chordType = this.chordType & ~ChordType.Mask9 | ChordType.m9 | ChordType.WithAlteredNotes;
                return this.helper.voidSuccess();
            case "+9":
            case "#9":
            case "♯9":

                if ((this.chordType & ChordType.Mask9) === ChordType.A9) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveAugmentedNinth);
                    return this.helper.empty();
                } else if ((this.chordType & ChordType.Mask2) === ChordType.A2) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveAugmentedSecond);
                    return this.helper.empty();
                } else if ((this.chordType & ChordType.Mask3) === ChordType.m3) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveMinorThird);
                    return this.helper.empty();
                }


                this.chordType = this.chordType & ~ChordType.Mask9 | ChordType.A9 | ChordType.WithAlteredNotes;
                return this.helper.voidSuccess();
            case "+11":
            case "#11":
            case "♯11":

                if (this.checkTritone()) {
                    return this.helper.empty();
                }

                this.chordType = this.chordType & ~ChordType.Mask11 | ChordType.A11 | ChordType.WithAlteredNotes;
                return this.helper.voidSuccess();
        }

        return this.helper.empty();
    }

    private readSuspended(): ParseResultMaybeEmpty<void> {
        this.scanner.skipWhitespaces();
        switch (this.scanner.readAnyPatternOf("sus2", "sus4", "sus")) {
            case "sus2":

                if ((this.chordType & ChordType.Mask3) !== ChordType.M3) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_ChordSuspended2NotAvailable);
                    return this.helper.empty();
                }

                this.chordType = this.chordType & ~ChordType.Mask3 | ChordType.M2;
                return this.helper.voidSuccess();

            case "sus4":
            case "sus":
                if ((this.chordType & ChordType.Mask3) !== ChordType.M3) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_ChordSuspended4NotAvailable);
                    return this.helper.empty();
                }

                this.chordType = this.chordType & ~ChordType.Mask3 | ChordType.P4;
                return this.helper.voidSuccess();
        }

        return this.helper.empty();
    }

    private checkAddNinth(): boolean {

        if ((this.chordType & ChordType.Mask9) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveNinthWhileAddingTone);
            return true;
        } else if ((this.chordType & ChordType.Mask2) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveSecondWhileAddingTone);
            return true;
        }

        if ((this.chordType & ChordType.BasicChordTypeMask) === ChordType.SeventhChord) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AddNinthOnSeventhChord);
        }

        return false;

    }

    private checkAddEleventh(): boolean {

        if ((this.chordType & ChordType.Mask11) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveEleventhWhileAddingTone);
            return true;
        } else if ((this.chordType & ChordType.Mask4) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveFourthWhileAddingTone);
            return true;
        }

        if ((this.chordType & ChordType.BasicChordTypeMask) === ChordType.ExtendedNinthChord) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AddEleventhOnNinthChord);
        }

        return false;
    }

    private checkAddThirteenth(): boolean {

        if ((this.chordType & ChordType.Mask13) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveThirteenthWhileAddingTone);
            return true;
        } else if ((this.chordType & ChordType.Mask6) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveSixthWhileAddingTone);
            return true;
        }

        if ((this.chordType & ChordType.BasicChordTypeMask) === ChordType.ExtendedEleventhChord) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AddThirteenthOnEleventhChord);
        }

        return false;
    }

    private readAddedTone(): ParseResultMaybeEmpty<void> {
        this.scanner.skipWhitespaces();


        switch (this.scanner.readAnyPatternOf(
            "add\\#9", "add♯9", "addb9", "add♭9", "add9",
            "add\\#11", "add♯11", "add11",
            "add\\#13", "add♯13", "addb13", "add♭13", "add13")) {
            case "add#9":
            case "add♯9":

                if (this.checkAddNinth()) {
                    return this.helper.empty();
                }
                this.chordType |= ChordType.A9 | ChordType.AddedTone;

                return this.helper.voidSuccess();

            case "addb9":
            case "add♭9":

                if (this.checkAddNinth()) {
                    return this.helper.empty();
                }

                this.chordType |= ChordType.m9 | ChordType.AddedTone;

                return this.helper.voidSuccess();


            case "add9":

                if (this.checkAddNinth()) {
                    return this.helper.empty();
                }

                this.chordType |= ChordType.M9 | ChordType.AddedTone;

                return this.helper.voidSuccess();

            case "add#11":
            case "add♯11":

                if (this.checkAddEleventh()) {
                    return this.helper.empty();
                }

                this.chordType |= ChordType.A11 | ChordType.AddedTone;
                return this.helper.voidSuccess();
            case "add11":

                if (this.checkAddEleventh()) {
                    return this.helper.empty();
                }

                this.chordType |= ChordType.P11 | ChordType.AddedTone;
                return this.helper.voidSuccess();
            case "add#13":
            case "add♯13":

                if (this.checkAddThirteenth()) {
                    return this.helper.empty();
                }

                this.chordType |= ChordType.A13 | ChordType.AddedTone;
                return this.helper.voidSuccess();
            case "addb13":
            case "add♭13":

                if (this.checkAddThirteenth()) {
                    return this.helper.empty();
                }

                this.chordType |= ChordType.m13 | ChordType.AddedTone;
                return this.helper.voidSuccess();
            case "add13":

                if (this.checkAddThirteenth()) {
                    return this.helper.empty();
                }

                this.chordType |= ChordType.M13 | ChordType.AddedTone;
                return this.helper.voidSuccess();
        }

        return this.helper.empty();
    }

    private readSimplifiedAddedTone(): ParseSuccessOrEmptyResult<void> {
        switch (this.scanner.readAnyPatternOf("6\\/9", "69", "2", "4", "6")) {
            case "6/9":
            case "69":
                this.chordType |= ChordType.AddedTone | ChordType.M6 | ChordType.M9;
                return this.helper.voidSuccess();
            case "2":
                this.chordType |= ChordType.AddedTone | ChordType.M2;
                return this.helper.voidSuccess();
            case "4":
                this.chordType |= ChordType.AddedTone | ChordType.P4;
                return this.helper.voidSuccess();
            case "6":
                this.chordType |= ChordType.AddedTone | ChordType.M6;
                return this.helper.voidSuccess();
        }
        return this.helper.empty();
    }

    private readExtendedAltered(): ParseSuccessOrEmptyResult<void> {
        if ((this.chordType & ChordType.SeventhChord) !== ChordType.SeventhChord) {
            // this is not even a seventh chord (which is then not possible to be an extended chord, either)
            return this.helper.empty();
        }

        if ((this.chordType & ChordType.Mask6) !== 0) {
            // already have 6th/13th
            return this.helper.empty();
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
                    return this.helper.empty();
            }
        }

        if (has9th && !has11th) {
            if (this.scanner.readAnyPatternOf("\\+11", "\\#11", "♯11")) {
                this.chordType |= ChordType.WithAlteredNotes
                    | ChordType.A11
                    | ChordType.ExtendedEleventhChord;
                success = true;
            } else {
                return this.helper.empty();
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
                    return this.helper.empty();
            }

        }

        return success ? this.helper.voidSuccess() : this.helper.empty();
    }

    private readDominant(): ParseSuccessOrEmptyResult<void> {
        switch (this.scanner.readAnyPatternOf("dom7", "7", "9", "11", "13")) {
            case "dom7":
            case "7":
                this.chordType = ChordType.DominantSeventh;
                return this.helper.voidSuccess();
            case "9":
                this.chordType = ChordType.DominantNinth;
                return this.helper.voidSuccess();
            case "11":
                this.chordType = ChordType.DominantEleventh;
                return this.helper.voidSuccess();
            case "13":
                this.chordType = ChordType.DominantThirteenth;
                return this.helper.voidSuccess();
        }

        return this.helper.empty();
    }

    private readSeventh(): ParseSuccessOrEmptyResult<void> {
        this.scanner.skipWhitespaces();
        switch (this.scanner.readAnyPatternOf("maj7", "M7", "Δ7", "7")) {
            case "maj7":
            case "M7":
            case "Δ7":
                this.chordType |= ChordType.SeventhChord | ChordType.M7;
                return this.helper.voidSuccess();
            case "7":
                switch (this.chordType & ChordType.TriadMask) {
                    case ChordType.DiminishedTriad:   // Cdim7
                        this.chordType |= ChordType.SeventhChord | ChordType.d7;
                        return this.helper.voidSuccess();
                    case ChordType.MinorTriad:    // Cm7
                    case ChordType.AugmentedTriad:    // Caug7
                        this.chordType |= ChordType.SeventhChord | ChordType.m7;
                        return this.helper.voidSuccess();
                    case ChordType.MajorTriad:    // CM7
                        this.chordType |= ChordType.SeventhChord | ChordType.M7;
                        return this.helper.voidSuccess();
                }
                break;
        }

        return this.helper.empty();
    }

    private readTriad(): ParseSuccessOrEmptyResult<void> {
        switch (this.scanner.readAnyPatternOf("maj", "min", "aug", "dim", "M", "m", "Δ", "\\+", "\\-", "°")) {
            case undefined:
            case "maj":
            case "M":
            case "Δ":
                this.chordType = ChordType.MajorTriad;
                return this.helper.voidSuccess();
            case "min":
            case "m":
                this.chordType = ChordType.MinorTriad;
                return this.helper.voidSuccess();
            case "aug":
            case "+":
                this.chordType = ChordType.AugmentedTriad;
                return this.helper.voidSuccess();
            case "dim":
            case "-":
            case "°":
                this.chordType = ChordType.DiminishedTriad;
                return this.helper.voidSuccess();
        }

        return this.helper.empty();
    }
}
