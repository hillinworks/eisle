import { InstrumentInfo, Instruments } from "../../../eisle-core/chord/Instruments";
import { IUserModel } from "../db/models/IUserModel";
export interface ISettingsViewModel {
    selectedInstrument: string;
    instrumentGroups: { [key: string]: InstrumentInfo[] };
}

export interface IUpdateData {
    instrument: string;
}

export namespace Settings {
    export async function createViewModel(weixinId: string): Promise<ISettingsViewModel> {
        const user = await IUserModel.getOrSubscribe(weixinId);
        const settings = await user.getSettings();
        return {
            selectedInstrument: settings.instrument,
            instrumentGroups: Instruments.groups
        };
    }

    export async function save(weixinId: string, content: IUpdateData): Promise<void> {
        const user = await IUserModel.getOrSubscribe(weixinId);
        const settings = await user.getSettings();
        settings.instrument = content.instrument;
        await settings.save();
    }
}