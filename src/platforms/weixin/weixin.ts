import sha1 = require("sha1");

export namespace Weixin {

    export const token: string = "C2B4FAE05F9E4CD58FC87DFC8F8ECED4";

    export function encode(timestamp: string, data: string): string {
        const list = [Weixin.token, timestamp, data];
        list.sort();

        return sha1(list.join("")).toString();
    }

    export function authenticate(signature: string, timestamp: string, data: string): boolean {
        return encode(timestamp, data) === signature;
    }

}