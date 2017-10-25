import * as fs from "fs";
export namespace Cache {
    const cacheFolder = "./dist/public/cache";

    export function getCacheFolder(): string {
        if (!fs.existsSync(cacheFolder)) {
            fs.mkdirSync(cacheFolder);
        }

        return cacheFolder;
    }
}