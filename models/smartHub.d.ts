import HAPNodeJS from "./hap-nodejs";
import {EventEmitter} from "events";
import SmartDevice from "./smartDevice";
import {Registry} from "prom-client";
import {MqttClient} from "mqtt";

export type DBDevice = any;

export interface HomeBridge {
    platformAccessory: HAPNodeJS.Accessory,
    hap: HAPNodeJS.HAPNodeJS
}

export class SmartHub extends EventEmitter {
    constructor(homebridge: HomeBridge, platformRegistry: Registry, mqttClient: MqttClient, log: Console);
    on(event: 'newDevice', listener: (device: SmartDevice<any>) => void): this;
    on(event: 'removeDevice', listener: (device: SmartDevice<any>) => void): this;
    registerDevice(dbDevice: DBDevice): void;
    unregisterDevice(uid: string): void;
    getRegisteredDevices(): SmartDevice<any>[];
    getDevice(uid: string): Promise<SmartDevice<any>>;
    connectDevice(connection: WebSocket, vendorData: { vid: string, pid: string, sno: string }): void;
    getDeviceInstance(uid: string): SmartDevice<any>;
}
