import { Request, Response, NextFunction } from "Express";

export function TextBodyParser(req: Request, res: Response, next: NextFunction) {
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
}