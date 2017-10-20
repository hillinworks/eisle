import { ICommandProcessor } from "../ICommandProcessor";
import { REPLResult } from "../REPLResult";
import { Scanner } from "../../music-core/Parsing/Scanner";
import { ChordParser } from "../../music-core/Parsing/ChordParser";
import { LiteralParsers } from "../../music-core/Parsing/LiteralParsers";
import { ParseHelper } from "../../music-core/Parsing/ParseResult";
import { REPL } from "../repl";
import { select, L, join, contains } from "../../music-core/Core/Utilities/LinqLite";
import { ChordName } from "../../music-core/Core/MusicTheory/ChordName";
import { StringBuilder } from "../../music-core/Core/Utilities/StringBuilder";
import { ChordFingering } from "../../music-core/Core/MusicTheory/String/ChordFingering";
import { Tuning } from "../../music-core/Core/MusicTheory/String/Tuning";
import { GuitarTunings } from "../../music-core/Core/MusicTheory/String/Plucked/GuitarTunings";

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

        const resultBuilder = new StringBuilder();
        resultBuilder.appendLine(ChordName.getOrdinalNamePlain(chord));
        resultBuilder.appendLine(JSON.stringify(L(chord.getNotes()).select(n => n.toString()).toArray()));
        if (parseChordResult.messages.length > 0) {
            resultBuilder.appendLine(parseChordResult.messages);
        }

        const fingerings = ChordFingering.getChordFingerings(chord, GuitarTunings.standard);
        for (const fingering of fingerings) {

            resultBuilder.append("<").append(fingering.difficulty).append("> ");

            for (const fret of fingering.fingerings) {
                if (isNaN(fret)) {
                    resultBuilder.append("x ");
                } else {
                    resultBuilder.append(fret.toString()).append(" ");
                }
            }

            resultBuilder.append(" [");
            let isFirst = true;
            for (let i = 0; i < fingering.fretting.length; ++i) {
                const fretting = fingering.fretting[i];
                if (isNaN(fretting.fret)) {
                    continue;
                }

                if (!isFirst) {
                    resultBuilder.append(", ");
                }

                isFirst = false;

                resultBuilder.append(i.toString());
                resultBuilder.append(":");
                resultBuilder.append((fretting.from + 1).toString());
                if (fretting.from !== fretting.to) {
                    resultBuilder.append("-").append((fretting.to + 1).toString());
                }
            }

            resultBuilder.append("]");

            if (fingering.omittedIntervals.length > 0) {
                resultBuilder.append(" (omitted: ")
                    .append(L(fingering.omittedIntervals).select(i => i.toString()).toArray().join(", "))
                    .append(")");
            }

            resultBuilder.appendLine();
        }

        return REPLResult.text(resultBuilder.toString());
    }

    private showChordSyntax(): REPLResult {
        return REPLResult.text("chord syntax here");
    }

    private showCommandSyntax(): REPLResult {
        return REPLResult.text("command syntax here");
    }

}