import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { REPL } from "../repl/repl";
import { NoteName } from "../music-core/Core/MusicTheory/NoteName";
import { ChordType } from "../music-core/Core/MusicTheory/ChordType";
import { Chord } from "../music-core/Core/MusicTheory/Chord";
import { ChordFretting, ChordFrettingCandidate } from "../music-core/Core/MusicTheory/String/ChordFretting";
import { GuitarTunings } from "../music-core/Core/MusicTheory/String/Plucked/GuitarTunings";
import { L } from "../music-core/Core/Utilities/LinqLite";
import { StringBuilder } from "../music-core/Core/Utilities/StringBuilder";


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

    const Canvas = require("canvas-prebuilt")
      , Image = Canvas.Image
      , canvas = new Canvas(200, 200)
      , ctx = canvas.getContext("2d");

    ctx.font = "30px Impact";
    ctx.rotate(.1);
    ctx.fillText("Awesome!", 50, 100);

    const te = ctx.measureText("Awesome!");
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.lineTo(50, 102);
    ctx.lineTo(50 + te.width, 102);
    ctx.stroke();

    console.log("<img src=\"" + canvas.toDataURL() + "\" />");

    const options: Object = {
      "message": "<img src=\"" + canvas.toDataURL() + "\" />"
    };

    this.render(req, res, "index", options);
  }

  public test(req: Request, res: Response, next: NextFunction) {
    const command = req.param("command");
    const options = { "message": REPL.process(command).content.replace(/\n/g, "<br />") };
    this.render(req, res, "index", options);
  }
}