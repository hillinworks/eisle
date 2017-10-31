import { Scanner } from "../music-core/Parsing/Scanner";
import { IREPLResult, REPLTextResult } from "./REPLResult";
import { ICommandProcessor } from "./ICommandProcessor";
import { GuitarChord } from "./CommandProcessors/GuitarChord";

export class REPL {

    private static readonly commandProcessors: { [command: string]: ICommandProcessor }
    = {
        "gc": GuitarChord.Instance,
        "guitar-chord": GuitarChord.Instance,
        "jthx": GuitarChord.Instance,
        "吉他和弦": GuitarChord.Instance,
    };

    public static process(input: string): IREPLResult {
        const scanner = new Scanner(input);
        const command = scanner.readPattern("[\\w-]+");
        if (!command) {
            console.log(`Unknown command '${input}'`);
            return REPL.showHelp();
        }

        const processor = REPL.commandProcessors[command.toLowerCase()];
        if (!processor) {
            console.log(`Unknown command '${input}'`);
            return REPL.showHelp();
        }

        console.log(`Using processor ${processor.name} to process '${input}'`);

        scanner.skipWhitespaces();

        return processor.process(scanner);
    }

    public static showHelp(): IREPLResult {
        return new REPLTextResult(
            "试试看以下命令：\n"
            + "\tgc Fmaj7\n"
            + "\t吉他和弦 Dsus2 DropD\n"
            + "\n回复help或者“帮助”查看所有命令");
    }
}