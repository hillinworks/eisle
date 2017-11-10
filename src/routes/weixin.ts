import { MessageHandler } from "../platforms/weixin/messaging/MessageHandler";
import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { Weixin as WeixinService } from "../platforms/weixin/Weixin";
import * as xml2js from "xml2js";
import { REPL } from "../repl/repl";
import { Settings } from "../platforms/weixin/viewModels/settings";
import { Instruments } from "../eisle-core/chord/Instruments";

export class WeixinRoute extends BaseRoute {

    public static create(router: Router) {
        console.log("[WeixinRoute::create] Creating Weixin route.");

        router.get("/wx", (req: Request, res: Response, next: NextFunction) => {
            new WeixinRoute().get(req, res, next);
        });

        router.post("/wx", (req: Request, res: Response, next: NextFunction) => {
            new WeixinRoute().post(req, res, next);
        });

        router.get("/wx/settings", (req: Request, res: Response, next: NextFunction) => {
            new WeixinRoute().showSettings(req, res, next);
        });

        router.get("/wx/settings/test", (req: Request, res: Response, next: NextFunction) => {
            new WeixinRoute().showSettingsTest(req, res, next);
        });

        router.post("/wx/settings", (req: Request, res: Response, next: NextFunction) => {
            new WeixinRoute().updateSettings(req, res, next);
        });

        router.post("/wx/settings/test", (req: Request, res: Response, next: NextFunction) => {
            new WeixinRoute().updateSettingsTest(req, res, next);
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

    public async showSettings(req: Request, res: Response, next: NextFunction) {
        const weixinId = req.body.wxid;
        const token = req.body.token;
        const epoch = req.body.epoch;

        if (!WeixinService.authenticate(token, epoch, weixinId)) {
            res.status(403).send("未知用户");
            return;
        }

        this.title = "设置";
        const newEpoch = Date.now().toString();
        res.locals.auth = {
            weixinId: weixinId,
            epoch: newEpoch,
            token: WeixinService.encode(newEpoch, weixinId)
        };
        this.render(req, res, "weixin/settings", Settings.createViewModel(weixinId));
    }

    public async showSettingsTest(req: Request, res: Response, next: NextFunction) {
        this.title = "设置";
        const newEpoch = Date.now().toString();
        res.locals.auth = {
            weixinId: "test",
            epoch: newEpoch,
            token: WeixinService.encode(newEpoch, "test")
        };
        this.render(req, res, "weixin/settings", { selectedInstrument: "ukulele-baritone", instrumentGroups: Instruments.groups });
    }

    public async updateSettings(req: Request, res: Response, next: NextFunction) {
        const weixinId = req.body.wxid;
        if (!WeixinService.authenticate(req.body.token, req.body.epoch, weixinId)) {
            res.status(403).send("未知用户");
            return;
        }

        await Settings.save(weixinId, req.body);
        this.title = "完成";
        const data = { instrumentName: Instruments.getInstrumentInfo(req.body.instrument).fullName };
        this.render(req, res, "weixin/settings-save", data);
    }

    public async updateSettingsTest(req: Request, res: Response, next: NextFunction) {
        console.log(req.body);
        this.title = "完成";
        const data = { instrumentName: Instruments.getInstrumentInfo(req.body.instrument).fullName };
        this.render(req, res, "weixin/settings-save", data);
    }
}