import { MapBrowserEvent } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { TileWMS } from 'ol/source';
import { InfoTableComponentComponent } from 'src/app/components/dynamic/info-table-component/info-table-component.component';
import { toDecimalPlaces } from 'src/app/helpers/colorhelpers';
import { TranslatableStringComponent } from 'src/app/components/dynamic/translatable-string/translatable-string.component';
import { createHeaderTableHtml } from 'src/app/helpers/others';
import { EconomicDamagePopupComponent } from 'src/app/components/dynamic/economic-damage-popup/economic-damage-popup.component';
import { MappableProductAugmenter, WizardableStepAugmenter } from 'src/app/services/augmenter/augmenter.service';
import { MappableProduct } from 'src/app/components/map/mappable/mappable_products';
import { RiesgosProduct, RiesgosProductResolved, RiesgosStep } from '../../riesgos.state';
import { DamagePopupComponent } from 'src/app/components/dynamic/damage-popup/damage-popup.component';
import { MapOlService } from '@dlr-eoc/map-ol';
import { LayersService } from '@dlr-eoc/services-layers';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { filter, map, shareReplay, switchMap, take } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';
import { WizardableStep } from 'src/app/components/config_wizard/wizardable_steps';
import { LayerMarshaller } from 'src/app/components/map/mappable/layer_marshaller';
import { ProductLayer, ProductRasterLayer } from 'src/app/components/map/mappable/map.types';
import { DataService } from 'src/app/services/data/data.service';
import { getProduct } from '../../riesgos.selectors';
import { TranslatedImageComponent } from 'src/app/components/dynamic/translated-image/translated-image.component';



export class EqDamageWmsChile implements MappableProductAugmenter {

    private metadata$ = this.store.select(getProduct('eqDamageSummaryChile')).pipe(
        shareReplay(),
        switchMap(p => {
            if (p) {
                if (p.reference) return this.resolver.resolveReference(p);
                return of(p);
            }
            return of(undefined);
        }),
        filter(value => value !== undefined && value.value)
    );

    constructor(private store: Store, private resolver: DataService) {}

    appliesTo(product: RiesgosProduct): boolean {
        return product.id === 'eqDamageWmsChile';
    }

