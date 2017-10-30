import { ICommandProcessor } from "../ICommandProcessor";
import { Scanner } from "../../music-core/Parsing/Scanner";
import { ChordParser } from "../../music-core/Parsing/ChordParser";
import { LiteralParsers } from "../../music-core/Parsing/LiteralParsers";
import { ParseHelper, ParseResult, IParseSuccessResult } from "../../music-core/Parsing/ParseResult";
import { REPL } from "../repl";
import { select, L, join, contains } from "../../music-core/Core/Utilities/LinqLite";
import { ChordName } from "../../music-core/Core/MusicTheory/ChordName";
import { StringBuilder } from "../../music-core/Core/Utilities/StringBuilder";
import { ChordDetail } from "../../music-core/Core/MusicTheory/String/ChordDetail";
import { Tuning } from "../../music-core/Core/MusicTheory/String/Tuning";
import { GuitarTunings } from "../../music-core/Core/MusicTheory/String/Plucked/GuitarTunings";
import { ChordDiagramRenderer } from "../../eisle-core/chord/ChordDiagramRenderer";
import { Chord } from "../../music-core/Core/MusicTheory/Chord";
import * as Canvas from "canvas-prebuilt";
import { ChordNameRenderer } from "../../eisle-core/chord/ChordNameRenderer";
import * as fs from "fs";
import { IREPLResult, REPLTextResult, REPLArticlesResult } from "../REPLResult";
import { Cache } from "../../eisle-core/cache/Cache";
import * as path from "path";

export class GuitarChord implements ICommandProcessor {


    public static readonly Instance = new GuitarChord();

    readonly name = "Guitar Chord";

    private logResult(parseChordResult: IParseSuccessResult<Chord>, details: ChordDetail[]) {
        const chord = parseChordResult.value;

        const logBuilder = new StringBuilder();
        logBuilder.appendLine(ChordName.getOrdinalNamePlain(chord));
        logBuilder.appendLine(JSON.stringify(L(chord.getNotes()).select(n => n.toString()).toArray()));
        if (parseChordResult.messages.length > 0) {
            logBuilder.appendLine(parseChordResult.messages);
        }

        for (const detail of details) {

            logBuilder.append("<").append(detail.rating).append("> ");

            for (const fret of detail.frets) {
                if (isNaN(fret)) {
                    logBuilder.append("x ");
                } else {
                    logBuilder.append(fret.toString()).append(" ");
                }
            }

            logBuilder.append(" [");
            let isFirst = true;
            for (let i = 0; i < detail.fingering.length; ++i) {
                const fretting = detail.fingering[i];
                if (isNaN(fretting.fret)) {
                    continue;
                }

                if (!isFirst) {
                    logBuilder.append(", ");
                }

                isFirst = false;

                logBuilder.append(i.toString());
                logBuilder.append(":");
                logBuilder.append((fretting.from + 1).toString());
                if (fretting.from !== fretting.to) {
                    logBuilder.append("-").append((fretting.to + 1).toString());
                }
            }

            logBuilder.append("]");

            if (detail.omittedIntervals.length > 0) {
                logBuilder.append(" (omitted: ")
                    .append(L(detail.omittedIntervals).select(i => i.toString()).toArray().join(", "))
                    .append(")");
            }

            logBuilder.appendLine();
        }

        console.log(logBuilder.toString());
    }

    private normalizeChordGraphFileName(ordinalName: string): string {
        let name = ordinalName.replace(/\//g, "_")
            .replace(/♭/g, "-flat-")
            .replace(/[♯\#]/g, "-sharp-");
        if (name.endsWith("-")) {
            name = name.substr(0, name.length - 1);
        }
        return name + ".png";
    }

    process(scanner: Scanner): IREPLResult {
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
            return new REPLTextResult(`Failed to parse chord '${chordName}': \n ${parseChordResult.messages}`);
        }

        const chord = parseChordResult.value;
        const details = ChordDetail.getChordDetail(chord, GuitarTunings.standard);

        this.logResult(parseChordResult, details);

        const canvas = ChordDiagramRenderer.createCanvas(360, 200);
        this.drawTitlePicture(canvas, chord, details);

        const plainName = ChordName.getOrdinalNamePlain(chord);
        const fileName = this.normalizeChordGraphFileName(plainName);
        const savePath = path.join(Cache.getCacheFolder(), fileName);
        fs.writeFileSync(savePath, canvas.toBuffer());

        return new REPLArticlesResult({
            title: plainName,
            description: "",
            picUrl: `http://123.56.14.211/test/cache/${fileName}?${Date.now()})}`,
            url: ""
        });
    }

    private drawTitlePicture(canvas: Canvas, chord: Chord, details: ReadonlyArray<ChordDetail>) {
        const chordName = ChordName.getOrdinalName(chord);

        ChordNameRenderer.draw(chordName, canvas, 16, 32, 1.5);

        if (details.length === 0) {
            const context = canvas.getContext("2d");
            const unknownChordImage = new Canvas.Image();
            unknownChordImage.src = fs.readFileSync("./public/images/unknown-chord.png");
            context.drawImage(unknownChordImage, 160, 0);
        } else {
            ChordDiagramRenderer.draw(details[0], canvas, 160, 0, 1.2);
        }
    }

    private showChordSyntax(): IREPLResult {
        return new REPLTextResult("chord syntax here");
    }

    private showCommandSyntax(): IREPLResult {
        return new REPLTextResult("command syntax here");
    }

}