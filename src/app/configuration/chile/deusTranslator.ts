import { CustomProcess, ProcessStateUnavailable, Product, WatchingProcess } from 'src/app/wps/wps.datatypes';
import { fragilityRef } from './modelProp';
import { shakemapRefOutput } from './shakyground';
import { exposureRef } from './assetmaster';

/**
 * The Process 'DeusTranslator' serves as a helper: Deus expects it's inputs to have other ids than what the inputs really have.
 */


export const fragilityRefDeusInput = {
    ...fragilityRef,
    description: {
        ...fragilityRef.description,
        id: 'fragility'
    },
    uid: 'deusTranslator_fragility'
};

export const shakemapRefDeusInput = {
    ...shakemapRefOutput,
    description: {
        ...shakemapRefOutput.description,
        id: 'intensity'
    },
    uid: 'deusTranslator_intensity'
};

export const exposureRefDeusInput = {
    ...exposureRef,
    description: {
        ...exposureRef.description,
        id: 'exposure'
    },
    uid: 'deusTranslator_exposure'
};


export const DeusTranslator: WatchingProcess = {
    id: 'DeusTranslator',
    name: 'DeusTranslator',
    requiredProducts: [fragilityRef, shakemapRefOutput, exposureRef].map(p => p.uid),
    providedProducts: [fragilityRefDeusInput, shakemapRefDeusInput, exposureRefDeusInput].map(p => p.uid),
    state: new ProcessStateUnavailable(),
    onProductAdded: (newProduct: Product, allProducts: Product[]): Product[] => {
        switch (newProduct.uid) {
            case fragilityRef.uid:
                console.log(`DeusTranslator adding value for ${newProduct.uid}...`);
                return [{
                    ...fragilityRefDeusInput,
                    value: newProduct.value
                }];
            case shakemapRefOutput.uid:
                console.log(`DeusTranslator adding value for ${newProduct.uid}...`);
                return [{
                    ...shakemapRefDeusInput,
                    value: newProduct.value
                }];
            case exposureRef.uid:
                console.log(`DeusTranslator adding value for ${newProduct.uid}...`);
                return [{
                    ...exposureRefDeusInput,
                    value: newProduct.value
                }];
            default:
                return [];
        }
    }
};
