import { ChordDetail } from "../../music-core/Core/MusicTheory/String/ChordDetail";
import * as Canvas from "canvas-prebuilt";
import { minMax, L, contains } from "../../music-core/Core/Utilities/LinqLite";
import { CanvasColors } from "../drawing/CanvasColors";
import { CanvasFonts } from "../drawing/fonts/CanvasFonts";
import { Unicode } from "../../music-core/Core/Utilities/Unicode";
import { Accidental } from "../../music-core/Core/MusicTheory/Accidental";
import { BaseNoteName } from "../../music-core/Core/MusicTheory/BaseNoteName";
import { StringBuilder } from "../../music-core/Core/Utilities/StringBuilder";
import { DrawingHelper } from "../../eisle-core/drawing/DrawingHelper";

const margin = 12;
const cellWidth = 22;
const cellHeight = 28;
const fretZeroLineWidth = 4;
const borderLineWidth = 2;
const gridLineWidth = 1;
const fingerCircleRadius = 9;
const fingerCircleLineWidth = 2;
const centerTextOffsetX = 0;
const centerTextOffsetY = 1;

const fingerFont = `${15}px 'Music'`;

const fretsRowHeight = 12;
const fretsRowMargin = 4;
const fretsRowFont = `bold ${12}px 'Music'`;

const fretOffsetMargin = 12;
const fretOffsetWidth = 24;
const fretOffsetFont = `italic ${15}px 'Music'`;

const noteRowHeight = 12;
const noteRowMargin = 1;
const noteRowFont = `${12}px 'Music'`;

const gridLeftMargin = margin;
const gridTopMargin = margin + fretsRowHeight + fretsRowMargin;

class Renderer {

    private canvas: Canvas;
    private context: Canvas.Context2d;
    private readonly chordDetail: ChordDetail;
    private readonly fretRange: { min: number, max: number };
    private x: number;
    private y: number;
    private scale: number;

    constructor(chordDetail: ChordDetail) {
        this.chordDetail = chordDetail;
        this.fretRange = this.decideFretRange();
    }

    measure(scale: number): { width: number, height: number } {
        this.scale = scale;
        const width = gridLeftMargin * this.scale + this.gridWidth + margin * this.scale
            + (this.fretRange.min !== 1 ? fretOffsetMargin + fretOffsetWidth : 0) * this.scale;

        const height = gridTopMargin * this.scale
            + this.gridHeight
            + noteRowMargin * this.scale + noteRowHeight * this.scale
            + margin * this.scale;

        return { width: width, height: height };
    }

    private get gridWidth(): number {
        return cellWidth * (this.chordDetail.frets.length - 1) * this.scale;
    }

    private get gridHeight(): number {
        return cellHeight * (this.fretRange.max - this.fretRange.min + 1) * this.scale;
    }

    private decideFretRange(): { min: number, max: number } {
        const fretRange = L(this.chordDetail.frets).where(f => !isNaN(f) && f > 0).minMax();
        if (fretRange.max <= 5) {
            return { min: 1, max: Math.max(fretRange.max, 4) };
        }

        return { min: fretRange.min, max: fretRange.min + Math.max(fretRange.max - fretRange.min, 3) };
    }

    private drawGrid() {

        this.context.lineWidth = borderLineWidth * this.scale;
        this.context.strokeStyle = CanvasColors.Black;
        this.context.strokeRect(
            this.x + gridLeftMargin * this.scale,
            this.y + gridTopMargin * this.scale,
            this.gridWidth,
            this.gridHeight);

        this.context.lineWidth = gridLineWidth;
        for (let i = 1; i < this.chordDetail.frets.length - 1; ++i) {
            this.context.beginPath();
            const x = gridLeftMargin * this.scale + i * cellWidth * this.scale;
            this.context.lineTo(this.x + x, this.y + gridTopMargin * this.scale);
            this.context.lineTo(this.x + x, this.y + gridTopMargin * this.scale + this.gridHeight);
            this.context.stroke();
        }

        for (let i = 1; i < this.fretRange.max - this.fretRange.min + 1; ++i) {
            this.context.beginPath();
            const y = gridTopMargin * this.scale + i * cellHeight * this.scale;
            this.context.lineTo(this.x + gridLeftMargin * this.scale, this.y + y);
            this.context.lineTo(this.x + gridLeftMargin * this.scale + this.gridWidth, this.y + y);
            this.context.stroke();
        }
    }

