import { WatchingProcess, Product, WpsProcess, ProcessStateTypes, ProcessStateUnavailable } from '../../wps/wps.datatypes';
import { WizardableProcess } from 'src/app/components/config_wizard/wizardable_processes';
import { UserconfigurableWpsData } from 'src/app/components/config_wizard/userconfigurable_wpsdata';
import { WpsData } from 'projects/services-wps/src/public-api';
import { VectorLayerData, WmsLayerData } from 'src/app/components/map/mappable_wpsdata';




export const shakemapOutput: WpsData & WmsLayerData = {
    description: {
        id: 'shakeMapFile',
        name: 'shakemap',
        type: 'complex',
        reference: false,
        format: 'application/WMS',
    },
    value: null
};




export const EqGroundMotion: WizardableProcess & WpsProcess = {

    state: new ProcessStateUnavailable(),

    id: 'org.n52.gfz.riesgos.algorithm.impl.ShakygroundProcess',

    url: 'http://rz-vm140.gfz-potsdam.de/wps/WebProcessingService',

    name: 'Groundmotion Simulation',

    description: 'Simulates the ground motion caused by a given eathquakes parameters',

    requiredProducts: ['quakeMLFile'],

    providedProduct: 'shakeMapFile',

    wpsVersion: '1.0.0',

    wizardProperties: {
        shape: 'earthquake',
        providerName: 'Helmholtz Centre Potsdam German Research Centre for Geosciences',
        providerUrl: 'https://www.gfz-potsdam.de/en/'
    },

};