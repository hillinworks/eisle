"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const route_1 = require("./route");
const sha1 = require("sha1");
class WeixinRoute extends route_1.BaseRoute {
    static create(router) {
        console.log("[WeixinRoute::create] Creating Weixin route.");
        router.get("/wx", (req, res, next) => {
            new WeixinRoute().weixin(req, res, next);
        });
    }
    constructor() {
        super();
    }
    weixin(req, res, next) {
        const signature = req.query.signature;
        const timestamp = req.query.timestamp;
        const nonce = req.query.nonce;
        const echostr = req.query.echostr;
        const token = "C2B4FAE05F9E4CD58FC87DFC8F8ECED4";
        var list = [token, timestamp, nonce];
        list.sort();
        console.log(list.join(""));
        const hashcode = sha1(list.join(""));
        console.log(`[WeixinRoute::weixin] signature=${signature} timestamp=${timestamp} nonce=${nonce} hashcode=${hashcode}.`);
        if (hashcode === signature) {
            res.send(echostr);
        }
        else {
            res.send("");
        }
    }
}
exports.WeixinRoute = WeixinRoute;
