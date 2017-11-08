import { IUserModel } from "../models/IUserModel";
import { IUserSettingsModel } from "../models/IUserSettingsModel";
import { IUserSettings } from "../interfaces/IUserSettings";
import { Schema } from "mongoose";

export const userSchema = new Schema({
    weixinId: { type: String, index: true, unique: true },
    isSubscribed: { type: Boolean, default: true },
    createdAt: Date,
    subscribeTime: Date,
    unsubscribeTime: Date,
    lastSeen: { type: Date, default: Date.now },
    settings: { type: Schema.Types.ObjectId, ref: IUserSettingsModel.name }
});

userSchema.method("getSettings", IUserModel.getSettings);

userSchema.pre("save", function (next) {
    if (!this.createdAt) {
        this.createdAt = new Date();
    }
    next();
});