import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import sha1 = require("sha1");

/**
 * / route
 *
 * @class User
 */
export class WeixinRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class WeixinRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    console.log("[WeixinRoute::create] Creating Weixin route.");

    router.get("/wx", (req: Request, res: Response, next: NextFunction) => {
      new WeixinRoute().weixin(req, res, next);
    });
  }

  /**
   * Constructor
   *
   * @class WeixinRoute
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * The home page route.
   *
   * @class WeixinRoute
   * @method weixinT
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public weixin(req: Request, res: Response, next: NextFunction) {

    const signature: string = req.query.signature;
    const timestamp: string = req.query.timestamp;
    const nonce: string = req.query.nonce;
    const echostr: string = req.query.echostr;
    const token = "C2B4FAE05F9E4CD58FC87DFC8F8ECED4";
    var list = [token, timestamp, nonce];
    list.sort();

    const hashcode = sha1(list.join(""));

    console.log(`[WeixinRoute::weixin] signature=${signature} timestamp=${timestamp} nonce=${nonce} hashcode=${hashcode}.`);

    if (hashcode === signature) {
      res.send(echostr);
    } else {
      res.send("");
    }

  }
}