    makeProductMappable(product: RiesgosProductResolved): MappableProduct[] {
        
        return [{
            ... product,
            toUkisLayers: (ownValue: any, mapSvc: MapOlService, layerSvc: LayersService, http: HttpClient, store: Store, layerMarshaller: LayerMarshaller) => {

                const layers$ = layerMarshaller.makeWmsLayers({
                    id: product.id,
                    value: product.value,
                    reference: product.reference,
                    description: {
                        id: 'shapefile_summary',
                        name: 'shapefile_summary',
                        type: 'literal',
                        format: 'application/WMS',
                    },
                });

                return combineLatest([layers$, this.metadata$.pipe(take(1))]).pipe(
                // return layers$.pipe(
                    // withLatestFrom(this.metadata$),
                    map(([layers, metaData]) => {
                        const metaDataValue = metaData.value;
                        if (!metaDataValue) {
                            console.error(`No metadata for eq-damage`);
                            // return [];
                        }

                        const econLayer: ProductLayer = layers[0];
                        const damageLayer: ProductLayer = new ProductRasterLayer({ ... econLayer });
        
                        econLayer.id += '_economic';
                        econLayer.name = 'eq-economic-loss-title';
                        econLayer.icon = 'dot-circle';
                        econLayer.params.STYLES = 'style-cum-loss-chile-plasma';
                        const baseLegendEcon = econLayer.legendImg;
                        econLayer.legendImg = {
                            component: TranslatedImageComponent,
                            inputs: {
                                languageImageMap: {
                                    'EN': baseLegendEcon + '&style=style-cum-loss-chile-plasma&language=en',
                                    'ES': baseLegendEcon + '&style=style-cum-loss-chile-plasma',
                                }
                            }
                        };
                        const totalDamage = +(metaDataValue?.total?.loss_value) || 0.0;
                        const totalDamageFormatted = toDecimalPlaces(totalDamage / 1000000, 2) + ' MUSD';
                        econLayer.dynamicDescription = {
                            component: InfoTableComponentComponent,
                            inputs: {
                                // title: 'Total damage',
                                data: [[{value: 'Loss'}, {value: totalDamageFormatted}]],
                                bottomText: `{{ loss_calculated_from }} <a href="./#/documentation#ExposureAndVulnerability" target="_blank">{{ replacement_costs }}</a>`
                            }
                        }
                        // @TODO: this is problematic - sometimes no metadata value has arrived yet
                        if (metaDataValue) {  
                            econLayer.popup = {
                                dynamicPopup: {
                                    component: EconomicDamagePopupComponent,
                                    getAttributes: (args) => {
                                        const event: MapBrowserEvent<any> = args.event;
                                        const layer: TileLayer<TileWMS> = args.layer;
                                        return {
                                            event: event,
                                            layer: layer,
                                            metaData: metaDataValue,
                                            title: 'eq-economic-loss-title'
                                        };
                                    }
                                }
                            }
                        }
        
                        
                        damageLayer.id += '_damage';
                        damageLayer.name = 'eq-exposure';
                        damageLayer.icon = 'dot-circle';
                        damageLayer.params = { ... econLayer.params };
                        damageLayer.params.STYLES = 'style-damagestate-sara-plasma';
                        const baseLegendDmg = damageLayer.legendImg;
                        damageLayer.legendImg = {
                            component: TranslatedImageComponent,
                            inputs: {
                                languageImageMap: {
                                    'EN': baseLegendDmg + '&style=style-damagestate-sara-plasma&language=en',
                                    'ES': baseLegendDmg + '&style=style-damagestate-sara-plasma',
                                }
                            }
                        };
                        delete damageLayer.params.SLD_BODY;
                        if (metaDataValue) {
                            damageLayer.popup = {
                                dynamicPopup: {
                                    component: DamagePopupComponent,
                                    getAttributes: (args) => {
                                        const event: MapBrowserEvent<any> = args.event;
                                        const layer: TileLayer<TileWMS> = args.layer;
                                        return {
                                            event: event,
                                            layer: layer,
                                            metaData: metaDataValue,
                                            xLabel: 'damage',
                                            yLabel: 'Nr_buildings',
                                            schema: 'SARA_v1.0',
                                            heading: 'earthquake_damage_classification',
                                            additionalText: 'DamageStatesSara'
                                        };
                                    }
                                }
                            };
                        }

                        const counts = metaDataValue?.total?.buildings_by_damage_state || 0.0;
                        const html =
                            createHeaderTableHtml(Object.keys(counts), [Object.values(counts).map((c: number) => toDecimalPlaces(c, 0))])
                            + '{{ BuildingTypesSaraExtensive }}';
        
                        damageLayer.dynamicDescription = {
                            component: TranslatableStringComponent,
                            inputs: {
                                text: html
                            }
                        };
        
                        
                        return [econLayer, damageLayer];
                    })
                );
            },
        }];
    }

}

export class EqDeusChile implements WizardableStepAugmenter {
    appliesTo(step: RiesgosStep): boolean {
        return step.step.id === 'EqDamageChile';
    }

    makeStepWizardable(step: RiesgosStep): WizardableStep {
        return {
            ...step,
            scenario: 'Chile',
            wizardProperties: {
                providerName: 'GFZ',
                providerUrl: 'https://www.gfz-potsdam.de/en/',
                shape: 'dot-circle' as 'dot-circle',
                wikiLink: 'ExposureAndVulnerability',
                dataSources: [{ label: "Brinckmann et al., 2021", href: "https://dataservices.gfz-potsdam.de/panmetaworks/showshort.php?id=d38d2b34-d5ba-11eb-9603-497c92695674" }]
            }
        }
    }

}
