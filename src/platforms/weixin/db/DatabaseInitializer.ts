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

    server.model.user = connection.model<IUserModel>("User", userSchema);
    server.model.userSettings = connection.model<IUserSettingsModel>("UserSettings", userSettingsSchema);
}