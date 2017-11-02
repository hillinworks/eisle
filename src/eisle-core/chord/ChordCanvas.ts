import * as Canvas from "canvas-prebuilt";
import { CanvasColors } from "../drawing/CanvasColors";
import { CanvasFonts } from "../drawing/fonts/CanvasFonts";

export namespace ChordCanvas {
    export function createCanvas(width: number, height: number, type: "image" | "pdf" | "svg" = "image"): Canvas {
        const canvas = new Canvas(width, height, type);
        const context = canvas.getContext("2d");
        context.addFont(CanvasFonts.text);
        context.addFont(CanvasFonts.music);
        context.fillStyle = CanvasColors.white;
        context.fillRect(0, 0, width, height);
        return canvas;
    }
}