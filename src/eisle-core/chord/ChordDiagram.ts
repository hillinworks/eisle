import { ChordDetail } from "../../music-core/Core/MusicTheory/String/ChordDetail";
import * as Canvas from "canvas-prebuilt";
import { minMax, L, contains } from "../../music-core/Core/Utilities/LinqLite";
import { CanvasColors } from "../drawing/CanvasColors";
import { CanvasFonts } from "../drawing/fonts/CanvasFonts";
import { Unicode } from "../../music-core/Core/Utilities/Unicode";
import { Accidental } from "../../music-core/Core/MusicTheory/Accidental";
import { BaseNoteName } from "../../music-core/Core/MusicTheory/BaseNoteName";

const sizeMultiplier = 2;
const margin = 12 * sizeMultiplier;
const cellWidth = 22 * sizeMultiplier;
const cellHeight = 28 * sizeMultiplier;
const fretZeroLineWidth = 4 * sizeMultiplier;
const borderLineWidth = 2 * sizeMultiplier;
const gridLineWidth = 1 * sizeMultiplier;
const fingerCircleRadius = 9 * sizeMultiplier;
const fingerCircleLineWidth = 2 * sizeMultiplier;
const centerTextOffsetX = 0 * sizeMultiplier;
const centerTextOffsetY = 1 * sizeMultiplier;

const fingerFont = `${15 * sizeMultiplier}px 'Minion Pro'`;

const fretsRowHeight = 12 * sizeMultiplier;
const fretsRowMargin = 4 * sizeMultiplier;
const fretsRowFont = `bold ${12 * sizeMultiplier}px 'Minion Pro'`;

const fretOffsetMargin = 12 * sizeMultiplier;
const fretOffsetWidth = 24 * sizeMultiplier;
const fretOffsetFont = `italic ${15 * sizeMultiplier}px 'Minion Pro'`;

const noteRowHeight = 12 * sizeMultiplier;
const noteRowMargin = 4 * sizeMultiplier;
const noteRowFont = `${12 * sizeMultiplier}px 'Minion Pro'`;
const noteRowMusicFont = `${12 * sizeMultiplier}px 'Bravura'`;
const noteRowCharacterSpacing = 2 * sizeMultiplier;

const gridLeft = margin;
const gridTop = margin + fretsRowHeight + fretsRowMargin;

class ChordDiagramRenderer {

    private readonly canvas: Canvas;
    private readonly context: Canvas.Context2d;
    private readonly chordDetail: ChordDetail;
    private readonly fretRange: { min: number, max: number };

    constructor(chordDetail: ChordDetail) {
        this.chordDetail = chordDetail;
        this.fretRange = this.decideFretRange();
        const canvasWidth = this.gridWidth + gridLeft + margin
            + (this.fretRange.min !== 1 ? fretOffsetMargin + fretOffsetWidth : 0);
        const canvasHeight = gridTop
            + this.gridHeight
            + noteRowMargin + noteRowHeight
            + margin;
        this.canvas = new Canvas(canvasWidth, canvasHeight);
        this.context = this.canvas.getContext("2d");
        this.context.addFont(CanvasFonts.minionPro);
    }

    private get gridWidth(): number {
        return cellWidth * (this.chordDetail.frets.length - 1);
    }

    private get gridHeight(): number {
        return cellHeight * (this.fretRange.max - this.fretRange.min + 1);
    }

    private decideFretRange(): { min: number, max: number } {
        const fretRange = L(this.chordDetail.frets).where(f => !isNaN(f) && f > 0).minMax();
        if (fretRange.max <= 5) {
            return { min: 1, max: Math.max(fretRange.max, 4) };
        }

        return { min: fretRange.min, max: fretRange.min + Math.max(fretRange.max - fretRange.min, 3) };
    }

    private drawGrid() {
        this.context.lineWidth = borderLineWidth;
        this.context.strokeStyle = CanvasColors.Black;
        this.context.strokeRect(gridLeft, gridTop, this.gridWidth, this.gridHeight);

        this.context.lineWidth = gridLineWidth;
        for (let i = 1; i < this.chordDetail.frets.length - 1; ++i) {
            this.context.beginPath();
            const x = gridLeft + i * cellWidth;
            this.context.lineTo(x, gridTop);
            this.context.lineTo(x, gridTop + this.gridHeight);
            this.context.stroke();
        }

        for (let i = 1; i < this.fretRange.max - this.fretRange.min + 1; ++i) {
            this.context.beginPath();
            const y = gridTop + i * cellHeight;
            this.context.lineTo(gridLeft, y);
            this.context.lineTo(gridLeft + this.gridWidth, y);
            this.context.stroke();
        }
    }

