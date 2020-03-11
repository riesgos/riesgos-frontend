import { Component, OnInit, ViewEncapsulation, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { DragBox } from 'ol/interaction';
import { Style, Stroke } from 'ol/style';
import { Vector as olVectorLayer } from 'ol/layer';
import TileLayer from 'ol/layer/Tile';
import { Vector as olVectorSource } from 'ol/source';
import { GeoJSON, KML } from 'ol/format';
import { get as getProjection } from 'ol/proj';
import {getWidth} from 'ol/extent';
import { MapOlService } from '@ukis/map-ol';
import TileWMS from 'ol/source/TileWMS';
import XYZ from 'ol/source/XYZ'
import TileGrid from 'ol/tilegrid/TileGrid';
import { MapStateService } from '@ukis/services-map-state';
import { osm } from '@ukis/base-layers-raster';
import { Store, select } from '@ngrx/store';
import { State } from 'src/app/ngrx_register';
import { getMapableProducts, getScenario, getGraph } from 'src/app/riesgos/riesgos.selectors';
import { Product } from 'src/app/riesgos/riesgos.datatypes';
import { InteractionCompleted } from 'src/app/interactions/interactions.actions';
import { BehaviorSubject, Subscription } from 'rxjs';
import { InteractionState, initialInteractionState } from 'src/app/interactions/interactions.state';
import { LayerMarshaller } from './layer_marshaller';
import { Layer, LayersService, RasterLayer, CustomLayer, LayerGroup } from '@ukis/services-layers';
import { getFocussedProcessId } from 'src/app/focus/focus.selectors';
import { Graph } from 'graphlib';
import { ProductLayer, ProductRasterLayer } from './map.types';
import { map, withLatestFrom, switchMap } from 'rxjs/operators';
import { featureCollection as tFeatureCollection } from '@turf/helpers';
import { parse } from 'url';
import { WpsBboxValue } from '@ukis/services-ogc';


const mapProjection = 'EPSG:4326';

@Component({
    selector: 'ukis-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    encapsulation: ViewEncapsulation.None,
    // changeDetection: ChangeDetectionStrategy.OnPush
    providers: [LayersService, MapStateService, MapOlService]
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {


    controls: { attribution?: boolean, scaleLine?: boolean, zoom?: boolean, crosshair?: boolean };
    private geoJson = new GeoJSON();
    private interactionState: BehaviorSubject<InteractionState>;
    private subs: Subscription[] = [];

    constructor(
        public mapStateSvc: MapStateService,
        public mapSvc: MapOlService,
        private store: Store<State>,
        private layerMarshaller: LayerMarshaller,
        public layersSvc: LayersService
    ) {
        this.controls = { attribution: true, scaleLine: true };
    }


    ngOnInit() {

        this.subscribeToMapState();

        // listening for interaction modes
        this.interactionState = new BehaviorSubject<InteractionState>(initialInteractionState);
        const sub1 = this.store.pipe(select('interactionState')).subscribe(currentInteractionState => {
            this.interactionState.next(currentInteractionState);
        });
        this.subs.push(sub1);

        // listening for focus-change
        const sub2 = this.store.pipe(
            select(getFocussedProcessId),
            withLatestFrom(
                this.store.pipe(select(getGraph)),
                this.layersSvc.getOverlays()
            ),
        ).subscribe(([focussedProcessId, graph, currentOverlays]: [string, Graph, Layer[]]) => {
            if (graph && focussedProcessId !== 'some initial focus') {
                const inEdges = graph.inEdges(focussedProcessId);
                const outEdges = graph.outEdges(focussedProcessId);
                if (inEdges && outEdges) {
                    const inputs = inEdges.map(edge => edge.v);
                    const outputs = outEdges.map(edge => edge.w);
                    for (const layer of currentOverlays) {
                        if (inputs.includes((layer as ProductLayer).productId) || outputs.includes((layer as ProductLayer).productId)) {
                            layer.opacity = 0.6;
                            layer.hasFocus = true;
                        } else {
                            layer.opacity = 0.1;
                            layer.hasFocus = false;
                        }
                        this.layersSvc.updateLayer(layer, 'Overlays');
                    }
                }
            }
        });
        this.subs.push(sub2);

        // listening for products that can be displayed on the map
        const sub3 = this.store.pipe(
            select(getMapableProducts),

            // translate to layers
            switchMap((products: Product[]) => {
                return this.layerMarshaller.productsToLayers(products);
            }),

            withLatestFrom(this.layersSvc.getOverlays()),
            map(([newOverlays, oldOverlays]: [ProductLayer[], ProductLayer[]]) => {

                // keep user's visibility-settings
                for (const oldLayer of oldOverlays) {
                    const newLayer = newOverlays.find(nl => nl.id === oldLayer.id );
                    if (newLayer) {
                        newLayer.visible = oldLayer.visible;
                        newLayer.hasFocus = oldLayer.hasFocus;
                    }
                }

                // set hasFocus=true for new layers
                for (const newLayer of newOverlays) {
                    const oldLayer = oldOverlays.find(ol => ol.id === newLayer.id);
                    if (!oldLayer) {
                        newLayer.hasFocus = true;
                    }
                }

                return newOverlays;
            })


        // add to map
        ).subscribe((newOverlays: ProductLayer[]) => {
            this.layersSvc.removeOverlays();
            newOverlays.map(l => this.layersSvc.addLayer(l, l.filtertype));
        });
        this.subs.push(sub3);


        // adding dragbox interaction and hooking it into the store
        const dragBox = new DragBox({
            condition: (event) => {
                return this.interactionState.getValue().mode === 'bbox';
            },
            onBoxEnd: () => {
                const lons = dragBox.getGeometry().getCoordinates()[0].map(coords => coords[0]);
                const lats = dragBox.getGeometry().getCoordinates()[0].map(coords => coords[1]);
                const minLon = Math.min(... lons);
                const maxLon = Math.max(... lons);
                const minLat = Math.min(... lats);
                const maxLat = Math.max(... lats);
                const box: WpsBboxValue = {
                    crs: mapProjection,
                    lllat: minLat.toFixed(1) as unknown as number,
                    lllon: minLon.toFixed(1) as unknown as number,
                    urlat: maxLat.toFixed(1) as unknown as number,
                    urlon: maxLon.toFixed(1) as unknown as number
                };
                const product: Product = {
                    ...this.interactionState.getValue().product,
                    value: box
                };
                this.store.dispatch(new InteractionCompleted({ product }));
            },
            style: new Style({
                stroke: new Stroke({
                    color: [0, 0, 255, 1]
                })
            })
        });
        this.mapSvc.map.addInteraction(dragBox);


        // adding featureselect interaction and hooking it into the store
        this.mapSvc.map.on('click', (event) => {
            this.mapSvc.map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
                if (this.interactionState.getValue().mode === 'featureselection') {
                    const product = {
                        ...this.interactionState.getValue().product,
                        value: [tFeatureCollection([JSON.parse(this.geoJson.writeFeature(feature))])]
                    };
                    this.store.dispatch(new InteractionCompleted({ product }));
                }
            });
        });

        this.mapSvc.map.on('click', () => {
            this.mapSvc.removeAllPopups();
        });

        // listening for change in scenario - onInit
        const sub5 = this.store.pipe(select(getScenario)).subscribe((scenario: string) => {
            this.layersSvc.removeLayers();
            const infolayers = this.getInfoLayers(scenario);
            for (const layer of infolayers) {
                if (layer instanceof LayerGroup) {
                    this.layersSvc.addLayerGroup(layer);
                } else {
                    this.layersSvc.addLayer(layer, 'Layers', false);
                }
            }
        });
        this.subs.push(sub5);
    }

    private printAllLayers(message: string): void {
        const layergroups = this.mapSvc.map.getLayers().getArray();
        console.log(message);
        console.log('1st level: ', layergroups);
        for (const layergroup of layergroups) {
            const title = layergroup.get('title');
            const layers = layergroup.getLayers().getArray();
            console.log(`2nd level: ${title}:`, layers, layers.map(l => l.get('id')));
        }
    }

    ngAfterViewInit() {
        // listening for change in scenario - afterViewInit
        const sub6 = this.store.pipe(select(getScenario)).subscribe((scenario: string) => {
            this.mapSvc.setProjection(getProjection(mapProjection));
            const center = this.getCenter(scenario);
            this.mapSvc.setZoom(8);
            this.mapSvc.setCenter(center, true);
        });
        this.subs.push(sub6);
    }

    ngOnDestroy() {
        this.subs.map(s => s.unsubscribe());
        this.layersSvc.removeBaseLayers();
        this.layersSvc.removeLayers();
        this.layersSvc.removeOverlays();
    }

    private getCenter(scenario: string): [number, number] {
        switch (scenario) {
            case 'c1':
                return [-70.799, -33.990];
            case 'e1':
                return [-78.4386, -0.6830];
            case 'p1':
                return [-75.902, -11.490];
            default:
                throw new Error(`Unknown scenario: ${scenario}`);
        }
    }

    /** TODO add openlayers Drag-and-Drop to add new Additional Layers https://openlayers.org/en/latest/examples/drag-and-drop-image-vector.html */
    private getInfoLayers(scenario: string) {
        const layers: Array<Layer | LayerGroup> = [];

        const osmLayer = new osm();
        osmLayer.visible = false;
        osmLayer.removable = true;
        osmLayer.legendImg = 'assets/layer-preview/osm-96px.jpg';
        layers.push(osmLayer);

        const relief2 = new CustomLayer({
            name: 'Hillshade',
            id: 'shade',
            type: 'custom',
            custom_layer: new TileLayer({
                source: new XYZ({
                    url: 'https://maps.heigit.org/openmapsurfer/tiles/asterh/webmercator/{z}/{x}/{y}.png'
                })
            }),
            bbox: [-180, -56, 180, 60],
            description: 'OpenMapSurfer, <a href="https://heigit.org/>Heidelberg institute for geoinformation technology</a>',
            attribution: '&copy, <a href="https://maps.openrouteservice.org">OpenMapSurfer</a>',
            legendImg: 'assets/layer-preview/hillshade-96px.jpg',
            opacity: 0.3,
            visible: false,
            removable: true
        });
        layers.push(relief2);


        if (scenario === 'c1') {

            const powerlineLayer = new RasterLayer({
                id: 'powerlines',
                name: 'Powerlines',
                type: 'wms',
                url: 'http://energiamaps.cne.cl/geoserver/cne-sigcra-new/wms?',
                params: {
                    LAYERS: 'sic_20181016234835'
                },
                description: 'Línea de Transmisión SIC',
                attribution: '&copy, <a href="http://energiamaps.cne.cl">energiamaps.cne.cl/</a>',
                legendImg: 'http://energiamaps.cne.cl/geoserver/cne-sigcra-new/wms?service=wms&request=GetLegendGraphic&LAYER=sic_20181016234835&FORMAT=image/png',
                opacity: 0.3,
                // bbox: [-92.270, -44.104, -48.017, -24.388],
                visible: false,
                removable: true,
                // @ts-ignore
                crossOrigin: 'anonymous'
            });
            layers.push(powerlineLayer);

            const civilServiceLayers = new LayerGroup({
                filtertype: 'Layers',
                id: 'CivilServiceLayers',
                name: 'Civil Service',
                layers: [
                    new RasterLayer({
                        id: 'police',
                        name: 'Police',
                        type: 'wms',
                        url: 'http://www.geoportal.cl/arcgis/services/MinisteriodeInterior/chile_minterior_carabineros_cuarteles/MapServer/WMSServer?',
                        visible: false,
                        attribution: '&copy, <a href="http://www.geoportal.cl">Ministerio del Interior</a>',
                        legendImg: 'http://www.geoportal.cl/arcgis/services/MinisteriodeInterior/chile_minterior_carabineros_cuarteles/MapServer/WmsServer?request=GetLegendGraphic%26version=1.3.0%26format=image/png%26layer=0',
                        params: {
                            LAYERS: '0'
                        }
                    }),
                    new RasterLayer({
                        id: 'firefighters',
                        name: 'Firefighters',
                        type: 'wms',
                        url: 'http://www.geoportal.cl/arcgis/services/Otros/chile_bomberos_cuerpos/MapServer/WMSServer?',
                        visible: false,
                        attribution: '&copy, <a href="http://www.geoportal.cl">Ministerio del Interior</a>',
                        legendImg: 'http://www.geoportal.cl/arcgis/services/Otros/chile_bomberos_cuerpos/MapServer/WmsServer?request=GetLegendGraphic%26version=1.3.0%26format=image/png%26layer=0',
                        params: {
                            LAYERS: '0'
                        }
                    }),
                    new RasterLayer({
                        id: 'airports',
                        name: 'Airports',
                        type: 'wms',
                        url: 'http://www.geoportal.cl/arcgis/services/MinisteriodeObrasPublicas/chile_mop_infraestructura_aerea/MapServer/WMSServer?',
                        visible: false,
                        attribution: '&copy, <a href="http://www.geoportal.cl">Ministerio del Interior</a>',
                        legendImg: 'http://www.geoportal.cl/arcgis/services/MinisteriodeObrasPublicas/chile_mop_infraestructura_aerea/MapServer/WmsServer?request=GetLegendGraphic%26version=1.3.0%26format=image/png%26layer=0',
                        params: {
                            LAYERS: '0'
                        }
                    })
                ],
                bbox: [-76.202, -33.397, -67.490, -24.899]
            });
            layers.push(civilServiceLayers);


            const shoaLayers = new LayerGroup({
                filtertype: 'Layers',
                id: 'shoaLayers',
                name: 'Tsunami Flood Layers (CITSU)',
                layers: [
                    new CustomLayer({
                        custom_layer: new olVectorLayer({
                            source: new olVectorSource({
                                url: 'assets/data/kml/citsu_taltal_2da_Ed_2012.kml',
                                format: new KML(),
                                crossOrigin: 'anonymous'
                            })
                        }),
                        name: 'Taltal (SHOA)',
                        id: 'Taltal_SHOA',
                        type: 'custom',
                        // bbox: [-70.553, -25.472, -70.417, -25.334],
                        visible: false,
                        attribution: '&copy, <a href="http://www.shoa.cl/php/citsu.php">shoa.cl</a>',
                        legendImg: 'assets/layer-preview/citsu-96px.jpg',
                        popup: true
                    }),
                    new CustomLayer({
                        custom_layer: new olVectorLayer({
                            source: new olVectorSource({
                                url: 'assets/data/kml/citsu_valparaiso_vinna.kml',
                                format: new KML(),
                                crossOrigin: 'anonymous'
                            })
                        }),
                        name: 'Valparaiso (SHOA)',
                        id: 'Valparaiso_SHOA',
                        type: 'custom',
                        // bbox: [-71.949, -33.230, -71.257, -32.720],
                        visible: false,
                        attribution: '&copy, <a href="http://www.shoa.cl/php/citsu.php">shoa.cl</a>',
                        legendImg: 'assets/layer-preview/citsu-96px.jpg',
                        popup: true
                    })

                ],
                bbox: [-76.202, -33.397, -67.490, -24.899]
            });
            layers.push(shoaLayers);
        }

        if (scenario === 'p1') {

            // To make the IDEP-layers display labels in the same way as on ...
            // http://mapas.geoidep.gob.pe/mapasperu/?config=viewer_wms&wmsuri=http://sigr.regioncajamarca.gob.pe:6080/arcgis/rest/services/Map/Informacion_Base/MapServer&wmstitle=Informaci%C3%B3n%20Base&t=1
            // ... we need to adjust the wms-tilegrid.
            const tileWidth = 1920;
            const tileHeight = 948;
            const view = this.mapSvc.map.getView();
            const startZoom = view.getMinZoom();
            const endZoom = view.getMaxZoom();
            const resolutions = new Array(endZoom + 1);
            const projExtent = getProjection(mapProjection).getExtent();
            const startResolution = getWidth(projExtent) / tileWidth;
            for (let z = startZoom; z <= endZoom; z++) {
                resolutions[z] = startResolution / Math.pow(2, z); // view.getResolutionForZoom(z);
            }

            const idepTileGrid = new TileGrid({
                extent: [-86, -21, -68, 1],
                resolutions,
                tileSize: [tileWidth, tileHeight]
            });

            const administrativeLayers = new LayerGroup({
                filtertype: 'Layers',
                id: 'administrativeLayers',
                name: 'Administrative layers',
                layers: [
                    new CustomLayer({
                        custom_layer: new TileLayer({
                            source: new TileWMS({
                                url: 'http://mapas.geoidep.gob.pe/geoidep/services/Demarcacion_Territorial/MapServer/WMSServer?',
                                params: {
                                    layers: '2',
                                    tiled: true
                                },
                                tileGrid: idepTileGrid,
                                crossOrigin: 'anonymous'
                            })
                        }),
                        name: 'Departementos',
                        id: 'departementos_idep',
                        type: 'custom',
                        visible: false,
                        opacity: 0.6,
                        attribution: '&copy, <a href="http://mapas.geoidep.gob.pe/">Instituto Geográfico Nacional</a>',
                        popup: true
                    }),
                    new CustomLayer({
                        custom_layer: new TileLayer({
                            source: new TileWMS({
                                url: 'http://mapas.geoidep.gob.pe/geoidep/services/Demarcacion_Territorial/MapServer/WMSServer?',
                                params: {
                                    layers: '1',
                                    tiled: true
                                },
                                tileGrid: idepTileGrid,
                                crossOrigin: 'anonymous'
                            })
                        }),
                        name: 'Provincias',
                        id: 'provincias_idep',
                        type: 'custom',
                        visible: false,
                        opacity: 0.6,
                        attribution: '&copy, <a href="http://mapas.geoidep.gob.pe/">Instituto Geográfico Nacional</a>',
                        popup: true,
                    }),
                    new CustomLayer({
                        custom_layer: new TileLayer({
                            source: new TileWMS({
                                url: 'http://mapas.geoidep.gob.pe/geoidep/services/Demarcacion_Territorial/MapServer/WMSServer?',
                                params: {
                                    layers: '0',
                                    tiled: true
                                },
                                tileGrid: idepTileGrid,
                                crossOrigin: 'anonymous'
                            })
                        }),
                        name: 'Distritos',
                        id: 'distritos_idep',
                        type: 'custom',
                        visible: false,
                        opacity: 0.6,
                        attribution: '&copy, <a href="http://mapas.geoidep.gob.pe/">Instituto Geográfico Nacional</a>',
                        popup: true
                    })
                ]
            });
            layers.push(administrativeLayers);

            const infrastructureLayers = new LayerGroup({
                filtertype: 'Layers',
                id: 'infrastructureLayers',
                name: 'Infrastructure layer',
                layers: [
                    new ProductRasterLayer({
                        id: 'distribPeru',
                        name: 'distribución',
                        description: 'Concesiones de Distribución',
                        attribution: 'http://mapas.geoidep.gob.pe',
                        url: 'http://mapas.geoidep.gob.pe/geoidep/services/Electricidad/MapServer/WMSServer?',
                        type: 'wms',
                        params: {
                            LAYERS: '0'
                        },
                        legendImg: 'http://mapas.geoidep.gob.pe/geoidep/services/Electricidad/MapServer/WMSServer?service=wms&request=GetLegendGraphic&LAYER=0&FORMAT=image/png',
                        opacity: 0.3,
                        visible: false,
                        // @ts-ignore
                        crossOrigin: 'anonymous'
                    }),
                    new ProductRasterLayer({
                        id: 'generacionPeru',
                        name: 'generación',
                        description: 'Concesiones de Generación',
                        attribution: 'http://mapas.geoidep.gob.pe',
                        url: 'http://mapas.geoidep.gob.pe/geoidep/services/Electricidad/MapServer/WMSServer?',
                        type: 'wms',
                        params: {
                            LAYERS: '1'
                        },
                        legendImg: 'http://mapas.geoidep.gob.pe/geoidep/services/Electricidad/MapServer/WMSServer?service=wms&request=GetLegendGraphic&LAYER=1&FORMAT=image/png',
                        opacity: 0.3,
                        visible: false,
                        // @ts-ignore
                        crossOrigin: 'anonymous'
                    }),
                    new ProductRasterLayer({
                        id: 'transmissionPeru',
                        name: 'transmisión',
                        description: 'Concesiones de Transmisión',
                        attribution: 'http://mapas.geoidep.gob.pe',
                        url: 'http://mapas.geoidep.gob.pe/geoidep/services/Electricidad/MapServer/WMSServer?',
                        type: 'wms',
                        params: {
                            LAYERS: '3'
                        },
                        legendImg: 'http://mapas.geoidep.gob.pe/geoidep/services/Electricidad/MapServer/WMSServer?service=wms&request=GetLegendGraphic&LAYER=3&FORMAT=image/png',
                        opacity: 0.3,
                        visible: false,
                        // @ts-ignore
                        crossOrigin: 'anonymous'
                    }),
                ]
            });
            layers.push(infrastructureLayers);

        }

        if (scenario === 'e1') {
            const sniLayers = new LayerGroup({
                filtertype: 'Layers',
                id: 'sniLayers',
                name: 'Sistema Nacional de Información',
                layers: [
                    new CustomLayer({
                        custom_layer: new olVectorLayer({
                            source: new olVectorSource({
                                url: 'assets/data/geojson/linea_transmision_ecuador.geojson',
                                format: new GeoJSON(),
                                crossOrigin: 'anonymous'
                            })
                        }),
                        name: 'transmisión',
                        id: 'transmision',
                        type: 'custom',
                        visible: false,
                        attribution: '&copy, <a href="http://geoportal.regulacionelectrica.gob.ec/visor/index.html">regulacionelectrica.gob.ec</a>',
                        // legendImg: 'assets/layer-preview/citsu-96px.jpg',
                        popup: true
                    }),
                    new CustomLayer({
                        custom_layer: new olVectorLayer({
                            source: new olVectorSource({
                                url: 'assets/data/geojson/linea_subtransmision_ecuador.geojson',
                                format: new GeoJSON(),
                                crossOrigin: 'anonymous'
                            })
                        }),
                        name: 'subtransmisión',
                        id: 'subtransmision',
                        type: 'custom',
                        visible: false,
                        attribution: '&copy, <a href="http://geoportal.regulacionelectrica.gob.ec/visor/index.html">regulacionelectrica.gob.ec</a>',
                        // legendImg: 'assets/layer-preview/citsu-96px.jpg',
                        popup: true
                    })

                ]
            });
            layers.push(sniLayers);
        }

        return layers;
    }


    subscribeToMapState() {
        const sub7 = this.mapStateSvc.getMapState().subscribe((state) => {
            if (history.pushState) {
                const url = parse(window.location.href.replace('#/', ''));
                // console.log(url)
                const query = new URLSearchParams(url.query);
                const extent = state.extent.map(item => item.toFixed(3));
                query.set('bbox', extent.join(','))
                const newurl = `${url.protocol}//${url.host}/#${url.pathname}?${query.toString()}`; // bbox=${extent.join(',') &time=${state.time}
                // console.log(newurl)
                window.history.pushState({ path: newurl }, '', newurl);
            }
        });
        this.subs.push(sub7);
    }
}
