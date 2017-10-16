"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const route_1 = require("./route");
const weixin_1 = require("../platforms/weixin/weixin");
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
        if (weixin_1.Weixin.authenticate(signature, timestamp, nonce)) {
            res.send(req.query.echostr);
        }
        else {
            res.send("");
        }
    }
}
exports.WeixinRoute = WeixinRoute;
