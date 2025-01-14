import { toDecimalPlaces, linInterpolateXY, yellowRedRange } from 'src/app/helpers/colorhelpers';
import { Style as olStyle, Fill as olFill, Stroke as olStroke, Circle as olCircle } from 'ol/style';
import olFeature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import { RiesgosProduct, RiesgosProductResolved, RiesgosStep } from '../../riesgos.state';
import { MappableProductAugmenter, WizardableProductAugmenter, WizardableStepAugmenter } from 'src/app/services/augmenter/augmenter.service';
import { StringSelectUserConfigurableProduct, StringUserConfigurableProduct, WizardableProduct } from 'src/app/components/config_wizard/wizardable_products';
import { VectorLayerProduct } from 'src/app/components/map/mappable/mappable_products';
import { WizardableStep } from 'src/app/components/config_wizard/wizardable_steps';
import { LegendComponent } from 'src/app/components/dynamic/legend/legend.component';
import { regexTransform } from 'src/app/services/simplifiedTranslation/regex-translate.pipe';
import { CircleLegendComponent } from 'src/app/components/dynamic/circle-legend/circle-legend.component';
import { MultiLegendComponent } from 'src/app/components/dynamic/multi-legend/multi-legend.component';






// Input: Catalog type
export class EtypePeru implements WizardableProductAugmenter {
    appliesTo(product: RiesgosProduct): boolean {
        return product.id === 'eqCatalogType';
    }

    makeProductWizardable(product: RiesgosProductResolved): StringSelectUserConfigurableProduct[] {
        return [{
            ... product,
            description: {
                wizardProperties: {
                    name: 'Catalogue type',
                    fieldtype: 'stringselect'
                },
                options: ['observed', 'expert', 'geofon'],
                defaultValue: 'observed'
            },
        }];
    }
};

export class MminPeru implements WizardableProductAugmenter {
    appliesTo(product: RiesgosProduct): boolean {
        return product.id === 'eqMmin';
    }
    makeProductWizardable(product: RiesgosProduct): StringUserConfigurableProduct[] {
        return [{
            ...product,
            description: {
                wizardProperties: {
                    name: 'mmin',
                    fieldtype: 'string'
                },
                defaultValue: '6.0'
            }
        }];
    }
}
export class MmaxPeru implements WizardableProductAugmenter {
    appliesTo(product: RiesgosProduct): boolean {
        return product.id === 'eqMmax';
    }
    makeProductWizardable(product: RiesgosProduct): StringUserConfigurableProduct[] {
        return [{
            ...product,
            description: {
                wizardProperties: {
                    name: 'mmax',
                    fieldtype: 'string'
                },
                defaultValue: '9.0'
            }
        }];
    }
}
export class ZminPeru implements WizardableProductAugmenter {
    appliesTo(product: RiesgosProduct): boolean {
        return product.id === 'eqZmin';
    }
    makeProductWizardable(product: RiesgosProduct): StringUserConfigurableProduct[] {
        return [{
            ...product,
            description: {
                wizardProperties: {
                    name: 'zmin',
                    fieldtype: 'string'
                },
                defaultValue: '0'
            }
        }];
    }
}
export class ZmaxPeru implements WizardableProductAugmenter {
    appliesTo(product: RiesgosProduct): boolean {
        return product.id === 'eqZmax';
    }
    makeProductWizardable(product: RiesgosProduct): StringUserConfigurableProduct[] {
        return [{
            ...product,
            description: {
                wizardProperties: {
                    name: 'zmax',
                    fieldtype: 'string'
                },
                defaultValue: '100'
            }
        }];
    }
}
export class PPeru implements WizardableProductAugmenter {
    appliesTo(product: RiesgosProduct): boolean {
        return product.id === 'eqP';
    }
    makeProductWizardable(product: RiesgosProduct): StringUserConfigurableProduct[] {
        return [{
            ...product,
            description: {
                wizardProperties: {
                    name: 'p',
                    fieldtype: 'string'
                },
                defaultValue: '0.0'
            }
        }];
    }
}


// Output: Available EQs
export class AvailableEqsPeru implements MappableProductAugmenter {
    appliesTo(product: RiesgosProduct) {
        return product.id === 'availableEqs';
    }

