import { IUserSettings } from "./IUserSettings";
export interface IUser {
    weixinId: string;
    isSubscribed: boolean;
    createdAt: number;
    subscribeTime?: number;
    unsubscribeTime?: number;
    lastSeen?: number;
    settings?: IUserSettings;
}