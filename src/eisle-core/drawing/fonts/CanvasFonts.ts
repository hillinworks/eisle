import { Font } from "canvas-prebuilt";
import * as path from "path";

export namespace CanvasFonts {
    const fontRoot = "./dist/public/eisle-fonts";
    export const music: Font = new Font("Music", fontRoot + "/Minion Pro/MinionProMusic-Regular.ttf");
    music.addFace(fontRoot + "/Minion Pro/MinionPro-It.otf", "normal", "italic");
    music.addFace(fontRoot + "/Minion Pro/MinionPro-Bold.otf", "bold");
    music.addFace(fontRoot + "/Minion Pro/MinionPro-BoldIt.otf", "bold", "italic");

    export const bravura: Font = new Font("Bravura", fontRoot + "/Bravura/Bravura.otf");
}