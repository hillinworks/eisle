import { IUserSettings } from "./IUserSettings";
export interface IUser {
    weixinId: string;
    isSubscribed: boolean;
    createdAt: Date,
    subscribeTime?: Date;
    unsubscribeTime?: Date;
    lastSeen?: Date;
    settings?: IUserSettings;
}