import { Font } from "canvas-prebuilt";
import * as path from "path";

export namespace CanvasFonts {
    const fontRoot = "./dist/public/eisle-fonts";
    export const text: Font = new Font("Text", fontRoot + "/Minion Pro/MinionProMusic-Regular.ttf");
    text.addFace(fontRoot + "/Minion Pro/MinionPro-It.otf", "normal", "italic");
    text.addFace(fontRoot + "/Minion Pro/MinionPro-Bold.otf", "bold");
    text.addFace(fontRoot + "/Minion Pro/MinionPro-BoldIt.otf", "bold", "italic");

    export const music: Font = new Font("Music", fontRoot + "/Bravura/Bravura.otf");
}