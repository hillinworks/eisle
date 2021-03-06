import { userSettingsSchema } from "./schemas/UserSettings";
import { IUserSettingsModel } from "./models/IUserSettingsModel";
import { userSchema } from "./schemas/User";
import { IUserModel } from "./models/IUserModel";
import { Server } from "../../../server";
import { Request, Response, NextFunction } from "Express";
import mongoose = require("mongoose");

export function DatabaseInitializer(req: Request, res: Response, next: NextFunction) {
    mongoose.Promise = global.Promise;

    const server = Server.current;
    const connection: mongoose.Connection = mongoose.createConnection(server.app.locals.eisle.mongodb.connectionString);
    connection.on("error", console.error.bind(console, "connection error:"));

    server.model.User = connection.model<IUserModel>(IUserModel.name, userSchema);
    server.model.UserSettings = connection.model<IUserSettingsModel>(IUserSettingsModel.name, userSettingsSchema);

    return next();
}