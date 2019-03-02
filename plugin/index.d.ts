import HAPNodeJS from "../models/hap-nodejs";

type ConfigurationRequestHandler = (context: any, request: any, callback: () => void) => void;

declare class HomeBridgeAPI {
    version: string;
    registerAccessory(pluginName: string, platformName: string, constructor: HAPNodeJS.Accessory, configurationRequestHandler: ConfigurationRequestHandler): void;
    registerPlatform(pluginName: string, platformName: string, constructor: SmartHubPlatform, dynamic: boolean): void;
    registerPlatformAccessories(pluginName: string, platformName: string, accessories: HAPNodeJS.Accessory[]): void;
    updatePlatformAccessories(accessories: HAPNodeJS.Accessory[]): void;
    unregisterPlatformAccessories(pluginName: string, platformName: string, accessories: HAPNodeJS.Accessory[]): void;
}

declare class SmartHubPlatform {
    static package: string;
    constructor(log: Console, config: object, api: HomeBridgeAPI);
    configureAccessory(accessory: HAPNodeJS.Accessory): void;
    configurationRequestHandler: ConfigurationRequestHandler;
}

declare function homeBridgeConstructor(homebridge: HomeBridgeAPI): void;

export = homeBridgeConstructor;
