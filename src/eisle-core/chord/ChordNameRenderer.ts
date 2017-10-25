import { IChordOrdinalName } from "../../music-core/Core/MusicTheory/ChordName";
import * as Canvas from "canvas-prebuilt";
import { DrawingHelper } from "../../eisle-core/drawing/DrawingHelper";
import { CanvasColors } from "../../eisle-core/drawing/CanvasColors";

const baseNameFont = `${25}px 'Music'`;
const superscriptOffset = -1;
const superscriptFont = `${12}px 'Music'`;
const subscriptFont = `${12}px 'Music'`;
const subscriptOffset = 12;

class Renderer {

    private readonly chordName: IChordOrdinalName;
    private context: Canvas.Context2d;

    constructor(chordName: IChordOrdinalName) {
        this.chordName = chordName;
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
            superscript += "/" + this.chordName.bass;
        }

        this.context.font = DrawingHelper.scaleFont(superscriptFont, scale);
        this.context.fillText(superscript, x + baseNameMeasurement.width, y + superscriptOffset * scale);

        this.context.font = DrawingHelper.scaleFont(subscriptFont, scale);
        this.context.fillText(this.chordName.subscript, x + baseNameMeasurement.width, y + subscriptOffset * scale);
    }
}

export namespace ChordNameRenderer {
    export function draw(name: IChordOrdinalName, canvas: Canvas, x: number, y: number, scale: number) {
        new Renderer(name).render(canvas, x, y, scale);
    }
}