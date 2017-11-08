import { REPL } from "../../../repl/repl";
import { MessageHandler } from "./MessageHandler";
export class TextMessageHandler extends MessageHandler {
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