    makeProductMappable(product: RiesgosProductResolved): VectorLayerProduct[] {
        return [{
            ... product,
            description: {
                id: 'selectedRows',
                icon: 'earthquake',
                name: 'available earthquakes',
                description: 'CatalogueData',
                format: 'application/vnd.geo+json',
                type: 'complex',
                vectorLayerAttributes: {
                    featureStyle: (feature: olFeature<Geometry>, resolution: number, selected: boolean) => {
        
                        const props = feature.getProperties();
                        const magnitude = props['magnitude.mag.value'];
                        const depth = props['origin.depth.value'];
        
                        let radius = linInterpolateXY(5, 5, 10, 20, magnitude);
                        const [r, g, b] = yellowRedRange(100, 0, depth);
        
                        if (selected) {
                            radius += 4;
                        }
        
                        return new olStyle({
                            image: new olCircle({
                                radius: radius,
                                fill: new olFill({
                                    color: [r, g, b, 0.5]
                                }),
                                stroke: new olStroke({
                                    color: [r, g, b, 1]
                                })
                            })
                        });
                    },
                    detailPopupHtml: (properties) => {
                        let text = `<h3>{{ Popup_title_available_earthquakes }}</h3>`;
                        const selectedProperties = {
                            '{{ Magnitude }}': "Mw " + toDecimalPlaces(properties['magnitude.mag.value'] as number, 1),
                            '{{ Depth }}': toDecimalPlaces(properties['origin.depth.value'] as number, 1) + ' km',
                            Id: regexTransform(properties['origin.publicID']),
                        };
                        if (properties['origin.time.value']) {
                            const date = new Date(Date.parse(properties['origin.time.value']));
                            selectedProperties['{{ Date }}'] = `${date.getDate() + 1}/${date.getMonth() + 1}/${date.getFullYear()}`;
                        }
                        text += '<table class="table"><tbody>';
                        for (const property in selectedProperties) {
                            if (selectedProperties[property]) {
                                const propertyValue = selectedProperties[property];
                                text += `<tr><td>${property}</td> <td>${propertyValue}</td></tr>`;
                            }
                        }
                        text += '</tbody></table>';
                        return text;
                    },
                    dynamicLegend: (value) => ({
                        component: MultiLegendComponent,
                        inputs: {
                            legendComponents: [{
                                component: LegendComponent,
                                inputs: {
                                    title: 'Depth',
                                    entries: [{
                                        text: '0 km',
                                        color: `rgb(${yellowRedRange(100, 0, 0).join(', ')})`,
                                    }, {
                                        text: '30 km',
                                        color: `rgb(${yellowRedRange(100, 0, 30).join(', ')})`,
                                    }, {
                                        text: '60 km',
                                        color: `rgb(${yellowRedRange(100, 0, 60).join(', ')})`,
                                    }, {
                                        text: '100 km',
                                        color: `rgb(${yellowRedRange(100, 0, 100).join(', ')})`,
                                    }],
                                    continuous: true,
                                    height: 100,
                                    width: 150
                                }
                            }, {
                                component: CircleLegendComponent,
                                inputs: {
                                    title: 'Magnitude',
                                    entries: [{
                                        label: 'Mw 6.0',
                                        radius: linInterpolateXY(5, 5, 10, 20, 6.0),
                                    }, {
                                        label: 'Mw 7.0',
                                        radius: linInterpolateXY(5, 5, 10, 20, 7.0),
                                    }, {
                                        label: 'Mw 8.0',
                                        radius: linInterpolateXY(5, 5, 10, 20, 8.0),
                                    }, {
                                        label: 'Mw 9.0',
                                        radius: linInterpolateXY(5, 5, 10, 20, 9.0),
                                    }],
                                    height: 100
                                }
                            }]
                        }
                    })
                }
            }
        }];
    }
}



// Step: EQ-Catalog
export class QuakeLedgerPeru implements WizardableStepAugmenter {
    appliesTo(step: RiesgosStep) {
        return step.step.id === 'Eqs'
    }

    makeStepWizardable(step: RiesgosStep): WizardableStep  {
        return {
            ... step,
            scenario: 'Peru',
            wizardProperties: {
                shape: 'bullseye',
                providerName: 'GFZ',
                providerUrl: 'https://www.gfz-potsdam.de/en/',
                wikiLink: 'EqCatalogue',
                dataSources: [{
                    label: 'Pittore et al., 2021',
                    href: 'https://dataservices.gfz-potsdam.de/panmetaworks/showshort.php?id=bae8fc94-4799-11ec-947f-3811b03e280f'
                }]
            }
        }
    }
}
