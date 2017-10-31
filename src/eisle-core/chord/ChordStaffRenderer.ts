import { Chord } from "../../music-core/Core/MusicTheory/Chord";
import * as Canvas from "canvas-prebuilt";
import { CanvasColors } from "../drawing/CanvasColors";
import { NoteName } from "../../music-core/Core/MusicTheory/NoteName";
import { DrawingHelper } from "../drawing/DrawingHelper";
import { StringUtilities } from "../../music-core/Core/Utilities/StringUtilities";
import { Accidental } from "../../music-core/Core/MusicTheory/Accidental";
import { any } from "../../music-core/Core/Utilities/LinqLite";

const topMargin = 40;
const lineSpacing = 8;
const lineWidth = 0.75;

const width = 80;

const clefPosition = 16;

const notePosition = 56;
const ledgerWidthBase = 24;

const noteFont = `${32}px 'Music'`;
const evenNoteOffsetX = 12;
const accidentalOffsetXBase = -2;
const accidentalOffsetX = -10;
const accidentalVerticalSpacing = 16;

class Renderer {

    private readonly chord: Chord;
    private readonly notes: NoteName[];
    private canvas: Canvas;
    private context: Canvas.Context2d;
    private x: number;
    private y: number;
    private scale: number;

    private bassSlot: number;
    private bassNoteY: number;
    private clefY: number;

    constructor(chord: Chord) {
        this.chord = chord;
        this.notes = chord.getNotes();
    }

    private getIsEvenNote(i: number): boolean {
        if (i === 0 && this.chord.bass !== undefined) {
            return this.chord.bass.getDegreesTo(this.chord.root) % 2 === 1;
        } else {
            return this.chord.root.getDegreesTo(this.notes[i]) % 2 === 1;
        }
    }

    private drawLines() {

        const hasEventNote = any(this.notes, (n, i) => this.getIsEvenNote(i));
        let degrees = 0;
        for (let i = 0; i < this.notes.length - 1; ++i) {
            degrees += this.notes[i].getDegreesTo(this.notes[i + 1]);
        }

        let bottomSlot = this.notes[0].baseName - 2;  // -2 for 1st lower ledger line (central C)
        let topSlot = bottomSlot + degrees;
        let bottomExtraSlots = -bottomSlot;
        let topExtraSlots = topSlot - 8;
        while (topExtraSlots - bottomExtraSlots >= 7) {
            topExtraSlots -= 7;
            bottomExtraSlots += 7;
        }

        bottomSlot = -bottomExtraSlots;
        topSlot = topExtraSlots + 8;

        this.bassSlot = bottomSlot;

        const bottomLedgerCount = Math.max(Math.floor(-bottomSlot / 2), 0);
        const topLedgerCount = Math.max(Math.floor((topSlot - 8) / 2), 0);

        let y = this.y + topMargin * this.scale;

        this.bassNoteY = y + (topLedgerCount + (8 - this.bassSlot) / 2) * lineSpacing * this.scale;

        this.context.strokeStyle = CanvasColors.Black;
        this.context.lineWidth = lineWidth * this.scale;

        const _this = this;

        function drawLine(x: number, width: number) {
            _this.context.beginPath();
            _this.context.lineTo(x, y);
            _this.context.lineTo(x + width * _this.scale, y);
            y += lineSpacing * _this.scale;
            _this.context.stroke();
        }

        const ledgerWidth = ledgerWidthBase + (hasEventNote ? evenNoteOffsetX : 0);
        function drawLedger() {
            const x = _this.x + (notePosition - ledgerWidthBase / 2) * _this.scale;
            drawLine(x, ledgerWidth);
        }

        for (let i = 0; i < topLedgerCount; ++i) {
            drawLedger();
        }

        for (let i = 0; i < 5; ++i) {
            if (i === 3) {
                this.clefY = y;
            }
            drawLine(this.x, width);
        }

        for (let i = 0; i < bottomLedgerCount; ++i) {
            drawLedger();
        }
    }

    private drawClef() {
        this.context.textAlign = "center";
        this.context.textBaseline = "alphabetic";
        this.context.font = DrawingHelper.scaleFont(noteFont, this.scale);
        this.context.fillText(StringUtilities.fixedFromCharCode(0xe050), this.x + clefPosition * this.scale, this.clefY);
    }

    private drawNotes() {

        this.context.textAlign = "center";
        this.context.textBaseline = "alphabetic";
        this.context.font = DrawingHelper.scaleFont(noteFont, this.scale);

        const x = this.x + notePosition * this.scale;
        let y = this.bassNoteY;

        const accidentalColumns: number[] = [];

        const _this = this;
        function getAccidentalColumnIndex(y: number): number {
            for (let i = 0; i < accidentalColumns.length; ++i) {
                if (accidentalColumns[i] - y >= accidentalVerticalSpacing * _this.scale) {
                    accidentalColumns[i] = y;
                    return i;
                }
            }

            accidentalColumns.push(y);
            return accidentalColumns.length - 1;
        }

        for (let i = 0; i < this.notes.length; ++i) {
            const note = this.notes[i];
            const degree = this.chord.root.getDegreesTo(note);
            const xOffset = this.getIsEvenNote(i) ? evenNoteOffsetX * this.scale : 0;
            this.context.fillText(StringUtilities.fixedFromCharCode(0xe0a2), x + xOffset, y);

            if (note.accidental !== Accidental.Natural) {
                const accidentalOffset = (accidentalOffsetXBase + (getAccidentalColumnIndex(y) + 1) * accidentalOffsetX) * this.scale;
                this.context.fillText(Accidental.toString(note.accidental), x + accidentalOffset, y);
            }

            if (i < this.notes.length - 1) {
                y -= note.getDegreesTo(this.notes[i + 1]) / 2 * lineSpacing * this.scale;
            }
        }
    }

    render(canvas: Canvas, x: number, y: number, scale: number) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.x = x;
        this.y = y;
        this.scale = scale;

        this.drawLines();
        this.drawClef();
        this.drawNotes();
    }
}

export namespace ChordStaffRenderer {
    export function draw(chord: Chord, canvas: Canvas, x: number, y: number, scale: number) {
        new Renderer(chord).render(canvas, x, y, scale);
    }
}