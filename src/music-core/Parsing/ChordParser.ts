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

                    // try read seventh and extension (e.g. Am7, Gmaj9, DmM11)
                    if (ParseHelper.isFailed(this.readSeventhAndExtension())) {
                        return this.helper.fail();  // failure message is already stored in this.helper, don't relay
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

        let value: number;
        const alternation = this.scanner.readAnyPatternOf("\\-", "b", "♭", "\\+", "\\#", "♯");
        switch (alternation) {
            case "-":
            case "b":
            case "♭":
                value = -1; break;

            case "+":
            case "#":
            case "♯":
                value = 1; break;

            default:
                return this.helper.empty();
        }

        let degree = this.scanner.readInteger();

        if (degree === undefined) {
            return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_DegreeToAlterExpected, value);
        }

        const alteredNote = (value === 1 ? "♯" : "♭") + degree.toString();
        // fail on non-alterable degrees
        if (degree !== 2 && degree !== 4 && degree !== 5 && degree !== 6 && degree !== 9 && degree !== 11 && degree !== 13) {
            return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_UnalterableDegree, alteredNote);
        }


        // check if the degree to alter is existed
        switch (degree) {
            case 5:
                if ((this.chordType & ChordType.Mask5) === 0) {
                    return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_AlteringNonExistingFifth, alteredNote);
                }
                break;
            case 2:
            case 9:
                const ninth = this.chordType & ChordType.Mask9;
                if (ninth === 0) {
                    return this.helper.fail(this.scanner.lastReadRange,
                        degree === 2 ? ChordParseMessages.Error_AlteringNonExistingSecond : ChordParseMessages.Error_AlteringNonExistingNinth, alteredNote);
                } else {
                    const isSecond = (this.chordType & ChordType.OttavaAlta9) === 0;
                    if (isSecond && degree === 9) {
                        this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlteringNinthWhileHavingSecond, alteredNote);
                        degree = 2;
                    } else if (!isSecond && degree === 2) {
                        this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlteringSecondWhileHavingNinth, alteredNote);
                        degree = 9;
                    }
                }
                break;
            case 4:
            case 11:
                const eleventh = this.chordType & ChordType.Mask11;
                if (eleventh === 0) {
                    return this.helper.fail(this.scanner.lastReadRange,
                        degree === 4 ? ChordParseMessages.Error_AlteringNonExistingFourth : ChordParseMessages.Error_AlteringNonExistingEleventh, alteredNote);
                } else {
                    const isFourth = (this.chordType & ChordType.OttavaAlta11) === 0;
                    if (isFourth && degree === 11) {
                        this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlteringEleventhWhileHavingFourth, alteredNote);
                        degree = 4;
                    } else if (!isFourth && degree === 4) {
                        this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlteringFourthWhileHavingEleventh, alteredNote);
                        degree = 11;
                    }
                }
                break;
            case 6:
            case 13:
                const thirteenth = this.chordType & ChordType.Mask13;
                if (thirteenth === 0) {
                    return this.helper.fail(this.scanner.lastReadRange,
                        degree === 6 ? ChordParseMessages.Error_AlteringNonExistingSixth : ChordParseMessages.Error_AlteringNonExistingThirteenth, alteredNote);
                } else {
                    const isSixth = (this.chordType & ChordType.OttavaAlta13) === 0;
                    if (isSixth && degree === 13) {
                        this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlteringThirteenthWhileHavingSixth, alteredNote);
                        degree = 6;
                    } else if (!isSixth && degree === 6) {
                        this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlteringSixthWhileHavingThirteenth, alteredNote);
                        degree = 13;
                    }
                }
                break;
        }

        function alteringAny(...options: number[][]): boolean {
            for (const option of options) {
                if (degree === option[0] && value === option[1]) {
                    return true;
                }
            }
            return false;
        }

        const _this = this;
        function warnOrFailOnConflict(expectedDegree: number, warningMessage: string, failMessage: string) {
            if (degree === expectedDegree) {
                _this.helper.warning(_this.scanner.lastReadRange, warningMessage, alteredNote);
                return _this.helper.empty();
            } else {
                return _this.helper.fail(_this.scanner.lastReadRange, failMessage, alteredNote);
            }
        }

        // check illegal alterations
        if (alteringAny([5, -1], [4, 1], [11, 1])) {
            if ((this.chordType & ChordType.Mask5) === ChordType.d5) {
                return warnOrFailOnConflict(5,
                    ChordParseMessages.Warning_AlreadyHaveDiminishedFifth,
                    ChordParseMessages.Error_AlreadyHaveDiminishedFifth);
            }

            switch (this.chordType & ChordType.Mask11) {
                case ChordType.A11:
                    return warnOrFailOnConflict(11,
                        ChordParseMessages.Warning_AlreadyHaveAugmentedEleventh,
                        ChordParseMessages.Error_AlreadyHaveAugmentedEleventh);
                case ChordType.A4:
                    return warnOrFailOnConflict(11,
                        ChordParseMessages.Warning_AlreadyHaveAugmentedFourth,
                        ChordParseMessages.Error_AlreadyHaveAugmentedFourth);
            }
        } else if (alteringAny([5, 1], [6, -1], [13, -1])) {
            if ((this.chordType & ChordType.Mask5) === ChordType.A5) {
                return warnOrFailOnConflict(5,
                    ChordParseMessages.Warning_AlreadyHaveAugmentedFifth,
                    ChordParseMessages.Error_AlreadyHaveAugmentedFifth);
            } else {
                switch (this.chordType & ChordType.Mask13) {
                    case ChordType.m13:
                        return warnOrFailOnConflict(13,
                            ChordParseMessages.Warning_AlreadyHaveMinorThirteenth,
                            ChordParseMessages.Error_AlreadyHaveMinorThirteenth);
                    case ChordType.m6:
                        return warnOrFailOnConflict(6,
                            ChordParseMessages.Warning_AlreadyHaveMinorSixth,
                            ChordParseMessages.Error_AlreadyHaveMinorSixth);
                }
            }
        } else if (alteringAny([2, -1], [9, -1])) {
            switch (this.chordType & ChordType.Mask9) {
                case ChordType.m9:
                    return warnOrFailOnConflict(9,
                        ChordParseMessages.Warning_AlreadyHaveMinorNinth,
                        ChordParseMessages.Error_AlreadyHaveMinorNinth);
                case ChordType.m2:
                    return warnOrFailOnConflict(2,
                        ChordParseMessages.Warning_AlreadyHaveMinorSecond,
                        ChordParseMessages.Error_AlreadyHaveMinorSecond);
            }
        } else if (alteringAny([2, 1], [9, 1])) {
            switch (this.chordType & ChordType.Mask9) {
                case ChordType.A9:
                    return warnOrFailOnConflict(9,
                        ChordParseMessages.Warning_AlreadyHaveAugmentedNinth,
                        ChordParseMessages.Error_AlreadyHaveAugmentedNinth);
                case ChordType.A2:
                    return warnOrFailOnConflict(2,
                        ChordParseMessages.Warning_AlreadyHaveAugmentedSecond,
                        ChordParseMessages.Error_AlreadyHaveAugmentedSecond);
            }
            if ((this.chordType & ChordType.Mask3) === ChordType.m3) {
                return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_AlreadyHaveMinorThird, alteredNote);
            }
        } else if (alteringAny([6, 1], [13, 1])) {
            switch (this.chordType & ChordType.Mask9) {
                case ChordType.A13:
                    return warnOrFailOnConflict(13,
                        ChordParseMessages.Warning_AlreadyHaveAugmentedThirteenth,
                        ChordParseMessages.Error_AlreadyHaveAugmentedThirteenth);
                case ChordType.A6:
                    return warnOrFailOnConflict(6,
                        ChordParseMessages.Warning_AlreadyHaveAugmentedSixth,
                        ChordParseMessages.Error_AlreadyHaveAugmentedSixth);
            }
            if ((this.chordType & ChordType.Mask3) === ChordType.m7) {
                return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_AlreadyHaveMinorSeventh, alteredNote);
            }
        } else if (alteringAny([4, -1])) {
            return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_AlteringWithFlattenFourth);
        }
        else if (alteringAny([4, -1])) {
            return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_AlteringWithFlattenEleventh);
        }

        const degreeMask = ChordType.advancedDegreeMasks[degree];
        this.chordType = this.chordType
            & ~degreeMask    // clear current value
            | ((this.chordType & degreeMask) + (value << ChordType.degreePositions[degree]))    // assign new values
            | ChordType.WithAlteredNotes;

        return this.helper.voidSuccess();

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

        if ((this.chordType & ChordType.Mask9) > ChordType.OttavaAlta9) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveNinthWhileAddingTone, addedTone);
            return false;
        } else if ((this.chordType & ChordType.Mask2) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveSecondWhileAddingTone, addedTone);
            return false;
        }

        return true;

    }

    private checkAddFourthOrEleventh(addedTone: string): boolean {

        if ((this.chordType & ChordType.Mask11) > ChordType.OttavaAlta11) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveEleventhWhileAddingTone, addedTone);
            return false;
        } else if ((this.chordType & ChordType.Mask4) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveFourthWhileAddingTone, addedTone);
            return false;
        }

        return true;
    }

    private checkAddSixthOrThirteenth(addedTone: string): boolean {

        if ((this.chordType & ChordType.Mask13) > ChordType.OttavaAlta13) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveThirteenthWhileAddingTone, addedTone);
            return false;
        } else if ((this.chordType & ChordType.Mask6) > 0) {
            this.helper.warning(this.scanner.lastReadRange, ChordParseMessages.Warning_AlreadyHaveSixthWhileAddingTone, addedTone);
            return false;
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
            "\\#2", "♯2", "\\+2", "b2", "♭2", "\\-2", "2",
            "\\#4", "♯4", "\\+4", "♭4", "\\-4", "4",
            "\\#6", "♯6", "\\+6", "b6", "♭6", "\\-6", "6",
            "\\#9", "♯9", "\\+9", "b9", "♭9", "\\-9", "9",
            "\\#11", "♯11", "\\+11", "b11", "♭11", "\\-11", "11",
            "\\#13", "♯13", "\\+13", "b13", "♭13", "\\-13", "13");

        const ordinizedAddedTone = addedTone.replace(/[b\-]/, "♭").replace(/[\#\+]/, "♯");

        const _this = this;
        function setAddedTone(validator: (t: string) => boolean, tone: ChordType): ParseResultMaybeEmpty<void> {
            if (!validator.bind(_this)("add" + ordinizedAddedTone)) {
                return _this.helper.empty();
            }
            _this.chordType |= tone | ChordType.AddedTone;

            return _this.helper.voidSuccess();
        }

        switch (addedTone) {

            case "#2":
            case "♯2":
            case "+2":
                return setAddedTone(this.checkAddSecondOrNinth, ChordType.A2);

            case "b2":
            case "♭2":
            case "-2":
                return setAddedTone(this.checkAddSecondOrNinth, ChordType.m2);

            case "2":
                return setAddedTone(this.checkAddSecondOrNinth, ChordType.M2);

            case "#4":
            case "♯4":
            case "+4":
                return setAddedTone(this.checkAddFourthOrEleventh, ChordType.A4);

            case "4":
                return setAddedTone(this.checkAddFourthOrEleventh, ChordType.P4);

            case "b4":
            case "♭4":
            case "-4":
                return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_AddingFlattenFourth);

            case "#6":
            case "♯6":
            case "+6":
                return setAddedTone(this.checkAddSixthOrThirteenth, ChordType.A6);

            case "b6":
            case "♭6":
            case "-6":
                return setAddedTone(this.checkAddSixthOrThirteenth, ChordType.m6);

            case "6":
                return setAddedTone(this.checkAddSixthOrThirteenth, ChordType.M6);

            case "#9":
            case "♯9":
            case "+9":
                return setAddedTone(this.checkAddSecondOrNinth, ChordType.A9);

            case "b9":
            case "♭9":
            case "-9":
                return setAddedTone(this.checkAddSecondOrNinth, ChordType.m9);

            case "9":
                return setAddedTone(this.checkAddSecondOrNinth, ChordType.M9);

            case "#11":
            case "♯11":
            case "+11":
                return setAddedTone(this.checkAddFourthOrEleventh, ChordType.A11);

            case "11":
                return setAddedTone(this.checkAddFourthOrEleventh, ChordType.P11);


            case "b11":
            case "♭11":
            case "-11":
                return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_AddingFlattenEleventh);

            case "#13":
            case "♯13":
            case "+13":
                return setAddedTone(this.checkAddSixthOrThirteenth, ChordType.A13);

            case "b13":
            case "♭13":
            case "-13":
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

    private readExtendedAltered(): ParseResultMaybeEmpty<void> {
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


            switch (this.scanner.readAnyPatternOf("\\-11", "b11", "♭11", "\\+11", "\\#11", "♯11")) {
                case "-11":
                case "b11":
                case "♭11":
                    return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_AlteringWithFlattenEleventh);

                case "+11":
                case "#11":
                case "♯11":
                    this.chordType |= ChordType.WithAlteredNotes
                        | ChordType.A11
                        | ChordType.ExtendedEleventhChord;
                    success = true;
                    break;
                default:
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

    private readSeventhAndExtension(): ParseResultMaybeEmpty<void> {
        this.scanner.skipWhitespaces();

        const explicitMajor = this.scanner.readAnyPatternOf("maj", "M", "Δ") !== undefined;

        const extension = this.scanner.readAnyPatternOf("7", "9", "11", "13");
        if (extension === undefined) {
            return this.helper.empty();
        }

        const triadType = this.chordType & ChordType.TriadMask;
        if (explicitMajor) {
            this.chordType |= ChordType.SeventhChord | ChordType.M7;
        } else {
            switch (triadType) {
                case ChordType.DiminishedTriad:   // Cdim7
                    this.chordType |= ChordType.SeventhChord | ChordType.d7;
                    break;
                case ChordType.MinorTriad:    // Cm7
                case ChordType.AugmentedTriad:    // Caug7
                    this.chordType |= ChordType.SeventhChord | ChordType.m7;
                    break;
                case ChordType.MajorTriad:    // CM7
                    // because dom7 is already handled elsewhere, we are facing a maj7 here
                    this.chordType |= ChordType.SeventhChord | ChordType.M7;
                    break;
            }
        }

        switch (extension) {
            case "7":
                return this.helper.voidSuccess();
            case "9":
                if (triadType === ChordType.DiminishedTriad) {
                    return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_ChordDim9NotSupported); // Cdim9 not existed
                }

                this.chordType |= ChordType.M9 | ChordType.ExtendedNinthChord;
                return this.helper.voidSuccess();
            case "11":
                if (triadType === ChordType.DiminishedTriad) {
                    return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_ChordDim11NotSupported); // Cdim9 not existed
                }
                this.chordType |= ChordType.M9 | ChordType.P11 | ChordType.ExtendedEleventhChord;
                return this.helper.voidSuccess();
            case "13":

                if (triadType === ChordType.DiminishedTriad) {
                    return this.helper.fail(this.scanner.lastReadRange, ChordParseMessages.Error_ChordDim13NotSupported); // Cdim9 not existed
                }
                this.chordType |= ChordType.M9 | ChordType.P11 | ChordType.M13 | ChordType.ExtendedThirteenthChord;
                return this.helper.voidSuccess();
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
