import { SmartHub, HomeBridge } from './smartHub';
import HAPNodeJS from './hap-nodejs';
import Timeout = NodeJS.Timeout;
import {EventEmitter} from "events";

export type ServiceCharacteristic = {
    type: HAPNodeJS.Characteristic,
    props?: Partial<HAPNodeJS.CharacteristicProps>,
    get?: (data: any) => any,
    set?: (value: any) => any
}

export interface SmartDeviceService {
    name: string,
    type: HAPNodeJS.Service,
    characteristics: ServiceCharacteristic[],
}

interface DeviceConfig<D> {
    uid: string;
    vid: string;
    pid: string;
    sno: string;
    model: string;
    active: boolean;
    data?: D;
    config?: object;
}

export class SmartDevice<D> extends EventEmitter {
    uid: string;
    smartHub: SmartHub;
    homebridge: HomeBridge;
    model: string;
    name: string; // device display name
    connection: WebSocket; // device websocket connection
    registered: boolean;
    connected: boolean;
    accessory: HAPNodeJS.Accessory; // HomeKit accessory
    services: SmartDeviceService[]; // list of HomeKit services
    data: D; // all device returning data
    dweetUrl: string;
    updateInterval: Timeout;
    pingInterval: Timeout;
    constructor(uid: string, smartHub: SmartHub, config: DeviceConfig<D>);
    load(): void;
    sendMessage(data: object): void;
    receiveMessage(message: object): void;
    connect(connection: WebSocket): void;
    setData(data: D): void;
    dweetData(data: D): void;
    processMessage(message: object): void;
    disconnect(): void;
    unload(): void;
    deviceWillLoad(): void;
    deviceDidLoad(): void;
    deviceWillConnect(): void;
    deviceDidConnect(): void;
    deviceWillSetData(newData: D): void;
    deviceDidSetData(prevData: D): void;
    deviceWillDisconnect(): void;
    deviceDidDisconnect(): void;
    deviceWillUnload(): void;
    deviceDidUnload(): void;
    getData(): Promise<D>;
    identify(paired: boolean): Promise<boolean>;
    sendData(data: D): void;
    onGetSignal(signal: object): void;
    sendSignal(signal: object): void;
    createAccessory(): HAPNodeJS.Accessory
    attachServiceCharacteristics(accessory: HAPNodeJS.Accessory): void;
    attachSensorsData(): void;
    attachSensorData(service: SmartDeviceService): void;
    notifyChanges(): void;
    enableUpdates(): void;
    disableUpdates(): void;
}
