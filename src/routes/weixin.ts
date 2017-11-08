import { MessageHandler } from "../platforms/weixin/messaging/MessageHandler";
import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { Weixin as WeixinService } from "../platforms/weixin/Weixin";
import * as xml2js from "xml2js";
import { REPL } from "../repl/repl";

export class WeixinRoute extends BaseRoute {

    public static create(router: Router) {
        console.log("[WeixinRoute::create] Creating Weixin route.");

        router.get("/wx", (req: Request, res: Response, next: NextFunction) => {
            new WeixinRoute().get(req, res, next);
        });

        router.post("/wx", (req: Request, res: Response, next: NextFunction) => {
            new WeixinRoute().post(req, res, next);
        });
    }

    constructor() {
        super();
    }

    private authenticate(req: Request): boolean {
        const signature: string = req.query.signature;
        const timestamp: string = req.query.timestamp;
        const nonce: string = req.query.nonce;

        return WeixinService.authenticate(signature, timestamp, nonce);
    }

    public get(req: Request, res: Response, next: NextFunction) {

        if (this.authenticate(req)) {
            res.send(req.query.echostr);
        } else {
            res.send("");
        }

    }

    public async post(req: Request, res: Response, next: NextFunction) {
        if (!this.authenticate(req)) {
            res.send("success");
        }
        const response = await MessageHandler.handle(req.body);
        res.send(response);
    }

}