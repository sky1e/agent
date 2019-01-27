import { assertEnum } from '../../assert';
import { UhkBuffer } from '../../uhk-buffer';
import { KeyAction, KeyActionId, keyActionType } from './key-action';

export enum LayerName {
    mod,
    fn,
    mouse,
}

export enum SwitchLayerMode {
    holdAndDoubleTapToggle = 'holdAndDoubleTapToggle',
    toggle = 'toggle',
    hold = 'hold',
}

export const mapSwitchLayerModeToNumber = (switchLayerMode: SwitchLayerMode): number => {
    switch (switchLayerMode) {
        case SwitchLayerMode.holdAndDoubleTapToggle:
            return 0;

        case SwitchLayerMode.toggle:
            return 1;

        case SwitchLayerMode.hold:
            return 2;

        default:
            throw new Error(`Can not map ${switchLayerMode} to number`);
    }
};

export const mapNumberToSwitchLayerMode = (value: number): SwitchLayerMode => {
    switch (value) {
        case 0:
            return SwitchLayerMode.holdAndDoubleTapToggle;

        case 1:
            return SwitchLayerMode.toggle;

        case 2:
            return SwitchLayerMode.hold;

        default:
            throw new Error(`Can not map "${value}" to SwitchLayerMode`);
    }
};

export class SwitchLayerAction extends KeyAction {
    @assertEnum(SwitchLayerMode)
    switchLayerMode: SwitchLayerMode;

    @assertEnum(LayerName)
    layer: LayerName;

    constructor(other?: SwitchLayerAction) {
        super();
        if (!other) {
            return;
        }
        this.switchLayerMode = other.switchLayerMode;
        this.layer = other.layer;
    }

    fromJsonObject(jsonObject: any): SwitchLayerAction {
        this.assertKeyActionType(jsonObject);
        this.layer = LayerName[<string>jsonObject.layer];

        // Backward compatibility when "switchLayerMode" was a boolean type as "toggle"
        if (typeof jsonObject.toggle === 'boolean') {
            this.switchLayerMode = jsonObject.toggle ? SwitchLayerMode.toggle : SwitchLayerMode.holdAndDoubleTapToggle;
        } else {
            this.switchLayerMode = jsonObject.switchLayerMode;
        }

        return this;
    }

    fromBinary(buffer: UhkBuffer): SwitchLayerAction {
        this.readAndAssertKeyActionId(buffer);
        this.layer = buffer.readUInt8();
        this.switchLayerMode = mapNumberToSwitchLayerMode(buffer.readUInt8());
        return this;
    }

    toJsonObject(): any {
        return {
            keyActionType: keyActionType.SwitchLayerAction,
            layer: LayerName[this.layer],
            switchLayerMode: this.switchLayerMode,
        };
    }

    toBinary(buffer: UhkBuffer) {
        buffer.writeUInt8(KeyActionId.SwitchLayerAction);
        buffer.writeUInt8(this.layer);
        buffer.writeUInt8(mapSwitchLayerModeToNumber(this.switchLayerMode));
    }

    toString(): string {
        return `<SwitchLayerAction layer="${this.layer}" switchLayerMode="${this.switchLayerMode}">`;
    }

    public getName(): string {
        return 'SwitchLayerAction';
    }
}
