import { MessageHandler } from "./MessageHandler";

export class EventHandler extends MessageHandler {
    static readonly instance = new EventHandler();

    private handleSubscribeEvent(request: any, response: any): Promise<void> {
        response.xml.MsgType = "text";
        response.xml.Content = "Hi！\n虽然说不上来以后会变成什么样子，但我现在可以帮你查询和弦。\n随便回复一个什么和弦名试试看，比如……C！";
        return;
    }

    private handleUnsubscribeEvent(request: any, response: any): Promise<void> {
        return;
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