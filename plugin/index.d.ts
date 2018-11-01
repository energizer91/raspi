import HAPNodeJS from "../models/hap-nodejs";

export type ConfigurationRequestHandler = (context: any, request: any, callback: () => void) => void;

export interface HomeBridgeAPI {
    version: string;
    registerAccessory(pluginName: string, platformName: string, constructor: HAPNodeJS.Accessory, configurationRequestHandler: ConfigurationRequestHandler)
    registerPlatform(pluginName: string, platformName: string, constructor: SmartHubPlatform, dynamic: boolean): void;
    registerPlatformAccessories(pluginName: string, platformName: string, accessories: HAPNodeJS.Accessory[]): void;
    updatePlatformAccessories(accessories: HAPNodeJS.Accessory[]): void;
    unregisterPlatformAccessories(pluginName: string, platformName: string, accessories: HAPNodeJS.Accessory[]): void;
}

export interface SmartHubPlatform {
    constructor(log: Console, config: object, api: HomeBridgeAPI): void;
    configureAccessory(accessory: HAPNodeJS.Accessory): void;
    configurationRequestHandler: ConfigurationRequestHandler;
}
