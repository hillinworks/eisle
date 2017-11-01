import { Server } from "../server";
import { NextFunction, Request, Response, Router } from "express";
import { REPL } from "../repl/repl";
import { REPLArticlesResult } from "../repl/REPLResult";
import { BaseRoute } from "./route";


export class IndexRoute extends BaseRoute {

  public static create(router: Router) {
    console.log("[IndexRoute::create] Creating index route.");

    router.get("/", (req: Request, res: Response, next: NextFunction) => {
      new IndexRoute().index(req, res, next);
    });

    router.get("/cmd/:command", (req: Request, res: Response, next: NextFunction) => {
      new IndexRoute().test(req, res, next);
    });
  }

  public index(req: Request, res: Response, next: NextFunction) {
    this.title = "Home | Echo Isles";

    this.render(req, res, "index");
  }

  public test(req: Request, res: Response, next: NextFunction) {
    const command = req.params["command"];
    let url = (REPL.process(command) as REPLArticlesResult).articles[0].picUrl;
    url = url.replace(Server.host, "http://localhost:8080");
    const options = { "image":  url };
    this.render(req, res, "weixin/test", options);
  }
}