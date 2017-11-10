import { NextFunction, Request, Response, Router } from "express";
import { REPL } from "../repl/repl";
import { REPLArticlesResult } from "../repl/REPLResult";
import { BaseRoute } from "./route";
import { ChordIntroModel, ChordIntroPage, ChordSyntaxError } from "../eisle-core/chord/ChordIntroPage";


export class ChordRoute extends BaseRoute {

    public static create(router: Router) {
        console.log("[ChordRoute::create] Creating chord route.");

        const handler = (req: Request, res: Response, next: NextFunction) => {
            new ChordRoute().chord(req, res, next);
        };

        router.get("/chord/syntax", (req: Request, res: Response, next: NextFunction) => {
            new ChordRoute().chordSyntax(req, res, next);
        });

        router.get("/chord/:input", (req: Request, res: Response, next: NextFunction) => {
            new ChordRoute().chord(req, res, next);
        });

    }

    public chord(req: Request, res: Response, next: NextFunction) {

        const input = req.params["input"];
        const instrument = req.query.instrument;

        const chordIntro = ChordIntroPage.create(input, instrument);
        if (chordIntro === undefined) {
            res.status(404).send("无法识别的和弦");
            return;
        }

        if (chordIntro instanceof ChordSyntaxError) {
            this.title = "无法识别的和弦";
            this.render(req, res, "weixin/chord-error", chordIntro);
        } else if (chordIntro instanceof ChordIntroModel) {
            const from = req.body.from;
            res.locals.showWeixinChatSettings = from === "wxchat";
            this.title = chordIntro.plainName;
            this.render(req, res, "weixin/chord", chordIntro);
        }
    }

    public chordSyntax(req: Request, res: Response, next: NextFunction) {
        this.title = "和弦语法";
        this.render(req, res, "weixin/chord-syntax");
    }
}