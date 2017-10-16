import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { Weixin as WeixinService } from "../platforms/weixin/weixin";

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

  public get(req: Request, res: Response, next: NextFunction) {

    const signature: string = req.query.signature;
    const timestamp: string = req.query.timestamp;
    const nonce: string = req.query.nonce;

    if (WeixinService.authenticate(signature, timestamp, nonce)) {
      res.send(req.query.echostr);
    } else {
      res.send("");
    }

  }

  public post(req: Request, res: Response, next: NextFunction) {
    res.send("success");
  }

}