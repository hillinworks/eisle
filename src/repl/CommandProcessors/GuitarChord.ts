import { IUser } from "../../platforms/weixin/db/interfaces/IUser";
import { IUserSettings } from "../../platforms/weixin/db/interfaces/IUserSettings";
import { Server } from "../../server";
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
import { Chord } from "../../music-core/Core/MusicTheory/Chord";
import * as Canvas from "canvas-prebuilt";
import { IREPLResult, REPLTextResult, REPLArticlesResult } from "../REPLResult";
import { ChordTitleImage } from "../../eisle-core/chord/ChordTitleImage";
import { Instruments } from "../../eisle-core/chord/Instruments";
import { GuitarTunings } from "../../music-core/Core/MusicTheory/String/Plucked/GuitarTunings";

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
            for (let i = 0; i < detail.fingering.fingers.length; ++i) {
                const fretting = detail.fingering.fingers[i];
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

            if (detail.omits.length > 0) {
                logBuilder.append(" (omitted: ")
                    .append(L(detail.omits).select(i => i.interval.toString()).toArray().join(", "))
                    .append(")");
            }

            logBuilder.appendLine();
        }

        console.log(logBuilder.toString());
    }

    async process(scanner: Scanner, user: IUser, userSettings: IUserSettings): Promise<IREPLResult> {
        const readChordNameResult = LiteralParsers.readChordName(scanner);
        if (ParseHelper.isFailed(readChordNameResult)) {
            return this.showChordSyntax();
        }

        if (ParseHelper.isEmpty(readChordNameResult)) {
            return this.showChordSyntax();
        }

        const parser = new ChordParser();
        const chordName = readChordNameResult.value.value;
        const parseChordResult = parser.parse(chordName);

        if (ParseHelper.isFailed(parseChordResult)) {
            const result = this.showChordSyntax();
            result.articles.push({
                title: "问题出在哪里？",
                picUrl: `${Server.host}/images/unknown-chord.png`,
                url: `${Server.host}/chord/${encodeURIComponent(chordName)}?epoch=${Date.now()}`,
            });
            return result;
        }

        const chord = parseChordResult.value;
        let instrumentInfo = userSettings.instrument ? Instruments.getInstrumentInfo(userSettings.instrument) : Instruments.defaultInstrument;
        if (!instrumentInfo) {
            console.warn(`unknown user instrument '${userSettings.instrument}', fall back to default instrument`);
            instrumentInfo = Instruments.defaultInstrument;
        }
        const titleImagePath = ChordTitleImage.getTitleImagePath(chord, instrumentInfo);

        const details = ChordDetail.getChordDetail(chord, instrumentInfo);
        this.logResult(parseChordResult, details);

        return new REPLArticlesResult({
            title: ChordName.getOrdinalNamePlain(chord),
            description: `${instrumentInfo.fullName} - 点击查看详情`,
            picUrl: `${titleImagePath}?${Date.now()})}`,
            url: `${Server.host}/chord/${encodeURIComponent(chordName)}?instrument=${encodeURIComponent(instrumentInfo.key)}&epoch=${Date.now()}&from=wxchat`,
        });
    }

    private showChordSyntax(): REPLArticlesResult {
        return new REPLArticlesResult({
            title: "这个和弦我不认识！看看 Echo Isles 能识别怎样的和弦吧~",
            description: "Echo Isles 和弦语法",
            picUrl: `${Server.host}/images/unknown-chord-title.png`,
            url: `${Server.host}/chord/syntax`,
        });
    }


}