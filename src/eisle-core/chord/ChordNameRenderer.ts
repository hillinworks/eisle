import { IChordOrdinalName } from "../../music-core/Core/MusicTheory/ChordName";
import * as Canvas from "canvas-prebuilt";
import { DrawingHelper } from "../../eisle-core/drawing/DrawingHelper";
import { CanvasColors } from "../../eisle-core/drawing/CanvasColors";
import { OmittedInterval } from "../../music-core/Core/MusicTheory/String/ChordDetail";
import { select } from "../../music-core/Core/Utilities/LinqLite";

const baseNameFont = `${25}px 'Text'`;
const superscriptOffset = -1;
const superscriptFont = `${12}px 'Text'`;
const subscriptFont = `${12}px 'Text'`;
const subscriptOffset = 12;
const omitsFont = `italic ${10}px 'Text'`;
const omitsOffsetX = 2;
const omitsOffsetY = 4;

class Renderer {

    private readonly chordName: IChordOrdinalName;
    private readonly omits: string;
    private context: Canvas.Context2d;

    constructor(chordName: IChordOrdinalName, omittedIntervals: string) {
        this.chordName = chordName;
        this.omits = omittedIntervals;
    }

    render(canvas: Canvas, x: number, y: number, scale: number) {
        this.context = canvas.getContext("2d");

        this.context.textAlign = "left";
        this.context.textBaseline = "top";
        this.context.font = DrawingHelper.scaleFont(baseNameFont, scale);
        this.context.fillStyle = CanvasColors.Black;
        this.context.fillText(this.chordName.baseName, x, y);

        const baseNameMeasurement = this.context.measureText(this.chordName.baseName);

        let superscript = this.chordName.superscript;
        if (this.chordName.bass !== undefined) {
            superscript += " on " + this.chordName.bass;
        }

        this.context.font = DrawingHelper.scaleFont(superscriptFont, scale);
        this.context.fillText(superscript, x + baseNameMeasurement.width, y + superscriptOffset * scale);

        this.context.font = DrawingHelper.scaleFont(subscriptFont, scale);
        this.context.fillText(this.chordName.subscript, x + baseNameMeasurement.width, y + subscriptOffset * scale);

        if (this.omits) {
            this.context.font = DrawingHelper.scaleFont(omitsFont, scale);
            this.context.fillText(this.omits, x + omitsOffsetX * scale,
                y + baseNameMeasurement.actualBoundingBoxDescent - baseNameMeasurement.actualBoundingBoxAscent + omitsOffsetY * scale);
        }
    }
}

export namespace ChordNameRenderer {
    export function draw(name: IChordOrdinalName, omits: string, canvas: Canvas, x: number, y: number, scale: number) {
        new Renderer(name, omits).render(canvas, x, y, scale);
    }
}