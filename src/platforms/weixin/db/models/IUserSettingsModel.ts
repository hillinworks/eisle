import { Server } from "../../../../server";
import { Document } from "mongoose";
import { IUserSettings } from "../interfaces/IUserSettings";

export interface IUserSettingsModel extends IUserSettings, Document {

}

export namespace IUserSettingsModel {
    export const name = "UserSettings";

    export function create(): Promise<IUserSettingsModel> {
        const settings: IUserSettings = { instrument: "guitar-standard" };
        return new Server.current.model.UserSettings(settings).save();
    }
}