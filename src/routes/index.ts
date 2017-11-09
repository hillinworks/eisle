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

    public async test(req: Request, res: Response, next: NextFunction) {
        const command = req.params["command"];
        const instrument = req.query.instrument;
        const result = await REPL.process(command, { instrument: instrument }) as REPLArticlesResult;
        const url = result.articles[0].picUrl;
        const options = { "image": url };
        this.render(req, res, "weixin/test", options);
    }
}