import { IUserSettingsModel } from "./IUserSettingsModel";
import { Model } from "mongoose";
import { IUserModel } from "./IUserModel";

export interface IModel {
    user: Model<IUserModel>;
    userSetting: Model<IUserSettingsModel>;
}

export namespace IModel {
    export function createEmpty(): IModel {
        return { user: undefined, userSetting: undefined };
    }
}