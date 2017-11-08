import { IUserSettings } from "../interfaces/IUserSettings";
import { Schema } from "mongoose";
import { ObjectID } from "mongodb";

export const userSettingsSchema = new Schema({
    tuning: String
});