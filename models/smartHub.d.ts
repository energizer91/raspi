import HAPNodeJS from "./hap-nodejs";
import {EventEmitter} from "events";
import {SmartDevice} from "./smartDevice";

export type DBDevice = any;

export interface HomeBridge {
    platformAccessory: HAPNodeJS.Accessory,
    hap: HAPNodeJS.HAPNodeJS
}

export interface SmartHub extends EventEmitter {
    constructor(homebridge: HomeBridge);
    registerDevice(dbDevice: DBDevice): void;
    unregisterDevice(uid: string): void;
    getRegisteredDevices(): SmartDevice<any>[];
    getDevice(uid: string): Promise<SmartDevice<any>>;
    connectDevice(connection: WebSocket, vendorData: { vid: string, pid: string, sno: string }): void;
    getDeviceInstance(uid: string): SmartDevice<any>;
}
