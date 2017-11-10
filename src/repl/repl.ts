import { Settings } from "./CommandProcessors/Settings";
import { IUserSettings } from "../platforms/weixin/db/interfaces/IUserSettings";
import { Scanner } from "../music-core/Parsing/Scanner";
import { IREPLResult, REPLTextResult } from "./REPLResult";
import { ICommandProcessor } from "./ICommandProcessor";
import { GuitarChord } from "./CommandProcessors/GuitarChord";
import { IUser } from "../platforms/weixin/db/interfaces/IUser";

export namespace REPL {

    const commandProcessors: { [command: string]: ICommandProcessor }
        = {
            "gc": GuitarChord.Instance,
            "guitar-chord": GuitarChord.Instance,
            "jthx": GuitarChord.Instance,
            "吉他和弦": GuitarChord.Instance,
            "settings": Settings.Instance,
            "设置": Settings.Instance
        };

    export function process(input: string, user: IUser, userSettings: IUserSettings): Promise<IREPLResult> {
        const scanner = new Scanner(input);
        const command = scanner.readPattern("[\\w-]+");
        if (!command) {
            return processDefault(input, user, userSettings);
        }

        const processor = commandProcessors[command.toLowerCase()];
        if (!processor) {
            return processDefault(input, user, userSettings);
        }

        console.log(`Using processor ${processor.name} to process '${input}'`);

        scanner.skipWhitespaces();

        return processor.process(scanner, user, userSettings);
    }

    function processDefault(input: string, user: IUser, userSettings: IUserSettings): Promise<IREPLResult> {
        return GuitarChord.Instance.process(new Scanner(input), user, userSettings);
    }

    export function showHelp(): IREPLResult {
        return new REPLTextResult(
            "试试看以下命令：\n"
            + "\tgc Fmaj7\n"
            + "\t吉他和弦 Dsus2 DropD\n"
            + "\n回复help或者“帮助”查看所有命令");
    }
}