    private drawFingering() {

        this.context.lineWidth = fingerCircleLineWidth;
        this.context.font = DrawingHelper.scaleFont(fingerFont, this.scale);
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        const radius = fingerCircleRadius * this.scale;

        for (let i = 0; i < this.chordDetail.fingering.length; ++i) {
            const finger = this.chordDetail.fingering[i];
            if (isNaN(finger.fret)) {
                continue;
            }
            const relativeFret = finger.fret - this.fretRange.min;
            const y = this.y + (gridTopMargin + cellHeight * (relativeFret + 0.5)) * this.scale;
            const fromX = this.x + (gridLeftMargin + finger.from * cellWidth) * this.scale;
            const toX = this.x + (gridLeftMargin + finger.to * cellWidth) * this.scale;
            if (finger.to === finger.from) {
                this.context.beginPath();
                this.context.arc(fromX, y, radius, 0, Math.PI * 2);
            } else {
                this.context.beginPath();
                this.context.beginPath();
                this.context.lineTo(fromX, y - radius);
                this.context.lineTo(toX - radius, y - radius);
                this.context.arc(toX, y, radius, -Math.PI / 2, Math.PI / 2);
                this.context.lineTo(fromX + radius, y + radius);
                this.context.arc(fromX, y, radius, Math.PI / 2, -Math.PI / 2);
            }
            this.context.stroke();
            this.context.fillStyle = CanvasColors.White;
            this.context.fill();

            this.context.fillStyle = CanvasColors.Black;
            this.context.fillText(i === 0 ? "T" : i.toString(),
                (toX + fromX) / 2 + centerTextOffsetX, y + centerTextOffsetY);
        }
    }

    private drawFretOffset() {
        if (this.fretRange.min <= 1) {
            return;
        }
        const x = this.x
            + gridLeftMargin * this.scale
            + this.gridWidth
            + fretOffsetMargin * this.scale
            + centerTextOffsetX * this.scale;
        const y = this.y
            + gridTopMargin * this.scale
            + cellHeight * 0.5 * this.scale
            + centerTextOffsetY * this.scale;

        this.context.font = DrawingHelper.scaleFont(fretOffsetFont, this.scale);
        this.context.textAlign = "left";
        this.context.textBaseline = "middle";
        this.context.fillStyle = CanvasColors.Black;
        this.context.fillText(`${this.fretRange.min} fr`, x, y);
    }

    private drawFretRow() {
        this.context.font = DrawingHelper.scaleFont(fretsRowFont, this.scale);
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = CanvasColors.Black;

        const y = this.y + margin * this.scale + fretsRowHeight * this.scale / 2 + centerTextOffsetY * this.scale;

        for (let i = 0; i < this.chordDetail.frets.length; ++i) {
            const fret = this.chordDetail.frets[i];
            const text = isNaN(fret) ? "×" : fret.toString();
            const x = this.x + gridLeftMargin * this.scale + cellWidth * this.scale * i + centerTextOffsetX * this.scale;
            this.context.fillText(text, x, y);
        }
    }

    private drawNoteRow() {

        this.context.textAlign = "center";
        this.context.textBaseline = "alphabetic";
        this.context.fillStyle = CanvasColors.Black;
        this.context.font = DrawingHelper.scaleFont(noteRowFont, this.scale);

        const y = this.y
            + gridTopMargin * this.scale
            + this.gridHeight
            + noteRowMargin * this.scale
            + noteRowHeight * this.scale
            + centerTextOffsetY * this.scale;

        for (let i = 0; i < this.chordDetail.frets.length; ++i) {
            const note = this.chordDetail.notes[i];

            if (note === undefined) {
                continue;
            }

            const x = this.x + gridLeftMargin * this.scale + cellWidth * i * this.scale + centerTextOffsetX * this.scale;

            this.context.fillText(note.toString(), x, y);
        }
    }

    render(canvas: Canvas, x: number, y: number, scale: number) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.x = x;
        this.y = y;
        this.scale = scale;

        this.drawFretRow();
        this.drawGrid();
        this.drawFretOffset();
        this.drawFingering();
        this.drawNoteRow();
    }
}

export namespace ChordDiagramRenderer {

    export function createCanvas(width: number, height: number): Canvas {
        const canvas = new Canvas(width, height);
        const context = canvas.getContext("2d");
        context.addFont(CanvasFonts.music);
        context.fillStyle = CanvasColors.White;
        context.fillRect(0, 0, width, height);
        return canvas;
    }

    export function draw(chordFretting: ChordDetail, canvas: Canvas, x: number, y: number, scale: number) {
        new Renderer(chordFretting).render(canvas, x, y, scale);
    }
}