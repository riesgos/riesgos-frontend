import { WizardableProcess } from 'src/app/components/config_wizard/wizardable_processes';
import { WpsProcess, ProcessStateUnavailable, Product } from 'src/app/wps/wps.datatypes';
import { WpsData } from 'projects/services-wps/src/public-api';
import { StringSelectUconfProduct, StringUconfProduct } from 'src/app/components/config_wizard/userconfigurable_wpsdata';
import { schema } from './assetmaster';



export const assetcategory: StringSelectUconfProduct & WpsData = {
    uid: 'user_assetcategory',
    description: {
        id: 'assetcategory',
        sourceProcessId: 'user',
        options: ['buildings'],
        defaultValue: 'buildings',
        reference: false,
        type: 'literal',
        wizardProperties: {
            fieldtype: 'stringselect',
            name: 'assetcategory'
        }
    },
    value: null
};

export const losscategory: StringSelectUconfProduct & WpsData = {
    uid: 'user_losscategory',
    description: {
        id: 'losscategory',
        sourceProcessId: 'user',
        options: ['structural'],
        defaultValue: 'structural',
        reference: false,
        type: 'literal',
        wizardProperties: {
            fieldtype: 'stringselect',
            name: 'losscategory'
        }
    },
    value: null
};

export const taxonomies: StringUconfProduct & WpsData = {
    uid: 'user_taxonomies',
    description: {
        id: 'taxonomies',
        sourceProcessId: 'user',
        reference: false,
        type: 'literal',
        defaultValue: '',
        wizardProperties: {
            fieldtype: 'string',
            name: 'taxonomies'
        }
    },
    value: null
};


export const buildingAndDamageClasses: WpsData & Product = {
    uid: 'org.n52.gfz.riesgos.algorithm.impl.ModelpropProcess_selectedRows',
    description: {
      id: 'selectedRows',
      sourceProcessId: 'org.n52.gfz.riesgos.algorithm.impl.ModelpropProcess',
      type: 'complex',
      reference: false,
      format: 'application/json'
    },
    value: null
  };


export const VulnerabilityModel: WizardableProcess & WpsProcess = {
    id: 'org.n52.gfz.riesgos.algorithm.impl.ModelpropProcess',
    url: 'http://rz-vm140.gfz-potsdam.de/wps/WebProcessingService',
    wpsVersion: '1.0.0',
    name: 'EQ Vulnerability Model',
    description: '',
    requiredProducts: [schema, assetcategory, losscategory, taxonomies].map(p => p.uid),
    providedProducts: [buildingAndDamageClasses.uid],
    wizardProperties: {
        shape: 'earthquake',
        providerName: 'Helmholtz Centre Potsdam German Research Centre for Geosciences',
        providerUrl: 'https://www.gfz-potsdam.de/en/'
    },
    state: new ProcessStateUnavailable()
};
