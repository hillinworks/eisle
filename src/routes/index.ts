import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { REPL } from "../repl/repl";


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

  constructor() {
    super();
  }

  public index(req: Request, res: Response, next: NextFunction) {
    this.title = "Home | Echo Isles";

    const options: Object = {
      "message": "Seems you are lost! We don't have a home page yet!"
    };

    this.render(req, res, "index", options);
  }

  public test(req: Request, res: Response, next: NextFunction) {
    const command = req.param("command");
    const options = { "message":  REPL.process(command).content };
    this.render(req, res, "index", options);
  }
}