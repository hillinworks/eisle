import { REPL } from "../../../repl/repl";
import { IMessageHandler } from "./MessageHandler";

export class TextMessageHandler implements IMessageHandler {
    static readonly instance = new TextMessageHandler();
    public handle(request: any, response: any): Promise<void> {
        const message = request.xml.Content[0];
        const replResult = REPL.process(message);

        if (!replResult) {
            throw "REPL process failed";
        }

        replResult.fillResponse(response.xml);
        return;
    }
}