import { InstrumentInfo } from "../InstrumentTunings";
import { ChordDetail } from "../../../music-core/Core/MusicTheory/String/ChordDetail";
import * as Canvas from "canvas-prebuilt";
import { minMax, L, contains } from "../../../music-core/Core/Utilities/LinqLite";
import { CanvasColors } from "../../drawing/CanvasColors";
import { CanvasFonts } from "../../drawing/fonts/CanvasFonts";
import { Unicode } from "../../../music-core/Core/Utilities/Unicode";
import { Accidental } from "../../../music-core/Core/MusicTheory/Accidental";
import { BaseNoteName } from "../../../music-core/Core/MusicTheory/BaseNoteName";
import { StringBuilder } from "../../../music-core/Core/Utilities/StringBuilder";
import { DrawingHelper } from "../../../eisle-core/drawing/DrawingHelper";
import { ChordCanvas } from "../ChordCanvas";

const margin = 12;
const cellWidth = 22;
const cellHeight = 28;
const borderLineWidth = 2;
const gridLineWidth = 1;
const fingerCircleRadius = 9;
const fingerCircleLineWidth = 2;
const centerTextOffsetX = 0;
const centerTextOffsetY = 1;

const fingerFont = `${15}px 'Text'`;

const fretsRowHeight = 12;
const fretsRowMargin = 4;
const fretsRowFont = `bold ${12}px 'Text'`;

const fretOffsetMargin = 12;
const fretOffsetWidth = 24;
const fretOffsetFont = `italic ${15}px 'Text'`;

const noteRowHeight = 12;
const noteRowMargin = 1;
const noteRowFont = `${12}px 'Text'`;

const nutSpacing = 4;
const nutLineWidth = 2;

const gridLeftMargin = margin;
const gridTopMargin = margin + fretsRowHeight + fretsRowMargin;

class Renderer {

    private canvas: Canvas;
    private context: Canvas.Context2d;
    private readonly chordDetail: ChordDetail;
    private readonly instrumentInfo: InstrumentInfo;
    private readonly fretRange: { min: number, max: number };
    private x: number;
    private y: number;
    private scale: number;
    private symmetric: boolean;
    private gridVerticalScale: number;

    private gridLeft: number;
    private gridTop: number;

    constructor(chordDetail: ChordDetail, instrumentInfo: InstrumentInfo) {
        this.chordDetail = chordDetail;
        this.instrumentInfo = instrumentInfo;
        this.fretRange = this.decideFretRange();
        this.gridVerticalScale = 1 - Math.max(this.fretRange.max - this.fretRange.min - 2, 0) * 0.1;
    }

    measure(scale: number, symmetric: boolean): { width: number, height: number } {
        this.scale = scale;

        const symmetricFactor = symmetric ? 2 : 1;

        const width = gridLeftMargin * this.scale + this.gridWidth + margin * this.scale
            + (this.fretRange.min !== 1 ? fretOffsetMargin + fretOffsetWidth : 0) * this.scale * symmetricFactor;

        const height = gridTopMargin * this.scale
            + (this.fretRange.min === 1 ? nutSpacing : 0) * this.scale
            + this.gridHeight
            + noteRowMargin * this.scale + noteRowHeight * this.scale
            + margin * this.scale;

        return { width: width, height: height };
    }

    private get gridWidth(): number {
        return cellWidth * (this.chordDetail.frets.length - 1) * this.scale;
    }

    private get cellHeight(): number {
        return cellHeight * this.scale * this.gridVerticalScale;
    }

    private get gridHeight(): number {
        return this.cellHeight * (this.fretRange.max - this.fretRange.min + 1);
    }

    private decideFretRange(): { min: number, max: number } {
        const fretWidth = this.instrumentInfo.chordResolvingOptions.maxChordFretWidth;
        const fretRange = L(this.chordDetail.frets).where(f => !isNaN(f) && f > 0).minMax();
        if (fretRange.max <= fretWidth) {
            return { min: 1, max: Math.max(fretRange.max, fretWidth) };
        }

        return { min: fretRange.min, max: fretRange.min + Math.max(fretRange.max - fretRange.min, fretWidth - 1) };
    }

    private initializeCoordinates() {
        this.gridLeft = this.x + gridLeftMargin * this.scale

        if (this.symmetric) {
            this.gridLeft += (this.fretRange.min !== 1 ? fretOffsetMargin + fretOffsetWidth : 0) * this.scale;
        }

        this.gridTop = this.y + gridTopMargin * this.scale;
    }

    private drawGrid() {

        if (this.fretRange.min === 1) {
            this.context.lineWidth = nutLineWidth * this.scale;
            this.context.strokeStyle = CanvasColors.black;
            this.context.beginPath();
            this.context.lineTo(this.gridLeft - borderLineWidth * this.scale / 2, this.gridTop);
            this.context.lineTo(this.gridLeft + this.gridWidth + borderLineWidth * this.scale / 2, this.gridTop);
            this.context.stroke();

            this.gridTop += nutSpacing * this.scale;
        }

        this.context.lineWidth = borderLineWidth * this.scale;
        this.context.strokeStyle = CanvasColors.black;
        this.context.strokeRect(
            this.gridLeft,
            this.gridTop,
            this.gridWidth,
            this.gridHeight);

        this.context.lineWidth = gridLineWidth;
        for (let i = 1; i < this.chordDetail.frets.length - 1; ++i) {
            this.context.beginPath();
            const x = this.gridLeft + i * cellWidth * this.scale;
            this.context.lineTo(this.x + x, this.gridTop);
            this.context.lineTo(this.x + x, this.gridTop + this.gridHeight);
            this.context.stroke();
        }

        for (let i = 1; i < this.fretRange.max - this.fretRange.min + 1; ++i) {
            this.context.beginPath();
            const y = this.gridTop + i * this.cellHeight;
            this.context.lineTo(this.gridLeft, this.y + y);
            this.context.lineTo(this.gridLeft + this.gridWidth, this.y + y);
            this.context.stroke();
        }
    }

