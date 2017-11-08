import { Document } from "mongoose";
import { IUserSettings } from "../interfaces/IUserSettings";

export interface IUserSettingsModel extends IUserSettings, Document {

}