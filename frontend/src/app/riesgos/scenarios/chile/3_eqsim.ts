import { FeatureCollection } from "@turf/helpers";
import { StringSelectUserConfigurableProduct, WizardableProduct } from "src/app/components/config_wizard/wizardable_products";
import { WizardableStep } from "src/app/components/config_wizard/wizardable_steps";
import { WmsLayerProduct } from "src/app/components/map/mappable/mappable_products";
import { toDecimalPlaces } from "src/app/helpers/colorhelpers";
import { MappableProductAugmenter, WizardableProductAugmenter, WizardableStepAugmenter } from "src/app/services/augmenter/augmenter.service";
import { RiesgosProduct, RiesgosProductResolved, RiesgosStep } from "../../riesgos.state";



export class GmpeChile implements WizardableProductAugmenter {
    appliesTo(product: RiesgosProduct): boolean {
        return product.id === 'gmpeChile';
    }

    makeProductWizardable(product: RiesgosProduct): StringSelectUserConfigurableProduct[] {
        return [{
            ... product,
            description: {
                options: product.options,
                defaultValue: product.options[0],
                wizardProperties: {
                    fieldtype: 'stringselect',
                    name: 'gmpe',
                    description: ''
                }
            },
        }];
    }
}

export class VsgridChile implements WizardableProductAugmenter {
    appliesTo(product: RiesgosProduct): boolean {
        return product.id === 'vsgridChile';
    }

    makeProductWizardable(product: RiesgosProduct): StringSelectUserConfigurableProduct[] {
        return [{
            ... product,
            description: {
                options: product.options,
                defaultValue: product.options[0],
                wizardProperties: {
                    fieldtype: 'stringselect',
                    name: 'vsgrid',
                    description: '',
                }
            }
        }];
    }
}


export class ShakygroundChile implements WizardableStepAugmenter {
    appliesTo(step: RiesgosStep): boolean {
        return step.step.id === 'EqSimulationChile';
    }

    makeStepWizardable(step: RiesgosStep): WizardableStep {
        return {
            ... step,
            scenario: 'Chile',
            wizardProperties: {
                shape: 'earthquake',
                providerName: 'GFZ',
                providerUrl: 'https://www.gfz-potsdam.de/en/',
                wikiLink: 'EqSimulation',
                dataSources: [{ label: 'Weatherill et al., 2021', href: 'https://dataservices.gfz-potsdam.de/panmetaworks/showshort.php?id=2dd724a7-47a1-11ec-947f-3811b03e280f' }]
            }
        };
    }
}



export class ShakemapWmsChile implements MappableProductAugmenter {
    appliesTo(product: RiesgosProduct): boolean {
        return product.id === 'eqSimWmsChile'
    }

    makeProductMappable(product: RiesgosProductResolved): WmsLayerProduct[] {
        return [{
            ... product,
            description: {
                id: 'Shakyground_wmsChile',
                icon: 'earthquake',
                name: 'shakemap',
                type: 'literal',
                format: 'application/WMS',
                styles: ['shakemap-pga'],
                featureInfoRenderer: (fi: FeatureCollection) => {
                    const html = `
                    <p><b>{{ Ground_acceleration_PGA }}:</b></br>a = ${toDecimalPlaces(fi.features[0].properties['GRAY_INDEX'], 2)} g</p>
                    `;
                    return html;
                },
            },
        }, {
            ... product,
            description: {
                id: 'Shakyground_sa03_wmsChile',
                icon: 'earthquake',
                name: 'SA03_shakemap',
                type: 'literal',
                format: 'application/WMS',
                styles: ['shakemap-pga'],
                featureInfoRenderer: (fi: FeatureCollection) => {
                    const html = `
                    <p><b>{{ Ground_acceleration_SA03 }}:</b></br>a = ${toDecimalPlaces(fi.features[0].properties['GRAY_INDEX'], 2)} g</p>
                    `;
                    return html;
                },
            }
        }, {
            ...product,
            description: {
                id: 'Shakyground_sa10_wmsChile',
                icon: 'earthquake',
                name: 'SA10_shakemap',
                type: 'literal',
                format: 'application/WMS',
                styles: ['shakemap-pga'],
                featureInfoRenderer: (fi: FeatureCollection) => {
                    const html = `
                    <p><b>{{ Ground_acceleration_SA10 }}:</b></br>a = ${toDecimalPlaces(fi.features[0].properties['GRAY_INDEX'], 2)} g</p>
                    `;
                    return html;
                },
            },
        }];
    }

}
