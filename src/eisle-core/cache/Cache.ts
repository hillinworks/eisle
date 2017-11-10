import * as fs from "fs";
import * as path from "path";
import { ensureDirSync } from "fs-extra";
import { Server } from "../../server";

export namespace Cache {
    const cacheFolder = "./dist/public/cache";

    export function getCacheFolder(subpath: string = undefined): string {
        let folder = cacheFolder;
        if (subpath) {
            folder = path.join(folder, subpath);
        }

        if (!fs.existsSync(folder)) {
            ensureDirSync(folder);
        }

        return folder;
    }

    export function getUrlPath(cachePath: string, absolute = false): string {
        const relative = cachePath.substring("dist/public/".length).replace(/\\/g, "/");
        if (absolute) {
            return `${Server.host}/${relative}`;
        } else {
            return relative;
        }
    }
}