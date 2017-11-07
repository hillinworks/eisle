import { L, range } from "../../../music-core/Core/Utilities/LinqLite";
import { Tuning } from "../../../music-core/Core/MusicTheory/String/Tuning";
import { NoteName } from "../../../music-core/Core/MusicTheory/NoteName";
import { Chord } from "../../../music-core/Core/MusicTheory/Chord";
import * as Canvas from "canvas-prebuilt";
import { CanvasColors } from "../../../eisle-core/drawing/CanvasColors";
import { DrawingHelper } from "../../../eisle-core/drawing/DrawingHelper";


const topMargin = 32;
const leftMargin = 12;
const cellWidth = 22;
const firstFretHeight = 96;

const fretHeights = L(range(0, 13)).select(f => firstFretHeight / (1 + Math.pow(2, f / 12))).toArray();
const fretNoteOffsets: number[] = [];
fretNoteOffsets[0] = 0;
for (let i = 1; i <= 12; ++i) {
    fretNoteOffsets[i] = fretNoteOffsets[i - 1] + fretHeights[i - 1];
}
fretNoteOffsets[0] = -18;

const borderLineWidth = 2;
const gridLineWidth = 1;

const noteCircleRadius = 9;
const noteCircleLineWidth = 2;
const centerTextOffsetX = 0;
const centerTextOffsetY = 1;

const nutSpacing = 4;
const nutLineWidth = 2;

const fretMarkerRadius = 6;

const noteFont = `${12}px 'Text'`;

class Renderer {

    private readonly chord: Chord;
    private readonly tuning: Tuning;
    private readonly notes: NoteName[];
    private canvas: Canvas;
    private context: Canvas.Context2d;
    private x: number;
    private y: number;
    private scale: number;

    constructor(chord: Chord, tuning: Tuning) {
        this.chord = chord;
        this.tuning = tuning;
        this.notes = chord.getNotes();
    }

    private get gridWidth(): number {
        return cellWidth * (this.tuning.stringTunings.length - 1) * this.scale;
    }

    private drawFrame() {

        const x = this.x + leftMargin * this.scale;
        let y = this.y + topMargin * this.scale;

        // zero fret
        this.context.lineWidth = nutLineWidth * this.scale;
        this.context.strokeStyle = CanvasColors.black;
        this.context.fillStyle = CanvasColors.blackHalfOpacity;
        this.context.beginPath();
        this.context.lineTo(x - borderLineWidth * this.scale / 2, y);
        this.context.lineTo(x + this.gridWidth + borderLineWidth * this.scale / 2, y);
        this.context.stroke();

        y += nutSpacing * this.scale;

        const frameTop = y;

        this.context.lineWidth = gridLineWidth * this.scale;
        for (let i = 0; i < 12; ++i) {
            const fretHeight = fretHeights[i] * this.scale;
            y += fretHeight;

            this.context.beginPath();
            this.context.lineTo(x, y);
            this.context.lineTo(x + this.gridWidth, y);
            this.context.stroke();

            if (i === 2 || i === 4 || i === 8) {
                this.context.beginPath();
                this.context.arc(x + this.gridWidth / 2, y - fretHeight / 2, fretMarkerRadius * this.scale, 0, Math.PI * 2);
                this.context.fill();
            }

            if (i === 6 || i === 11) {
                this.context.beginPath();
                this.context.arc(x + cellWidth * this.scale, y - fretHeight / 2, fretMarkerRadius * this.scale, 0, Math.PI * 2);
                this.context.fill();

                this.context.beginPath();
                this.context.arc(x + this.gridWidth - cellWidth * this.scale, y - fretHeight / 2, fretMarkerRadius * this.scale, 0, Math.PI * 2);
                this.context.fill();
            }
        }

        for (let i = 1; i < this.tuning.stringTunings.length - 1; ++i) {
            this.context.beginPath();
            const xi = x + i * cellWidth * this.scale;
            this.context.lineTo(xi, frameTop);
            this.context.lineTo(xi, y);
            this.context.stroke();
        }

        this.context.lineWidth = borderLineWidth * this.scale;
        this.context.strokeStyle = CanvasColors.black;
        this.context.strokeRect(
            x,
            frameTop,
            this.gridWidth,
            y - frameTop);
    }

    private drawNotes() {
        this.context.font = DrawingHelper.scaleFont(noteFont, this.scale);
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        const _this = this;
        function drawNote(note: NoteName, x: number, y: number) {
            const noteName = note.toString();
            const width = _this.context.measureText(noteName).width;
            const isRoot = note.equals(_this.chord.root);

            _this.context.fillStyle = isRoot ? CanvasColors.black : CanvasColors.white;

            _this.context.beginPath();
            _this.context.arc(x, y, noteCircleRadius * _this.scale, 0, Math.PI * 2);
            _this.context.stroke();
            _this.context.fill();

            _this.context.fillStyle = isRoot ? CanvasColors.white : CanvasColors.black;
            _this.context.fillText(note.toString(), x + centerTextOffsetX * _this.scale, y + centerTextOffsetY * _this.scale);
        }

        const baseY = this.y + topMargin * this.scale + nutSpacing * this.scale;

        for (let i = 0; i < this.tuning.stringTunings.length; ++i) {
            const x = this.x + leftMargin * this.scale + i * cellWidth * this.scale;
            const baseNote = this.tuning.stringTunings[i].noteName;
            for (const note of this.notes) {
                const semitones = baseNote.getSemitonesTo(note);
                if (semitones === 0) {
                    drawNote(note, x, baseY + fretNoteOffsets[0] * this.scale);
                    drawNote(note, x, baseY + (fretNoteOffsets[12] - fretHeights[12] / 2) * this.scale);
                } else {
                    drawNote(note, x, baseY + (fretNoteOffsets[semitones] - fretHeights[semitones] / 2) * this.scale);
                }
            }
        }
    }

    render(canvas: Canvas, x: number, y: number, scale: number) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.context.fillStyle = CanvasColors.black;
        this.x = x;
        this.y = y;
        this.scale = scale;

        this.drawFrame();
        this.drawNotes();
    }
}

export namespace ChordScaleRenderer {
    export function draw(chord: Chord, tuning: Tuning, canvas: Canvas, x: number, y: number, scale: number) {
        new Renderer(chord, tuning).render(canvas, x, y, scale);
    }
}