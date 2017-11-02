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

export interface IChordDiagramCollection {
    url: string;
    omits: string;
}

export class ChordIntroModel {
    readonly hasError: false;
    messages: LogMessage[];
    input: string;
    plainName: string;
    nameImageUrl: string;
    staffImageUrl: string;
    diagrams: IChordDiagramCollection[];
}

export class ChordSyntaxError {
    readonly hasError: true;
    readonly input: string;
    readonly messages: LogMessage[];

    constructor(input:string, messages: LogMessage[]) {
        this.input = input;
        this.messages = messages;
    }
}

const chordNameCacheVersion = 0;
const chordStaffCacheVersion = 0;
const chordDiagramCacheVersion = 0;

class ChordIntroCreator {

    private readonly input: string;
    private readonly chord: Chord;

    private model: ChordIntroModel;

    constructor(input: string, chord: Chord) {
        this.input = input;
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

    getDiagramUrls(): IChordDiagramCollection[] {
        const details = ChordDetail.getChordDetail(this.chord, GuitarTunings.standard);
        const result: IChordDiagramCollection[] = [];
        for (const detail of L(details).take(6)) {
            const key = ChordUtilities.normalizeNoteFileName(this.chord.root.toString()) + "-"
                + L(detail.frets).select(f => isNaN(f) ? "x" : f.toString()).toArray().join("-");

            const fileName = key + ".svg";
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

    create(): ChordIntroModel {
        this.model = new ChordIntroModel();
        this.model.plainName = ChordName.getOrdinalNamePlain(this.chord);
        this.model.input = this.input === this.model.plainName ? undefined : this.input;
        this.model.nameImageUrl = this.getNameImagePath();
        this.model.staffImageUrl = this.getStaffImagePath();
        this.model.diagrams = this.getDiagramUrls();

        return this.model;
    }
}

export namespace ChordIntroPage {

    export function create(input: string): ChordIntroModel | ChordSyntaxError {
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

        const model = new ChordIntroCreator(input, chord).create();
        model.messages = parseChordResult.messages.length > 0 ? parseChordResult.messages : undefined;

        return model;
    }
}