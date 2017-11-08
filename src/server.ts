import { DatabaseInitializer } from "./platforms/weixin/db/DatabaseInitializer";
import { IModel } from "./platforms/weixin/db/models/IModel";
import { TextBodyParser } from "./middlewares/TextBodyParser";
import * as express from "Express";
import { Request } from "Express";
import { ChordRoute } from "./routes/chord";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as logger from "morgan";
import * as path from "path";
import * as fs from "fs";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import { IndexRoute } from "./routes/index";
import { WeixinRoute } from "./routes/weixin";

export class Server {

    public app: express.Application;

    public readonly model: IModel;

    public static bootstrap(): Server {
        Server.current = new Server();
        return Server.current;
    }

    constructor() {
        this.model = IModel.createEmpty();
        this.app = express();
        this.config();
        this.routes();
        this.api();
    }

    public api() {
        // empty for now
    }

    public config() {

        console.log(__dirname);

        global.Promise = require("q").Promise;

        if (fs.existsSync(path.join(__dirname, "config/eisleconf.json"))) {
            this.app.locals.eisle = JSON.parse(fs.readFileSync(path.join(__dirname, "config/eisleconf.json"), "utf8"));
        }

        if (fs.existsSync(path.join(__dirname, "config/eisleconf.override.json"))) {
            Object.assign(this.app.locals.eisle, JSON.parse(fs.readFileSync(path.join(__dirname, "config/eisleconf.override.json"), "utf8")));
        }

        this.app.use(express.static(path.join(__dirname, "public")));

        this.app.set("views", path.join(__dirname, "views"));
        this.app.set("view engine", "pug");

        this.app.use(logger("dev"));

        this.app.use(bodyParser.json());

        this.app.use(TextBodyParser);

        this.app.use(bodyParser.urlencoded({
            extended: true
        }));

        this.app.use(cookieParser("SECRET_GOES_HERE"));

        this.app.use(DatabaseInitializer);

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
        ChordRoute.create(router);

        this.app.use(router);
    }
}

export namespace Server {
    export let current: Server;
}