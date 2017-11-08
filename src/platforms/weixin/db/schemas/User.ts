import { IUserSettings } from "../interfaces/IUserSettings";
import { Schema } from "mongoose";

export const userSchema = new Schema({
    weixinId: { type: String, index: true, unique: true },
    isSubscribed: { type: Boolean, default: true },
    createdAt: Date,
    subscribeTime: Date,
    unsubscribeTime: Date,
    lastSeen: { type: Date, default: Date.now },
    settings: Schema.Types.ObjectId,
});

userSchema.pre("save", function (next) {
    if (!this.createdAt) {
        this.createdAt = new Date();
    }
    next();
});