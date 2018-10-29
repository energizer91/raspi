import { SmartHub, HomeBridge } from './smartHub';
import HAPNodeJS from './hap-nodejs';
import Timeout = NodeJS.Timeout;

export interface SmartDeviceService<D> {
    name: string,
    type: HAPNodeJS.Service,
    characteristic: HAPNodeJS.Characteristic,
    props?: object,
    get?: (data: D) => any,
    set?: (value: any) => D
}

export interface SmartDevice<D> {
    uid: string;
    smartHub: SmartHub;
    homebridge: HomeBridge;
    model: string;
    name: string; // device display name
    connection: WebSocket; // device websocket connection
    registered: boolean;
    connected: boolean;
    accessory: HAPNodeJS.Accessory; // HomeKit accessory
    services: SmartDeviceService<D>[]; // list of HomeKit services
    data: D; // all device returning data
    dweetUrl: string;
    updateInterval: Timeout;
    constructor(uid: string, smartHub: SmartHub, sno: string): void;
    constructor(uid: string, smartHub: SmartHub, data: D, config: object, sno: string): void;
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
    attachSensorData(service: SmartDeviceService<D>): void;
    notifyChanges(): void;
    enableUpdates(): void;
    disableUpdates(): void;
}
