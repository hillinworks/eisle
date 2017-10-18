import { ICommandProcessor } from "../ICommandProcessor";
import { REPLResult } from "../REPLResult";
import { Scanner } from "../../music-core/Parsing/Scanner";
import { ChordParser } from "../../music-core/Parsing/ChordParser";
import { LiteralParsers } from "../../music-core/Parsing/LiteralParsers";
import { ParseHelper } from "../../music-core/Parsing/ParseResult";
import { REPL } from "../repl";
import { select, L } from "../../music-core/Core/Utilities/LinqLite";
import { ChordName } from "../../music-core/Core/MusicTheory/ChordName";

export class GuitarChord implements ICommandProcessor {


    public static readonly Instance = new GuitarChord();

    readonly name = "Guitar Chord";

    process(scanner: Scanner): REPLResult {
        const readChordNameResult = LiteralParsers.readChordName(scanner);
        if (ParseHelper.isFailed(readChordNameResult)) {
            return this.showChordSyntax();
        }

        if (ParseHelper.isEmpty(readChordNameResult)) {
            return this.showCommandSyntax();
        }

        const parser = new ChordParser();
        const chordName = readChordNameResult.value.value;
        const parseChordResult = parser.parse(chordName);

        if (ParseHelper.isFailed(parseChordResult)) {
            return REPLResult.text(`Failed to parse chord '${chordName}': \n ${parseChordResult.messages}`);
        }

        const chord = parseChordResult.value;

        return REPLResult.text(ChordName.getOrdinalNamePlain(chord) + "\n" + JSON.stringify(L(chord.getNotes()).select(n => n.toString()).toArray()));
    }

    private showChordSyntax(): REPLResult {
        return REPLResult.text("chord syntax here");
    }

    private showCommandSyntax(): REPLResult {
        return REPLResult.text("command syntax here");
    }

}