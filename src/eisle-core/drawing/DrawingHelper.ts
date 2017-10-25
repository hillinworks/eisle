import { NoteName } from "../../music-core/Core/MusicTheory/NoteName";
import * as Canvas from "canvas-prebuilt";
import { Accidental } from "../../music-core/Core/MusicTheory/Accidental";
import { BaseNoteName } from "../../music-core/Core/MusicTheory/BaseNoteName";
import { StringBuilder } from "../../music-core/Core/Utilities/StringBuilder";
import { StringUtilities } from "../../music-core/Core/Utilities/StringUtilities";
import { toMap, sum } from "../../music-core/Core/Utilities/LinqLite";
export namespace DrawingHelper {

    const musicChars = toMap(["♭", "♯", StringUtilities.fixedFromCharCode(0x1d12a), StringUtilities.fixedFromCharCode(0x1d12b)], e => e, e => true);

    export function drawMusicText(context: Canvas.Context2d, text: string, x: number, y: number, regularFont: string, musicFont: string, spacing: number, align: "left" | "center" | "right"): number {

        const builder = new StringBuilder();
        let isBuildingMusicString = false;

        const sections: { text: string, font: string, measurement: Canvas.IMeasureTextResult }[] = [];

        function flushSection() {
            const font = isBuildingMusicString ? musicFont : regularFont;
            const text = builder.toString();
            context.font = font;
            const measurement = context.measureText(text);

            sections.push({
                text: text,
                font: font,
                measurement: measurement
            });

            builder.clear();
        }

        for (let i = 0; i < text.length; ++i) {
            const char = text.charAt(i);
            if (musicChars[char]) {
                if (!isBuildingMusicString) {
                    flushSection();
                }
                isBuildingMusicString = true;
            } else {
                if (isBuildingMusicString) {
                    flushSection();
                }
                isBuildingMusicString = false;
            }

            builder.append(char);
        }

        if (builder.length > 0) {
            flushSection();
        }

        const sumWidth = sum(sections, s => s.measurement.width) + (sections.length - 1) * spacing;
        const xOffsets = {
            ["left"]: 0,
            ["center"]: 0.5,
            ["right"]: 1
        };
        const xOffset = xOffsets[align];

        let currentX = x + -xOffset * sumWidth / 2;

        for (const section of sections) {
            context.font = section.font;
            currentX += xOffset * section.measurement.width;
            context.fillText(section.text, currentX, y);
            currentX += (1 - xOffset) * section.measurement.width;
            currentX += spacing;
        }

        return sumWidth;
    }

    export function scaleFont(font: string, scale: number): string {
        return font.replace(/(\d+)px/, (_, size) => (parseInt(size) * scale).toString() + "px");
    }
}