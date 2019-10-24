import { WpsProcess, ProcessStateUnavailable, AutorunningProcess, Product, ExecutableProcess, ProcessState } from '../../wps/wps.datatypes';
import { WizardableProcess } from 'src/app/components/config_wizard/wizardable_processes';
import { WpsData } from 'projects/services-wps/src/public-api';
import { Observable, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { selectedEqPeru } from './eqselection';



export const latPeru: WpsData & Product = {
    uid: 'auto_lat_peru',
    description: {
        id: 'lat',
        reference: false,
        type: 'literal',
    },
    value: null
};

export const lonPeru: WpsData & Product = {
    uid: 'auto_lon_peru',
    description: {
        id: 'lon',
        reference: false,
        type: 'literal',
    },
    value: null
};

export const magPeru: WpsData & Product = {
    uid: 'auto_mag_peru',
    description: {
        id: 'mag',
        reference: false,
        type: 'literal',
    },
    value: null
};


export const tsWmsPeru: WpsData & Product = {
    uid: 'get_scenario_epiCenter_peru',
    description: {
        id: 'epiCenter',
        reference: false,
        format: 'application/WMS',
        type: 'literal',
    },
    value: null
};


export const TsServiceTranslatorPeru: AutorunningProcess = {
    uid: 'TS_service_translator_peru',
    name: 'TS_service_translator',
    requiredProducts: [selectedEqPeru.uid],
    providedProducts: [latPeru, lonPeru, magPeru].map(p => p.uid),
    state: new ProcessStateUnavailable(),
    onProductAdded: (newProduct: Product, allProducts: Product[]): Product[] => {
        let outprods: Product[] = [];
        if (newProduct.uid === selectedEqPeru.uid) {
            const newProds = [{
                ... lonPeru,
                value: newProduct.value[0].features[0].geometry.coordinates[0]
            }, {
                ...latPeru,
                value: newProduct.value[0].features[0].geometry.coordinates[1]
            }, {
                ...magPeru,
                value: newProduct.value[0].features[0].properties['magnitude.mag.value']
            }];
            outprods = outprods.concat(newProds);
        }
        return outprods;
    }
};



export class TsWmsServicePeru extends WpsProcess {

    constructor(http: HttpClient) {
        super(
            'get_scenario_peru',
            'Earthquake/tsunami interaction',
            [latPeru, lonPeru, magPeru].map(p => p.uid),
            [tsWmsPeru.uid],
            'get_scenario',
            'Relates a tsunami to a given earthquake',
            'http://tsunami-wps.awi.de/wps',
            '1.0.0',
            http,
            new ProcessStateUnavailable(),
        );
    }

}


export const tsShakemapPeru: WpsData & Product = {
    uid: 'ts_shakemap_peru',
    description: {
        id: 'tsunamap',
        reference: true,
        type: 'complex',
        format: 'application/xml'
    },
    value: null
};


export class TsShakemapServicePeru extends WpsProcess {
    constructor(http: HttpClient) {
        super(
            'get_tsunamap_peru',
            'get_tsunamap',
            [latPeru, lonPeru, magPeru].map(p => p.uid),
            [tsShakemapPeru.uid],
            'get_tsunamap',
            'Input is earthquake epicenter (lon,lat) with magnitude, output is the nearest Tsunami epicenter and Inundation in shakemap format',
            'http://tsunami-wps.awi.de/wps',
            '1.0.0',
            http,
            new ProcessStateUnavailable(),
        );
    }
}

export class TsServicePeru implements WizardableProcess, ExecutableProcess {

    uid = 'ts-service_peru';
    name = 'TS-Service';
    state: ProcessState;
    description = 'Simulates a tsunami based on the earlier selected earthquake-parameters.';

    wizardProperties = {
        providerName: 'Alfred Wegener Institute',
        providerUrl: 'https://www.awi.de/en/',
        shape: 'tsunami' as 'tsunami'
    };

    private tsShakemapService: TsShakemapServicePeru;
    private tsWmsService: TsWmsServicePeru;
    readonly requiredProducts: string[];
    readonly providedProducts: string[];

    constructor(private httpClient: HttpClient) {
        this.state = new ProcessStateUnavailable();
        this.tsWmsService = new TsWmsServicePeru(httpClient);
        this.tsShakemapService = new TsShakemapServicePeru(httpClient);
        this.requiredProducts = this.tsWmsService.requiredProducts.concat(this.tsShakemapService.requiredProducts);
        this.providedProducts = this.tsWmsService.providedProducts.concat(this.tsShakemapService.providedProducts);
    }

    execute = (inputs: Product[], outputs: Product[], doWhileExecuting): Observable<Product[]> => {

        const inputsWms = inputs.filter(i => this.tsWmsService.requiredProducts.includes(i.uid));
        const outputsWms = outputs.filter(i => this.tsWmsService.providedProducts.includes(i.uid));
        const inputsShkmp = inputs.filter(i => this.tsShakemapService.requiredProducts.includes(i.uid));
        const outputsShkmp = outputs.filter(i => this.tsShakemapService.providedProducts.includes(i.uid));

        const proc1$ = this.tsWmsService.execute(inputsWms, outputsWms, doWhileExecuting);
        // const proc2$ = this.tsShakemapService.execute(inputsShkmp, outputsShkmp, doWhileExecuting);

        return proc1$;

        // return forkJoin(proc1$, proc2$).pipe(
        //     map((results: Product[][]) => {
        //         const flattened: Product[] = [];
        //         for (const result of results) {
        //             for (const data of result) {
        //                 flattened.push(data);
        //             }
        //         }
        //         return flattened;
        //     })
        // );
    }

}