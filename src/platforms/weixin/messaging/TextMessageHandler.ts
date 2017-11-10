import { IUserModel } from "../db/models/IUserModel";
import { Server } from "../../../server";
import { REPL } from "../../../repl/repl";
import { IMessageHandler } from "./MessageHandler";

export class TextMessageHandler implements IMessageHandler {
    static readonly instance = new TextMessageHandler();
    public async handle(request: any, response: any): Promise<void> {
        const message = request.xml.Content[0];

        const user = await IUserModel.getOrSubscribe(request.xml.FromUserName);

        const replResult = await REPL.process(message, user, await user.getSettings());

        if (!replResult) {
            throw "REPL process failed";
        }

        replResult.fillResponse(response.xml);
        return;
    }
}