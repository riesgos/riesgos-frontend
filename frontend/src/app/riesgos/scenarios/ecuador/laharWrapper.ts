import { ExecutableProcess, Product, ProcessState, ProcessStateUnavailable } from 'src/app/riesgos/riesgos.datatypes';
import { WizardableProcess, WizardProperties } from 'src/app/components/config_wizard/wizardable_processes';
import { Observable, forkJoin } from 'rxjs';
import { LaharWps, direction, vei, parameter, laharWms, laharShakemap } from './lahar';
import { WpsData } from '../../../services/wps/wps.datatypes';
import { WmsLayerProduct, MappableProduct } from 'src/app/mappable/riesgos.datatypes.mappable';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { FeatureCollection } from '@turf/helpers';
import { createKeyValueTableHtml } from 'src/app/helpers/others';
import { toDecimalPlaces } from 'src/app/helpers/colorhelpers';
import { MapOlService } from '@dlr-eoc/map-ol';
import { LayersService } from '@dlr-eoc/services-layers';
import { Store } from '@ngrx/store';
import { SliderEntry, GroupSliderComponent } from 'src/app/components/dynamic/group-slider/group-slider.component';
import { LayerMarshaller } from 'src/app/mappable/layer_marshaller';
import { ProductRasterLayer, ProductCustomLayer } from 'src/app/mappable/map.types';
import olTileLayer from 'ol/layer/Tile';
import olTileWMS from 'ol/source/TileWMS';
import olLayerGroup from 'ol/layer/Group';
import { State } from 'src/app/ngrx_register';
import { TranslatableStringComponent } from 'src/app/components/dynamic/translatable-string/translatable-string.component';



export const laharHeightWms: WmsLayerProduct & Product = {
    ...laharWms,
    description: {
        ...laharWms.description,
        featureInfoRenderer: (fi: FeatureCollection) => {
            if (fi.features && fi.features.length > 0) {
                return createKeyValueTableHtml('', { '{{ laharMaxDepth }}': toDecimalPlaces(fi.features[0].properties['GRAY_INDEX'], 2) + ' m' }, 'medium');
            } else {
                return '';
            }
        }
    },
    uid: 'LaharHeightWms'
};

export const laharHeightShakemapRef: WpsData & Product = {
    ...laharShakemap,
    uid: 'LaharHeightShakemap'
};

export const laharVelocityWms: WmsLayerProduct & Product = {
    ...laharWms,
    description: {
        ...laharWms.description,
        featureInfoRenderer: (fi: FeatureCollection) => {
            if (fi.features && fi.features.length > 0) {
                return createKeyValueTableHtml('', { '{{ laharVelocity }}': toDecimalPlaces(fi.features[0].properties['GRAY_INDEX'], 2) + ' m/s' }, 'medium');
            } else {
                return '';
            }
        }
    },
    uid: 'LaharVelocityWms'
};

export const laharVelocityShakemapRef: WpsData & Product = {
    ...laharShakemap,
    uid: 'LaharVelocityShakemap'
};

export const laharPressureWms: WmsLayerProduct & Product = {
    ...laharWms,
    description: {
        ...laharWms.description,
        featureInfoRenderer: (fi: FeatureCollection) => {
            if (fi.features && fi.features.length > 0) {
                return createKeyValueTableHtml('', { '{{ laharPressure }}': toDecimalPlaces(fi.features[0].properties['GRAY_INDEX'], 2) + ' kPa' }, 'medium');
            } else {
                return '';
            }
        }
    },
    uid: 'LaharPressureWms'
};

export const laharErosionWms: WmsLayerProduct & Product = {
    ...laharWms,
    description: {
        ...laharWms.description,
        featureInfoRenderer: (fi: FeatureCollection) => {
            if (fi.features && fi.features.length > 0) {
                return createKeyValueTableHtml('', { '{{ laharErosion }}': toDecimalPlaces(fi.features[0].properties['GRAY_INDEX'], 2) + ' m' }, 'medium');
            } else {
                return '';
            }
        }
    },
    uid: 'LaharErosionWms'
};

export const laharDepositionWms: WmsLayerProduct & Product = {
    ...laharWms,
    description: {
        ...laharWms.description,
        featureInfoRenderer: (fi: FeatureCollection) => {
            if (fi.features && fi.features.length > 0) {
                return createKeyValueTableHtml('', { '{{ laharDeposition }}': toDecimalPlaces(fi.features[0].properties['GRAY_INDEX'], 2) + ' m' }, 'medium');
            } else {
                return '';
            }
        }
    },
    uid: 'LaharDepositionWms'
};


