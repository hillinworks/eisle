import { StringBuilder } from "../../music-core/Core/Utilities/StringBuilder";
import { TextRange } from "../../music-core/Core/Parsing/TextRange";
import { LogLevel } from "../../music-core/Core/Logging/LogLevel";
import { TuningInfo, Tunings } from "./Tunings";
import { Server } from "../../server";
import { Chord } from "../../music-core/Core/MusicTheory/Chord";
import { LogMessage } from "../../music-core/Core/Logging/LogMessage";
import { ChordParser } from "../../music-core/Parsing/ChordParser";
import { REPLTextResult } from "../../repl/REPLResult";
import { ParseHelper } from "../../music-core/Parsing/ParseResult";
import { Scanner } from "../../music-core/Parsing/Scanner";
import { LiteralParsers } from "../../music-core/Parsing/LiteralParsers";
import { ChordName } from "../../music-core/Core/MusicTheory/ChordName";
import { ChordUtilities } from "./ChordUtilities";
import * as path from "path";
import * as fs from "fs";
import { Cache } from "../cache/Cache";
import { ChordCanvas } from "./ChordCanvas";
import { ChordDetail } from "../../music-core/Core/MusicTheory/String/ChordDetail";
import { ChordNameRenderer } from "./elements/ChordNameRenderer";
import { ChordStaffRenderer } from "./elements/ChordStaffRenderer";
import { L } from "../../music-core/Core/Utilities/LinqLite";
import { GuitarTunings } from "../../music-core/Core/MusicTheory/String/Plucked/GuitarTunings";
import { ChordDiagramRenderer } from "./elements/ChordDiagramRenderer";
import { ChordScaleRenderer } from "../../eisle-core/chord/elements/ChordScaleRenderer";

export interface IChordDiagramCollection {
    url: string;
    omits: string;
}

export class ChordIntroModel {
    readonly hasError: false;
    messages: LogMessage[];
    input: string;
    tuning: {
        name: string,
        pitches: string
    };
    plainName: string;
    nameImageUrl: string;
    staffImageUrl: string;
    scaleImageUrl: string;
    diagrams: IChordDiagramCollection[];
}

export class ChordSyntaxError {
    readonly hasError: true;
    readonly input: string;
    readonly messages: LogMessage[];

    constructor(input: string, messages: LogMessage[]) {
        this.input = input;
        this.messages = messages;
    }
}

const chordNameCacheVersion = 0;
const chordStaffCacheVersion = 0;
const chordScaleCacheVersion = 0;
const chordDiagramCacheVersion = 0;

class ChordIntroCreator {

    private readonly input: string;
    private readonly tuningInfo: TuningInfo;
    private readonly chord: Chord;

    private model: ChordIntroModel;

    constructor(input: string, tuningInfo: TuningInfo, chord: Chord) {
        this.input = input;
        this.tuningInfo = tuningInfo;
        this.chord = chord;
    }

    getNameImagePath(): string {
        const fileName = ChordUtilities.normalizeChordFileName(this.model.plainName) + ".svg";
        const savePath = path.join(Cache.getCacheFolder(`chord/name/${chordNameCacheVersion}`), fileName);

        if (!fs.existsSync(savePath)) {
            const canvas = ChordCanvas.createCanvas(256, 64, "svg");
            ChordNameRenderer.draw(ChordName.getOrdinalName(this.chord), undefined, canvas, 0, 12, 2);
            fs.writeFileSync(savePath, canvas.toBuffer());
        }

        return Cache.getUrlPath(savePath, true);
    }

    getStaffImagePath(): string {
        const fileName = ChordUtilities.normalizeChordFileName(this.model.plainName) + ".svg";
        const savePath = path.join(Cache.getCacheFolder(`chord/staff/${chordStaffCacheVersion}`), fileName);

        if (!fs.existsSync(savePath)) {
            const canvas = ChordCanvas.createCanvas(96, 96, "svg");
            ChordStaffRenderer.draw(this.chord, canvas, 12, 12, 1);
            fs.writeFileSync(savePath, canvas.toBuffer());
        }

        return Cache.getUrlPath(savePath, true);
    }

