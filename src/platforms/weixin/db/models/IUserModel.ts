import { IUserSettingsModel } from "./IUserSettingsModel";
import { Server } from "../../../../server";
import { Document } from "mongoose";
import { IUser } from "../interfaces/IUser";

export interface IUserModel extends IUser, Document {
    getSettings(): Promise<IUserSettingsModel>;
}

export namespace IUserModel {
    export const name = "User";

    export async function subscribe(weixinId: string, checkForExistedUsers = true): Promise<IUserModel> {
        const now = Date.now();
        const user: IUser = {
            weixinId: weixinId,
            isSubscribed: true,
            createdAt: now,
            subscribeTime: now,
            lastSeen: now,
            unsubscribeTime: undefined
        };

        if (checkForExistedUsers) {
            const users = await Server.current.model.User.find({ weixinId: weixinId }).exec();
            if (users.length > 0) {
                console.log(`returned weixin user subscribing: '${weixinId}'`);
                await users[0].update(user).exec();
                console.log(`weixin user subscribed: '${weixinId}'`);
                return users[0];
            }
        }

        console.log(`new weixin user subscribing: '${weixinId}'`);
        const userModel = await new Server.current.model.User(user).save();
        console.log(`weixin user created and subscribed: '${weixinId}'`);
        return userModel;
    }


    export async function getOrSubscribe(weixinId: string): Promise<IUserModel> {
        const users = await Server.current.model.User.find({ weixinId: weixinId }).exec();
        if (users.length > 0) {
            return users[0];
        }

        return await subscribe(weixinId, false);
    }

    export async function unsubscribe(weixinId: string): Promise<void> {
        const now = Date.now();

        await Server.current.model.User.findOneAndUpdate(
            { weixinId: weixinId },
            { "$set": { isSubscribed: false, unsubscribeTime: now, lastSeen: now } }).exec();

        console.log(`weixin user unsubscribed: '${weixinId}'`);
    }

    export async function getSettings(this: IUserModel): Promise<IUserSettingsModel> {
        if (!this.populated("settings")) {
            await this.populate("settings").execPopulate();
        }

        if (!this.settings) {
            this.settings = await IUserSettingsModel.create();
            this.save();
        }

        return this.settings as IUserSettingsModel;
    }
}