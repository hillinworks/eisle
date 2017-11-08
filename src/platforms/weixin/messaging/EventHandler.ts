import { Server } from "../../../server";
import { IUser } from "../db/interfaces/IUser";
import { IMessageHandler } from "./MessageHandler";

export class EventHandler implements IMessageHandler {
    static readonly instance = new EventHandler();

    private async handleSubscribeEvent(request: any, response: any): Promise<void> {
        response.xml.MsgType = "text";
        response.xml.Content = "Hi！\n虽然说不上来以后会变成什么样子，但我现在可以帮你查询和弦。\n随便回复一个什么和弦名试试看，比如……C！";

        const now = Date.now();
        const user: IUser = {
            weixinId: request.xml.FromUserName,
            isSubscribed: true,
            createdAt: now,
            subscribeTime: now,
            lastSeen: now
        };

        try {
            const users = await Server.current.model.User.find({ weixinId: request.xml.FromUserName }).exec();
            if (users.length === 0) {
                console.log(`new weixin user subscribing: '${request.xml.FromUserName}'`);
                await new Server.current.model.User(user).save();
                console.log(`weixin user created and subscribed: '${request.xml.FromUserName}'`);
            } else {
                console.log(`returned weixin user subscribing: '${request.xml.FromUserName}'`);
                await users[0].update(user).exec();
                console.log(`weixin user subscribed: '${request.xml.FromUserName}'`);
            }
        }
        catch (err) {
            console.error(`failed to create weixin user '${request.xml.FromUserName}'`);
            return;
        }

    }

    private async handleUnsubscribeEvent(request: any, response: any): Promise<void> {
        const now = Date.now();

        try {
            await Server.current.model.User.findOneAndUpdate(
                { weixinId: request.xml.FromUserName },
                { "$set": { isSubscribed: false, unsubscribeTime: now, lastSeen: now } }).exec();

            console.log(`weixin user unsubscribed: '${request.xml.FromUserName}'`);
        }
        catch (err) {
            console.error(`failed to unsubscribe weixin user '${request.xml.FromUserName}'`);
            return;
        }
    }

    public handle(request: any, response: any): Promise<void> {
        if (!request.xml.Event) {
            throw "unknown event";
        }

        switch (request.xml.Event[0]) {
            case "subscribe":
                return this.handleSubscribeEvent(request, response);
            case "unsubscribe":
                return this.handleUnsubscribeEvent(request, response);
            default:
                throw `unhandled event '${request.xml.Event[0]}'`;
        }

    }
}