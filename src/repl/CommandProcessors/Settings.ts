import { IUser } from "../../platforms/weixin/db/interfaces/IUser";
import { Server } from "../../server";
import { IREPLResult, REPLArticlesResult } from "../REPLResult";
import { IUserSettings } from "../../platforms/weixin/db/interfaces/IUserSettings";
import { Scanner } from "../../music-core/Parsing/Scanner";
import { ICommandProcessor } from "../ICommandProcessor";
import { Weixin } from "../../platforms/weixin/Weixin";
export class Settings implements ICommandProcessor {
    public static readonly Instance = new Settings();
    public readonly name: string = "Settings";

    public async process(scanner: Scanner, user: IUser, userSettings: IUserSettings): Promise<IREPLResult> {
        const epoch = Date.now().toString();
        const token = Weixin.encode(epoch, user.weixinId);
        return new REPLArticlesResult({
            title: "设置",
            description: "点击打开设置页面",
            picUrl: `${Server.host}/images/settings-title.png`,
            url: `${Server.host}/wx/settings?epoch=${epoch}&wxid=${user.weixinId}&token=${token}`,
        });
    }
}