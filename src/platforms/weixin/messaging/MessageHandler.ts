import { EventHandler } from "./EventHandler";
import { TextMessageHandler } from "./TextMessageHandler";
import * as xml2js from "xml2js";

export abstract class MessageHandler {
    abstract handle(request: any, response: any): Promise<void>;
}

export namespace MessageHandler {

    const handlers: { [key: string]: MessageHandler } = {
        "text": TextMessageHandler.instance,
        "event": EventHandler.instance
    };

    export async function handle(message: string): Promise<string> {

        try {

            const request = await new Promise<any>((resolve, reject) => {
                xml2js.parseString(message, (err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(result);
                });
            });

            const response: any = {
                xml: {
                    ToUserName: request.xml.FromUserName,
                    FromUserName: request.xml.ToUserName,
                    CreateTime: request.xml.CreateTime,
                }
            };

            const messageType = request.xml.MsgType[0];
            const handler = handlers[messageType];
            if (!handler) {
                console.log(`cannot find handler for message type: ${messageType}`);
                console.log(message);
                return "success";
            }

            try {
                await handler.handle(request, response);
            }
            catch (err) {
                console.log(`failed to handle message: ${err}`);
                console.log(message);
                return "success";
            }

            return new xml2js.Builder({ headless: true }).buildObject(response);
        }
        catch (err) {
            console.log(`failed to parse message: ${err}`);
            console.log(message);
            return "success";
        }
    }
}