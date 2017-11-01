import { Chord } from "../../../music-core/Core/MusicTheory/Chord";
import * as Canvas from "canvas-prebuilt";
import { CanvasColors } from "../../drawing/CanvasColors";
import { NoteName } from "../../../music-core/Core/MusicTheory/NoteName";
import { DrawingHelper } from "../../drawing/DrawingHelper";
import { StringUtilities } from "../../../music-core/Core/Utilities/StringUtilities";
import { Accidental } from "../../../music-core/Core/MusicTheory/Accidental";
import { any } from "../../../music-core/Core/Utilities/LinqLite";
import { ChordType } from "../../../music-core/Core/MusicTheory/ChordType";
import { Interval } from "../../../music-core/Core/MusicTheory/Interval";

const topMargin = 16;
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
    private readonly intervals: Interval[];
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
        this.intervals = ChordType.getIntervals(chord.type);
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
        const degrees = (this.chord.bass === undefined ? 0 : this.chord.bass.getDegreesTo(this.chord.root))
            + this.intervals[this.intervals.length - 1].number;

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

        this.context.strokeStyle = CanvasColors.black;
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
            if (i === 3) {  // 4th line, G
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

        let lastNote: NoteName = undefined;
        function drawNote(note: NoteName, degrees: number) {

            const xOffset = ((degrees % 7) % 2 === 1) ? evenNoteOffsetX * _this.scale : 0;
            const y = _this.bassNoteY - degrees / 2 * lineSpacing * _this.scale;

            _this.context.fillText(StringUtilities.fixedFromCharCode(0xe0a2), x + xOffset, y);

            if (note.accidental !== Accidental.Natural) {
                const accidentalOffset = (accidentalOffsetXBase + (getAccidentalColumnIndex(y) + 1) * accidentalOffsetX) * _this.scale;
                _this.context.fillText(Accidental.toString(note.accidental), x + accidentalOffset, y);
            }

            lastNote = note;
        }

        if (this.chord.bass !== undefined) {
            drawNote(this.chord.bass, this.chord.bass.getDegreesTo(this.chord.root));
        }

        drawNote(this.chord.root, 0);

        for (const interval of this.intervals) {
            drawNote(this.chord.root.offset(interval), interval.number);
        }
    }

    render(canvas: Canvas, x: number, y: number, scale: number) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.context.fillStyle = CanvasColors.black;
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