    getScaleImageUrl(): string {
        const fileName = `${ChordUtilities.normalizeChordFileName(this.model.plainName)}-${this.tuningInfo.key}.svg`;
        const savePath = path.join(Cache.getCacheFolder(`chord/scale/${chordScaleCacheVersion}`), fileName);

        if (!fs.existsSync(savePath)) {
            const canvas = ChordCanvas.createCanvas(160, 580, "svg");
            ChordScaleRenderer.draw(this.chord, this.tuningInfo.tuning, canvas, 12, 12, 1);
            fs.writeFileSync(savePath, canvas.toBuffer());
        }

        return Cache.getUrlPath(savePath, true);
    }

    getDiagramUrls(): IChordDiagramCollection[] {
        const details = ChordDetail.getChordDetail(this.chord, this.tuningInfo.tuning);
        const result: IChordDiagramCollection[] = [];
        for (const detail of L(details).take(6)) {
            const fileName = `${ChordUtilities.normalizeNoteFileName(this.chord.root.toString())}-${this.tuningInfo.key}-${L(detail.frets).select(f => isNaN(f) ? "x" : f.toString()).toArray().join("-")}.svg`;

            const savePath = path.join(Cache.getCacheFolder(`chord/diagrams/${chordDiagramCacheVersion}`), fileName);

            if (!fs.existsSync(savePath)) {
                const canvas = ChordCanvas.createCanvas(168, 168, "svg");
                ChordDiagramRenderer.draw(detail, canvas, 0, 0, 1);
                fs.writeFileSync(savePath, canvas.toBuffer());
            }

            result.push({
                url: Cache.getUrlPath(savePath, true),
                omits: ChordName.getOmits(this.chord, detail.omits)
            });
        }

        return result;
    }

    private getTuningDescriptor() {
        const builder = new StringBuilder();

        for (let i = 0; i < this.tuningInfo.tuning.stringTunings.length; ++i) {
            const pitch = this.tuningInfo.tuning.stringTunings[i];
            if (i > 0) {
                builder.append(" ");
            }
            builder.append(pitch.noteName.toString())
                .append("<sub>")
                .append(pitch.octaveGroup.toString())
                .append("</sub>");
        }

        return { name: this.tuningInfo.fullName, pitches: builder.toString() };
    }

    create(): ChordIntroModel {
        this.model = new ChordIntroModel();
        this.model.plainName = ChordName.getOrdinalNamePlain(this.chord);
        this.model.input = this.input.toUpperCase() === this.model.plainName.toUpperCase() ? undefined : this.input;
        this.model.tuning = this.getTuningDescriptor();
        this.model.nameImageUrl = this.getNameImagePath();
        this.model.staffImageUrl = this.getStaffImagePath();
        this.model.scaleImageUrl = this.getScaleImageUrl();
        this.model.diagrams = this.getDiagramUrls();

        return this.model;
    }
}

export namespace ChordIntroPage {

    export function create(input: string, tuningInput: string): ChordIntroModel | ChordSyntaxError {
        const scanner = new Scanner(input);
        const readChordNameResult = LiteralParsers.readChordName(scanner);
        if (!ParseHelper.isSuccessful(readChordNameResult)) {
            return new ChordSyntaxError(input, readChordNameResult.messages);
        }

        const parser = new ChordParser();
        const chordName = readChordNameResult.value.value;
        const parseChordResult = parser.parse(chordName);

        if (ParseHelper.isFailed(parseChordResult)) {
            return new ChordSyntaxError(input, parseChordResult.messages);
        }

        const chord = parseChordResult.value;

        const messages = [...parseChordResult.messages];

        let tuning = Tunings.defaultTuning;
        if (tuningInput) {
            tuning = Tunings.getTuning(tuningInput);
            if (!tuning) {
                messages.push(new LogMessage(LogLevel.Warning, undefined, "无法识别指定的调弦方式，已改用吉他默认调弦"));
                tuning = Tunings.defaultTuning;
            }
        }

        const model = new ChordIntroCreator(input, tuning, chord).create();
        model.messages = messages.length > 0 ? messages : undefined;

        return model;
    }
}