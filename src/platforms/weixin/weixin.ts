import sha1 = require("sha1");

export class Weixin {

    static readonly token: string = "C2B4FAE05F9E4CD58FC87DFC8F8ECED4";

    static authenticate(signature: string, timestamp: string, nonce: string): boolean {
        var list = [Weixin.token, timestamp, nonce];
        list.sort();
    
        const hashcode = sha1(list.join(""));

        return hashcode === signature;
    }

}