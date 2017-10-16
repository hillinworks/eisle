"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sha1 = require("sha1");
class Weixin {
    static authenticate(signature, timestamp, nonce) {
        var list = [Weixin.token, timestamp, nonce];
        list.sort();
        const hashcode = sha1(list.join(""));
        return hashcode === signature;
    }
}
Weixin.token = "C2B4FAE05F9E4CD58FC87DFC8F8ECED4";
exports.Weixin = Weixin;
