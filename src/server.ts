import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import { IndexRoute } from "./routes/index";
import { WeixinRoute } from "./routes/weixin";

export class Server {

  public app: express.Application;

  public static bootstrap(): Server {
    return new Server();
  }

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.api();
  }

  public api() {
    // empty for now
  }

  public config() {

    this.app.use(express.static(path.join(__dirname, "public")));

    this.app.set("views", path.join(__dirname, "views"));
    this.app.set("view engine", "pug");

    this.app.use(logger("dev"));

    this.app.use(bodyParser.json());

    // text body parser
    this.app.use(function (req, res, next) {
      const contentType = req.header("content-type") || "";
      const mime = contentType.split(";")[0];

      if (!mime.startsWith("text/")) {
        return next();
      }
      let data = "";
      req.setEncoding("utf8");
      req.on("data", function (chunk) {
        data += chunk;
      });
      req.on("end", function () {
        req.body = data;
        next();
      });
    });

    this.app.use(bodyParser.urlencoded({
      extended: true
    }));

    this.app.use(cookieParser("SECRET_GOES_HERE"));

    this.app.use(methodOverride());

    this.app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
      err.status = 404;
      next(err);
    });

    this.app.use(errorHandler());
  }

  public routes() {
    let router: express.Router;
    router = express.Router();

    IndexRoute.create(router);
    WeixinRoute.create(router);

    this.app.use(router);
  }
}