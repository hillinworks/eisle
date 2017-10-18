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
    private explicitMajor: boolean;

    parse(chordName: string): ParseResult<Chord> {

        this.helper = new ParseHelper();
        this.scanner = new Scanner(chordName.trim());

        this.explicitMajor = false;

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

    private checkTritone(alteredNote: string): boolean {

        if ((this.chordType & ChordType.Mask5) === ChordType.d5) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveDiminishedFifth, alteredNote);
            return true;
        }

        if ((this.chordType & ChordType.Mask11) === ChordType.A11) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveAugmentedEleventh, alteredNote);
            return true;
        } else {
            if ((this.chordType & ChordType.Mask4) === ChordType.A4) {
                this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveAugmentedFourth, alteredNote);
                return true;
            }
        }

        return false;
    }

    private readAltered(): ParseResultMaybeEmpty<void> {
        this.scanner.skipWhitespaces();
        const alteredNote = this.scanner.readAnyPatternOf("\\-5", "b5", "♭5", "\\+5", "\\#5", "♯5", "\\-9", "b9", "♭9", "\\+9", "\\#9", "♯9", "\\+11", "\\#11", "♯11");
        switch (alteredNote) {

            case "-5":
            case "b5":
            case "♭5":

                if (this.checkTritone(alteredNote)) {
                    return this.helper.empty();
                }

                this.chordType = this.chordType & ~ChordType.Mask5 | ChordType.d5 | ChordType.WithAlteredNotes;
                return this.helper.voidSuccess();
            case "+5":
            case "#5":
            case "♯5":

                if ((this.chordType & ChordType.Mask5) === ChordType.A5) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveAugmentedFifth, alteredNote);
                    return this.helper.empty();
                } else if ((this.chordType & ChordType.Mask6) === ChordType.m6) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveMinorSixth, alteredNote);
                    return this.helper.empty();
                }

                this.chordType = this.chordType & ~ChordType.Mask5 | ChordType.A5 | ChordType.WithAlteredNotes;
                return this.helper.voidSuccess();
            case "-9":
            case "b9":
            case "♭9":

                if ((this.chordType & ChordType.Mask9) === ChordType.m9) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveMinorNinth, alteredNote);
                    return this.helper.empty();
                } else if ((this.chordType & ChordType.Mask2) === ChordType.m2) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveMinorSecond, alteredNote);
                    return this.helper.empty();
                }

                this.chordType = this.chordType & ~ChordType.Mask9 | ChordType.m9 | ChordType.WithAlteredNotes;
                return this.helper.voidSuccess();
            case "+9":
            case "#9":
            case "♯9":

                if ((this.chordType & ChordType.Mask9) === ChordType.A9) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveAugmentedNinth, alteredNote);
                    return this.helper.empty();
                } else if ((this.chordType & ChordType.Mask2) === ChordType.A2) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveAugmentedSecond, alteredNote);
                    return this.helper.empty();
                } else if ((this.chordType & ChordType.Mask3) === ChordType.m3) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveMinorThird, alteredNote);
                    return this.helper.empty();
                }

                this.chordType = this.chordType & ~ChordType.Mask9 | ChordType.A9 | ChordType.WithAlteredNotes;
                return this.helper.voidSuccess();
            case "+11":
            case "#11":
            case "♯11":

                if (this.checkTritone(alteredNote)) {
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

                if ((this.chordType & ChordType.Mask2) !== 0) {
                    return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_ChordAlreadyHaveSecondWhenSuspending);
                }

                this.chordType = this.chordType & ~ChordType.Mask3 | ChordType.M2;
                return this.helper.voidSuccess();

            case "sus4":
            case "sus":
                if ((this.chordType & ChordType.Mask3) !== ChordType.M3) {
                    this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_ChordSuspended4NotAvailable);
                    return this.helper.empty();
                }

                if ((this.chordType & ChordType.Mask4) !== 0) {
                    this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_ChordAlreadyHaveFourthWhenSuspending);
                }

                this.chordType = this.chordType & ~ChordType.Mask3 | ChordType.P4;
                return this.helper.voidSuccess();
        }

        return this.helper.empty();
    }

    private checkAddSecondOrNinth(addedTone: string): boolean {

        if ((this.chordType & ChordType.Mask9) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveNinthWhileAddingTone, addedTone);
            return true;
        } else if ((this.chordType & ChordType.Mask2) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveSecondWhileAddingTone, addedTone);
            return true;
        }

        return true;

    }

    private checkAddFourthOrEleventh(addedTone: string): boolean {

        if ((this.chordType & ChordType.Mask11) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveEleventhWhileAddingTone, addedTone);
            return true;
        } else if ((this.chordType & ChordType.Mask4) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveFourthWhileAddingTone, addedTone);
            return true;
        }

        return true;
    }

    private checkAddSixthOrThirteenth(addedTone: string): boolean {

        if ((this.chordType & ChordType.Mask13) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveThirteenthWhileAddingTone, addedTone);
            return true;
        } else if ((this.chordType & ChordType.Mask6) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveSixthWhileAddingTone, addedTone);
            return true;
        }

        return true;
    }

    private readAddedTone(): ParseResultMaybeEmpty<void> {
        this.scanner.skipWhitespaces();

        const anchor = this.scanner.makeAnchor();

        if (!this.scanner.expect("add")) {
            return ParseHelper.empty();
        }

        const addedTone = this.scanner.readAnyPatternOf(
            "\\#2", "♯2", "b2", "♭2", "2",
            "\\#4", "♯4", "4",
            "\\#6", "♯6", "b6", "♭6", "6",
            "\\#9", "♯9", "b9", "♭9", "9",
            "\\#11", "♯11", "11",
            "\\#13", "♯13", "b13", "♭13", "13");

        const _this = this;
        function setAddedTone(validator: (t: string) => boolean, tone: ChordType): ParseResultMaybeEmpty<void> {
            if (!validator.bind(_this)("add" + addedTone)) {
                return _this.helper.empty();
            }
            _this.chordType |= tone | ChordType.AddedTone;

            return _this.helper.voidSuccess();
        }

        switch (addedTone) {

            case "#2":
            case "♯2":
                return setAddedTone(this.checkAddSecondOrNinth, ChordType.A2);

            case "b2":
            case "♭2":
                return setAddedTone(this.checkAddSecondOrNinth, ChordType.m2);

            case "2":
                return setAddedTone(this.checkAddSecondOrNinth, ChordType.M2);

            case "#4":
            case "♯4":
                return setAddedTone(this.checkAddFourthOrEleventh, ChordType.A4);

            case "4":
                return setAddedTone(this.checkAddFourthOrEleventh, ChordType.P4);

            case "#6":
            case "♯6":
                return setAddedTone(this.checkAddSixthOrThirteenth, ChordType.A6);

            case "b6":
            case "♭6":
                return setAddedTone(this.checkAddSixthOrThirteenth, ChordType.m6);

            case "6":
                return setAddedTone(this.checkAddSixthOrThirteenth, ChordType.M6);

            case "#9":
            case "♯9":
                return setAddedTone(this.checkAddSecondOrNinth, ChordType.A9);

            case "b9":
            case "♭9":
                return setAddedTone(this.checkAddSecondOrNinth, ChordType.m9);

            case "9":
                return setAddedTone(this.checkAddSecondOrNinth, ChordType.M9);

            case "#11":
            case "♯11":
                return setAddedTone(this.checkAddFourthOrEleventh, ChordType.A11);

            case "11":
                return setAddedTone(this.checkAddFourthOrEleventh, ChordType.P11);

            case "#13":
            case "♯13":
                return setAddedTone(this.checkAddSixthOrThirteenth, ChordType.A13);

            case "b13":
            case "♭13":
                return setAddedTone(this.checkAddSixthOrThirteenth, ChordType.m13);

            case "13":
                return setAddedTone(this.checkAddSixthOrThirteenth, ChordType.M13);

            default:
                return this.helper.fail(anchor.range, ChordParseMessages.Error_UnknownAddedTone);
        }
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

        this.scanner.expect("dom"); // consume 'dom' if existed
        switch (this.scanner.readAnyPatternOf("7", "9", "11", "13")) {
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
        if (this.scanner.expect("7")) {
            switch (this.chordType & ChordType.TriadMask) {
                case ChordType.DiminishedTriad:   // Cdim7
                    this.chordType |= ChordType.SeventhChord | ChordType.d7;
                    return this.helper.voidSuccess();
                case ChordType.MinorTriad:    // Cm7
                case ChordType.AugmentedTriad:    // Caug7
                    this.chordType |= ChordType.SeventhChord | ChordType.m7;
                    return this.helper.voidSuccess();
                case ChordType.MajorTriad:    // CM7
                    // because dom7 is already handled elsewhere, we are facing a maj7 here
                    this.chordType |= ChordType.SeventhChord | ChordType.M7;
                    return this.helper.voidSuccess();
            }
        }

        return this.helper.empty();
    }

    private readTriad(): ParseSuccessOrEmptyResult<void> {
        switch (this.scanner.readAnyPatternOf("maj", "min", "aug", "dim", "M", "m", "Δ", "\\+", "\\-", "°")) {
            case undefined:
                this.explicitMajor = false;
                this.chordType = ChordType.MajorTriad;
                return this.helper.voidSuccess();
            case "maj":
            case "M":
            case "Δ":
                this.explicitMajor = true;
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
