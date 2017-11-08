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

userSchema.method("getSettings", async function (this: IUserModel): Promise<IUserSettingsModel> {
    if (!this.populated("settings")) {
        await this.populate("settings").execPopulate();
    }

    if (!this.settings) {
        this.settings = await IUserSettingsModel.create();
        this.save();
    }

    return this.settings as IUserSettingsModel;
});

userSchema.pre("save", function (next) {
    if (!this.createdAt) {
        this.createdAt = new Date();
    }
    next();
});