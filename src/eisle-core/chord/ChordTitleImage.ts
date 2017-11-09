import { InstrumentInfo } from "./InstrumentTunings";
import { Chord } from "../../music-core/Core/MusicTheory/Chord";
import { ChordName } from "../../music-core/Core/MusicTheory/ChordName";
import { Cache } from "../../eisle-core/cache/Cache";
import * as path from "path";
import * as fs from "fs";
import { ChordCanvas } from "../../eisle-core/chord/ChordCanvas";
import { ChordDetail } from "../../music-core/Core/MusicTheory/String/ChordDetail";
import * as Canvas from "canvas-prebuilt";
import { ChordNameRenderer } from "../../eisle-core/chord/elements/ChordNameRenderer";
import { ChordStaffRenderer } from "../../eisle-core/chord/elements/ChordStaffRenderer";
import { ChordDiagramRenderer } from "../../eisle-core/chord/elements/ChordDiagramRenderer";
import { ChordUtilities } from "../../eisle-core/chord/ChordUtilities";

export namespace ChordTitleImage {

    export const titleImageVersion = 1;

    function drawTitlePicture(canvas: Canvas, chord: Chord, instrumentInfo: InstrumentInfo, details: ReadonlyArray<ChordDetail>) {
        const chordName = ChordName.getOrdinalName(chord);

        ChordNameRenderer.draw(chordName, ChordName.getOmitsEnglish(chord, details[0] ? details[0].omits : []), canvas, 16, 24, 1.5);

        ChordStaffRenderer.draw(chord, canvas, 16, 64, 1.5);

        if (details.length === 0) {
            const context = canvas.getContext("2d");
            const unknownChordImage = new Canvas.Image();
            unknownChordImage.src = fs.readFileSync("./public/images/unknown-chord.png");
            context.drawImage(unknownChordImage, 160, 0);
        } else {
            ChordDiagramRenderer.draw(details[0], instrumentInfo, canvas, 160, 0, 1.2);
        }
    }

    export function getTitleImagePath(chord: Chord, instrumentInfo: InstrumentInfo): string {
        const plainName = ChordName.getOrdinalNamePlain(chord);
        const fileName = `${ChordUtilities.normalizeChordFileName(plainName)}-${instrumentInfo.key}.png`;
        const savePath = path.join(Cache.getCacheFolder(`chord/title-image/${titleImageVersion}`), fileName);

        if (!fs.existsSync(savePath)) {
            const canvas = ChordCanvas.createCanvas(360, 200);
            const details = ChordDetail.getChordDetail(chord, instrumentInfo);
            drawTitlePicture(canvas, chord, instrumentInfo, details);
            fs.writeFileSync(savePath, canvas.toBuffer());
        }

        return Cache.getUrlPath(savePath, true);
    }

}