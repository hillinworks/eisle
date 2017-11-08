import { IUserSettingsModel } from "./IUserSettingsModel";
import { Model } from "mongoose";
import { IUserModel } from "./IUserModel";

export interface IModel {
    User: Model<IUserModel>;
    UserSettings: Model<IUserSettingsModel>;
}

export namespace IModel {
    export function createEmpty(): IModel {
        return { User: undefined, UserSettings: undefined };
    }
}