export const laharContoursWms: WmsLayerProduct & MappableProduct = {
    description: {
        id: 'LaharContourLines',
        icon: 'avalanche',
        name: 'Lahar contour lines',
        format: 'application/WMS',
        type: 'complex',
    },
    toUkisLayers: function (ownValue: any, mapSvc: MapOlService, layerSvc: LayersService, http: HttpClient, store: Store<State>, layerMarshaller: LayerMarshaller) {

        const basicLayers$ = layerMarshaller.makeWmsLayers(this as WmsLayerProduct);
        const laharLayers$ = basicLayers$.pipe(
            map((layers: ProductRasterLayer[]) => {
                const olLayers = layers.map(l => {
                    const layer = new olTileLayer({
                        source: new olTileWMS({
                            url: l.url,
                            params: l.params,
                            crossOrigin: 'anonymous'
                        }),
                        visible: false
                    });
                    layer.set('id', l.id);
                    return layer;
                });
                olLayers[0].setVisible(true);

                const layerGroup = new olLayerGroup({
                    layers: olLayers
                });

                const entries: SliderEntry[] = layers.map((l: ProductRasterLayer, index: number) => {
                    return {
                        id: l.id,
                        tickValue: index,
                        displayText: l.name.match(/(\d+)$/)[0] + 'min'
                    };
                });

                const laharLayer = new ProductCustomLayer({
                    hasFocus: false,
                    filtertype: 'Overlays',
                    productId: this.uid,
                    removable: true,
                    custom_layer: layerGroup,
                    id: this.uid,
                    name: this.uid,
                    action: {
                        component: GroupSliderComponent,
                        inputs: {
                            entries,
                            selectionHandler: (selectedId: string) => {
                                layerGroup.getLayers().forEach(l => {
                                    if (l.get('id') === selectedId) {
                                        l.setVisible(true);
                                    } else {
                                        l.setVisible(false);
                                    }
                                });
                            },
                        }
                    },
                    dynamicDescription: {
                        component: TranslatableStringComponent,
                        inputs: {
                            text: 'Lahar_contourlines_description'
                        }
                    }
                });
                return [laharLayer];
            })
        );
        return laharLayers$;

    },
    value: null,
    uid: 'LaharContourLines'
};

export class LaharWrapper implements ExecutableProcess, WizardableProcess {

    state: ProcessState;
    uid = 'LaharWrapper';
    name = 'LaharService';
    requiredProducts = [direction, vei].map(prd => prd.uid);
    providedProducts = [laharHeightWms, laharHeightShakemapRef, laharVelocityWms, laharVelocityShakemapRef,
        laharPressureWms, laharErosionWms, laharDepositionWms, laharContoursWms].map(prd => prd.uid);
    description?: string;
    private laharWps: LaharWps;

    readonly wizardProperties: WizardProperties;

    constructor(http: HttpClient) {
        this.laharWps = new LaharWps(http);
        this.wizardProperties = this.laharWps.wizardProperties;
        this.description = this.laharWps.description;
        this.state = new ProcessStateUnavailable();
    }

    execute(inputs: Product[], outputs?: Product[], doWhile?): Observable<Product[]> {

        const directionV = inputs.find(prd => prd.uid === direction.uid);
        const veiV = inputs.find(prd => prd.uid === vei.uid);

        const heightProc$ = this.laharWps.execute(
            [directionV, veiV, { ...parameter, value: 'MaxHeight' }], [laharHeightWms, laharHeightShakemapRef], doWhile);
        const velProc$ = this.laharWps.execute(
            [directionV, veiV, { ...parameter, value: 'MaxVelocity' }], [laharVelocityWms, laharVelocityShakemapRef], doWhile);
        const pressureProc$ = this.laharWps.execute(
            [directionV, veiV, { ...parameter, value: 'MaxPressure' }], [laharPressureWms], doWhile);
        const erosionProc$ = this.laharWps.execute(
            [directionV, veiV, { ...parameter, value: 'MaxErosion' }], [laharErosionWms], doWhile);
        // const depositionProc$ = this.laharWps.execute(
        //     [directionV, veiV, { ...parameter, value: 'Deposition' }], [laharDepositionWms], doWhile);

        // merge
        return forkJoin([heightProc$, velProc$, pressureProc$, erosionProc$]).pipe(
            map((results: Product[][]) => {
                const flattened: Product[] = [];
                for (const result of results) {
                    for (const data of result) {
                        flattened.push(data);
                    }
                }

                const vals = [];
                if (directionV.value === 'South') {
                    vals.push(
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_S_${veiV.value}_time_min10&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_S_${veiV.value}_time_min20&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_S_${veiV.value}_time_min40&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_S_${veiV.value}_time_min60&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_S_${veiV.value}_time_min80&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_S_${veiV.value}_time_min100&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                    );
                    if (veiV.value !== 'VEI4') {
                        vals.push(`https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_S_${veiV.value}_time_min120&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`);
                    }
                } else {
                    vals.push(
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_N_${veiV.value}_time_min10&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_N_${veiV.value}_time_min20&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_N_${veiV.value}_time_min40&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_N_${veiV.value}_time_min60&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_N_${veiV.value}_time_min80&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_N_${veiV.value}_time_min100&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                        `https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_N_${veiV.value}_time_min120&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`,
                    );
                    if (veiV.value !== 'VEI4') {
                        vals.push(`https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_N_${veiV.value}_time_min140&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`);
                        if (veiV.value !== 'VEI3') {
                            vals.push(`https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_N_${veiV.value}_time_min160&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`);
                            if (veiV.value !== 'VEI2') {
                                vals.push(`https://riesgos.52north.org/geoserver/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-0.9180023421741969614,-78.63448207604660922,-0.6413804570762020596,-78.4204016501013399&CRS=EPSG:4326&WIDTH=1233&HEIGHT=1593&LAYERS=LaharArrival_N_${veiV.value}_time_min180&STYLES=&FORMAT=image/png&DPI=240&MAP_RESOLUTION=240&FORMAT_OPTIONS=dpi:240&TRANSPARENT=TRUE`);
                            }
                        }
                    }
                }
                flattened.push({
                    ...laharContoursWms,
                    value: vals
                });

                return flattened;
            })
        );
    }
}