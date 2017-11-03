import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { Weixin as WeixinService } from "../platforms/weixin/weixin";
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

  public post(req: Request, res: Response, next: NextFunction) {
    if (!this.authenticate(req)) {
      res.send("success");
    }

    req.accepts("text/xml");
    xml2js.parseString(req.body, (err, result) => {
      if (err || !result) {
        res.send("success");
        return;
      }

      const responseObject: any = {
        xml: {
          ToUserName: result.xml.FromUserName,
          FromUserName: result.xml.ToUserName,
          CreateTime: result.xml.CreateTime,
        }
      };

      switch (result.xml.MsgType[0]) {
        case "text":
          const message = result.xml.Content[0];
          const replResult = REPL.process(message);

          if (!replResult) {
            res.send("success");
            return;
          }

          replResult.fillResponse(responseObject.xml);
          break;
        case "event":
          console.log("event:" + result.xml.Event[0]);
          if (result.xml.event[0] === "subscribe") {
            result.xml.MsgType = "text";
            result.xml.Content = "Hi！\n虽然说不上来以后会变成什么样子，但我现在可以帮你查询和弦。\n随便回复一个什么和弦名试试看，比如……C！";
          } else {
            res.send("success");
            return;
          }
          break;
        default:
          res.send("success");
          return;
      }

      const response = new xml2js.Builder({ headless: true }).buildObject(responseObject);
      console.log(response);
      res.send(response);
    });

  }

}