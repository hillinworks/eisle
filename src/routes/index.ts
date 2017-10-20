import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { REPL } from "../repl/repl";
import { NoteName } from "../music-core/Core/MusicTheory/NoteName";
import { ChordType } from "../music-core/Core/MusicTheory/ChordType";
import { Chord } from "../music-core/Core/MusicTheory/Chord";
import { ChordFingering, ChordFingeringCandidate } from "../music-core/Core/MusicTheory/String/ChordFingering";
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

    const options: Object = {
      "message": "" // this.testChords()
    };

    this.render(req, res, "index", options);
  }

  public test(req: Request, res: Response, next: NextFunction) {
    const command = req.param("command");
    const options = { "message": REPL.process(command).content.replace(/\n/g, "<br />") };
    this.render(req, res, "index", options);
  }

  testChords() {
    const Roots = [NoteName.C, NoteName.CSharp, NoteName.D, NoteName.DSharp, NoteName.E, NoteName.F, NoteName.FSharp, NoteName.G, NoteName.GSharp, NoteName.A, NoteName.ASharp, NoteName.B];

    const chordTypes: ChordType[] = [];
    for (const second of [0, ChordType.m2, ChordType.M2]) {
      for (const third of [0, ChordType.m3, ChordType.M3]) {
        for (const fourth of [0, ChordType.P4]) {
          for (const fifth of [0, ChordType.d5, ChordType.P5]) {
            for (const sixth of [0, ChordType.m6, ChordType.M6]) {
              for (const seventh of [0, ChordType.m7, ChordType.M7]) {
                const chordType = second | third | fourth | fifth | sixth | seventh;
                if (chordType === 0) {
                  continue;
                }
                chordTypes.push(chordType);
              }
            }
          }
        }
      }
    }

    function hash(target: ChordFingeringCandidate): number {
      const baseFret = L(target.fingerings).where(f => !isNaN(f)).min() - 1;
      let result = 0;
      for (let i = 0; i < target.fingerings.length; ++i) {
        let value = target.fingerings[i];
        if (isNaN(value)) {
          value = 7;
        } else if (value > 0) {
          value -= baseFret;
        }

        result += (value << (i * 4));
      }
      return result;
    }

    const hashMap: { [key: number]: string } = {};

    for (const root of Roots) {
      for (const bass of Roots) {
        for (const chordType of chordTypes) {
          const chord = new Chord("", root, chordType);
          if (!root.equals(bass)) {
            chord.bass = bass;
          }
          const candidates = ChordFingering.getChordFingerings(chord, GuitarTunings.standard);
          for (const candidate of candidates) {
            const hashValue = hash(candidate);
            if (hashMap[hashValue] === undefined) {
              const builder = new StringBuilder();
              const baseFret = L(candidate.fingerings).where(f => !isNaN(f)).min() - 1;
              for (let i = 0; i < candidate.fingerings.length; ++i) {
                const value = candidate.fingerings[i];
                if (isNaN(value)) {
                  builder.append("x");
                } else if (value > 0) {
                  builder.append((value - baseFret).toString());
                } else {
                  builder.append(value.toString());
                }
              }
              hashMap[hashValue] = builder.toString();
              console.log("add chord fingering pattern:" + builder.toString());
            }
          }
        }
      }
    }

    return JSON.stringify(hashMap);
  }

}