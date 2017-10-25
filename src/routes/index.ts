import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { REPL } from "../repl/repl";
import { NoteName } from "../music-core/Core/MusicTheory/NoteName";
import { ChordType } from "../music-core/Core/MusicTheory/ChordType";
import { Chord } from "../music-core/Core/MusicTheory/Chord";
import { ChordDetail } from "../music-core/Core/MusicTheory/String/ChordDetail";
import { GuitarTunings } from "../music-core/Core/MusicTheory/String/Plucked/GuitarTunings";
import { L } from "../music-core/Core/Utilities/LinqLite";
import { StringBuilder } from "../music-core/Core/Utilities/StringBuilder";
import { ChordDiagramRenderer } from "../eisle-core/chord/ChordDiagramRenderer";
import { REPLTextResult } from "../repl/REPLResult";


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

    this.render(req, res, "index");
  }

  public test(req: Request, res: Response, next: NextFunction) {
    const command = req.param("command");
    const options = { "message": (REPL.process(command) as REPLTextResult).text.replace(/\n/g, "<br />") };
    this.render(req, res, "index", options);
  }
}