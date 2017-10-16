import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { REPL } from '../repl/repl';


/**
 * / route
 *
 * @class User
 */
export class IndexRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class IndexRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    console.log("[IndexRoute::create] Creating index route.");

    router.get("/", (req: Request, res: Response, next: NextFunction) => {
      new IndexRoute().index(req, res, next);
    });

    router.get("/cmd/:command", (req: Request, res: Response, next: NextFunction) => {
      new IndexRoute().test(req, res, next);
    });
  }

  /**
   * Constructor
   *
   * @class IndexRoute
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * The home page route.
   *
   * @class IndexRoute
   * @method index
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public index(req: Request, res: Response, next: NextFunction) {
    //set custom title
    this.title = "Home | Echo Isles";

    //set options
    let options: Object = {
      "message": "Seems you are lost! We don't have a home page yet!"
    };

    //render template
    this.render(req, res, "index", options);
  }

  public test(req: Request, res: Response, next: NextFunction) {
    const command = req.param("command");
    const options = { "message":  REPL.process(command).content };
    this.render(req, res, "index", options);
  }
}