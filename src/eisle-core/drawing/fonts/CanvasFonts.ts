import { Font } from "canvas-prebuilt";
import * as path from "path";

export namespace CanvasFonts {
    const fontRoot = "./dist/public/eisle-fonts";
    export const minionPro: Font = new Font("Minion Pro", fontRoot + "/Minion Pro/MinionPro-Regular.otf");
    minionPro.addFace(fontRoot + "/Minion Pro/MinionPro-It.otf", "normal", "italic");
    minionPro.addFace(fontRoot + "/Minion Pro/MinionPro-Bold.otf", "bold");
    minionPro.addFace(fontRoot + "/Minion Pro/MinionPro-BoldIt.otf", "bold", "italic");

    export const bravura: Font = new Font("Bravura", fontRoot + "/Bravura/Bravura.otf");
}