    private drawFingering() {

        this.context.lineWidth = fingerCircleLineWidth;
        this.context.font = DrawingHelper.scaleFont(fingerFont, this.scale * this.gridVerticalScale);
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        const radius = fingerCircleRadius * this.scale * this.gridVerticalScale;

        for (let i = 0; i < this.chordDetail.fingering.fingers.length; ++i) {
            const finger = this.chordDetail.fingering.fingers[i];
            if (isNaN(finger.fret)) {
                continue;
            }
            const relativeFret = finger.fret - this.fretRange.min;
            const y = this.gridTop + this.cellHeight * (relativeFret + 0.5);
            const fromX = this.gridLeft + (finger.from * cellWidth) * this.scale;
            const toX = this.gridLeft + (finger.to * cellWidth) * this.scale;
            if (finger.to === finger.from) {
                this.context.beginPath();
                this.context.arc(fromX, y, radius, 0, Math.PI * 2);
            } else {
                this.context.beginPath();
                this.context.lineTo(fromX, y - radius);
                this.context.lineTo(toX - radius, y - radius);
                this.context.arc(toX, y, radius, -Math.PI / 2, Math.PI / 2);
                this.context.lineTo(fromX + radius, y + radius);
                this.context.arc(fromX, y, radius, Math.PI / 2, -Math.PI / 2);
            }
            this.context.stroke();
            this.context.fillStyle = CanvasColors.white;
            this.context.fill();

            this.context.fillStyle = CanvasColors.black;

            // offset '1' by -1 because it's a bit offset in the font
            this.context.fillText(i === 0 ? "T" : i.toString(),
                (toX + fromX) / 2 + (centerTextOffsetX + i === 1 ? -1 : 0) * this.scale, y + centerTextOffsetY * this.scale);
        }
    }

    private drawFretOffset() {
        if (this.fretRange.min <= 1) {
            return;
        }
        const x = this.x
            + this.gridLeft
            + this.gridWidth
            + fretOffsetMargin * this.scale
            + centerTextOffsetX * this.scale;
        const y = this.gridTop
            + this.cellHeight * 0.5
            + centerTextOffsetY * this.scale;

        this.context.font = DrawingHelper.scaleFont(fretOffsetFont, this.scale);
        this.context.textAlign = "left";
        this.context.textBaseline = "middle";
        this.context.fillStyle = CanvasColors.black;
        this.context.fillText(`${this.fretRange.min} fr`, x, y);
    }

    private drawFretRow() {
        this.context.font = DrawingHelper.scaleFont(fretsRowFont, this.scale);
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = CanvasColors.black;

        const y = this.y + margin * this.scale + fretsRowHeight * this.scale / 2 + centerTextOffsetY * this.scale;

        for (let i = 0; i < this.chordDetail.frets.length; ++i) {
            const fret = this.chordDetail.frets[i];
            const text = isNaN(fret) ? "×" : fret.toString();
            const x = this.gridLeft + cellWidth * this.scale * i + centerTextOffsetX * this.scale;
            this.context.fillText(text, x, y);
        }
    }

    private drawNoteRow() {

        this.context.textAlign = "center";
        this.context.textBaseline = "alphabetic";
        this.context.fillStyle = CanvasColors.black;
        this.context.font = DrawingHelper.scaleFont(noteRowFont, this.scale);

        const y = this.gridTop
            + this.gridHeight
            + noteRowMargin * this.scale
            + noteRowHeight * this.scale
            + centerTextOffsetY * this.scale;

        for (let i = 0; i < this.chordDetail.frets.length; ++i) {
            const note = this.chordDetail.notes[i];

            if (note === undefined) {
                continue;
            }

            const x = this.gridLeft + cellWidth * i * this.scale + centerTextOffsetX * this.scale;

            this.context.fillText(note.toString(), x, y);
        }
    }

    render(canvas: Canvas, x: number, y: number, scale: number, symmetric: boolean) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.symmetric = symmetric;
        
        this.initializeCoordinates();
        this.drawFretRow();
        this.drawGrid();
        this.drawFretOffset();
        this.drawFingering();
        this.drawNoteRow();
    }
}

export namespace ChordDiagramRenderer {
    export function draw(detail: ChordDetail, instrumentInfo: InstrumentInfo, canvas: Canvas, x: number, y: number, scale: number) {
        new Renderer(detail, instrumentInfo).render(canvas, x, y, scale, false);
    }

    export function drawFitted(detail: ChordDetail, instrumentInfo: InstrumentInfo, scale: number, symmetric: boolean): Canvas {
        const renderer = new Renderer(detail, instrumentInfo);
        const size = renderer.measure(scale, symmetric);
        const canvas = ChordCanvas.createCanvas(size.width, size.height, "svg");
        renderer.render(canvas, 0, 0, scale, symmetric);
        return canvas;
    }
}