    private drawFingering() {

        this.context.lineWidth = fingerCircleLineWidth;
        this.context.font = fingerFont;
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        for (let i = 0; i < this.chordDetail.fingering.length; ++i) {
            const finger = this.chordDetail.fingering[i];
            if (isNaN(finger.fret)) {
                continue;
            }
            const relativeFret = finger.fret - this.fretRange.min;
            const y = gridTop + cellHeight * (relativeFret + 0.5);
            const fromX = gridLeft + finger.from * cellWidth;
            const toX = gridLeft + finger.to * cellWidth;
            if (finger.to === finger.from) {
                this.context.beginPath();
                this.context.arc(fromX, y, fingerCircleRadius, 0, Math.PI * 2);
            } else {
                this.context.beginPath();
                this.context.beginPath();
                this.context.lineTo(fromX, y - fingerCircleRadius);
                this.context.lineTo(toX - fingerCircleRadius, y - fingerCircleRadius);
                this.context.arc(toX, y, fingerCircleRadius, -Math.PI / 2, Math.PI / 2);
                this.context.lineTo(fromX + fingerCircleRadius, y + fingerCircleRadius);
                this.context.arc(fromX, y, fingerCircleRadius, Math.PI / 2, -Math.PI / 2);
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
        const x = gridLeft + cellWidth * (this.chordDetail.frets.length - 1) + fretOffsetMargin + centerTextOffsetX;
        const y = gridTop + cellHeight * 0.5 + centerTextOffsetY;

        this.context.font = fretOffsetFont;
        this.context.textAlign = "left";
        this.context.textBaseline = "middle";
        this.context.fillStyle = CanvasColors.Black;
        this.context.fillText(`${this.fretRange.min} fr`, x, y);
    }

    private drawFretRow() {
        this.context.font = fretsRowFont;
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = CanvasColors.Black;

        const y = margin + fretsRowHeight / 2 + centerTextOffsetY;

        for (let i = 0; i < this.chordDetail.frets.length; ++i) {
            const fret = this.chordDetail.frets[i];
            const text = isNaN(fret) ? "×" : fret.toString();
            const x = gridLeft + cellWidth * i + centerTextOffsetX;
            this.context.fillText(text, x, y);
        }
    }

    private drawNoteRow() {
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = CanvasColors.Black;

        const y = gridTop + this.gridHeight + noteRowMargin + noteRowHeight / 2 + centerTextOffsetY;

        for (let i = 0; i < this.chordDetail.frets.length; ++i) {
            const note = this.chordDetail.notes[i];
            console.log(note);
            if (note === undefined) {
                continue;
            }

            const x = gridLeft + cellWidth * i + centerTextOffsetX;

            if (note.accidental === Accidental.Natural) {
                this.context.font = noteRowFont;
                this.context.fillText(note.toString(), x, y);
            } else {
                this.context.font = noteRowFont;
                const baseName = BaseNoteName[note.baseName];
                const baseNameMeasurement = this.context.measureText(baseName);

                this.context.font = noteRowMusicFont;
                const accidental = Accidental.toString(note.accidental);
                const accidentalMeasurement = this.context.measureText(accidental);

                const totalWidth = baseNameMeasurement.width + accidentalMeasurement.width;

                this.context.font = noteRowFont;
                this.context.fillText(baseName, x - totalWidth / 2 + baseNameMeasurement.width / 2, y);

                this.context.font = noteRowMusicFont;
                this.context.fillText(accidental,
                    x - totalWidth / 2
                    + baseNameMeasurement.width
                    + accidentalMeasurement.width / 2
                    + noteRowCharacterSpacing,
                    y);
            }
        }
    }

    render(path: string): string {
        this.drawFretRow();
        this.drawGrid();
        this.drawFretOffset();
        this.drawFingering();
        this.drawNoteRow();
        return this.canvas.toDataURL();
    }
}

export namespace ChordDiagram {
    export function draw(chordFretting: ChordDetail, path: string): string {
        return new ChordDiagramRenderer(chordFretting).render(path);
    }
}