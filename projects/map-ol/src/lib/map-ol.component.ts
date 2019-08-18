import { Component, OnInit, ViewEncapsulation, Input, Inject, OnDestroy, AfterViewChecked, AfterContentChecked, AfterViewInit, ViewChild, ElementRef } from '@angular/core';


import { MapState } from '@ukis/services-map-state';
import { MapStateService } from '@ukis/services-map-state';
import { Subscription, BehaviorSubject } from 'rxjs';
import { MapOlService } from './map-ol.service';
import { LayersService } from '@ukis/services-layers';

import Map from 'ol/Map';
import View from 'ol/View';
import Attribution from 'ol/control/Attribution';
import ScaleLine from 'ol/control/ScaleLine';
import Zoom from 'ol/control/Zoom';
import { group } from '@angular/animations';


@Component({
  selector: 'ukis-map-ol',
  templateUrl: './map-ol.component.html',
  styleUrls: ['./map-ol.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapOlComponent implements OnInit, OnDestroy, AfterViewChecked, AfterContentChecked, AfterViewInit {
  @ViewChild('mapDiv', { static: false }) mapDivView: ElementRef;

  @Input('layersSvc') layersSvc: LayersService;
  @Input('mapState') mapStateSvc: MapStateService;
  @Input('controls') controls: { attribution?: boolean, scaleLine?: boolean, zoom?: boolean, crosshair?: boolean };

  map: Map;
  view: View;

  viewSubj = new BehaviorSubject(this.view);

  zoom: number; // default value
  center: any; // default value
  mapState: MapState;
  extent: Array<number>;
  extentOn: Subscription;
  subs: Subscription[] = [];
  mapOnMoveend;
  mapOnClick;
  mapOnDclick;
  constructor(
    @Inject(MapOlService) private mapSvc: MapOlService
  ) {
    this.zoom = 3;
    this.center = {
      lat: 0,
      lon: 0
    };
    // console.log(this.mapSvc)
    const ms = new MapState(this.zoom, this.center);
    this.mapState = ms;
    /// define initial center and zoom
    // this.initMap();

  }

  ngOnInit() {
    this.initMap();
    this.mapStateSvc.setMapState(this.mapState);
  }

  ngAfterViewInit() {
    this.map.setTarget(this.mapDivView.nativeElement);
  }

  ngAfterViewChecked() {
    //this.map.updateSize();
  }

  /** update map size on re scaling */
  ngAfterContentChecked() {
    this.map.updateSize();
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
    this.map.un('moveend', this.mapOnMoveend);
    this.map.un('click', this.mapOnClick);
    this.map.un('dblclick', this.mapOnDclick);
  }

  private addUpdateLayers(layers, type: 'baselayers' | 'layers' | 'overlays', layersunderneath: Array<'baselayers' | 'layers' | 'overlays'>) {
    /** get all underneath layers for zIndex */
    let _otherlayerslength = 0;
    layersunderneath.forEach(_type => {
      _otherlayerslength += this.mapSvc.getLayers(_type).length;
    });

    /** if length of layers has changed add new layers */
    if (layers.length !== this.mapSvc.getLayers(type).length) {
      this.mapSvc.setLayers(layers, type);
      // if layers underneath add thhen to the zIndex of layer
      if (_otherlayerslength > 0) {
        for (const layer of layers) {
          const ollayer = this.mapSvc.getLayerByKey({ key: 'id', value: layer.id }, type);
          if (ollayer) {
            if (ollayer.getZIndex() !== layers.indexOf(layer) + _otherlayerslength) {
              ollayer.setZIndex(layers.indexOf(layer) + _otherlayerslength);
            }
          }
        }
      }
    } else {
      /** if layers already on the map -length not changed- update them */
      for (const layer of layers) {
        const ollayer = this.mapSvc.getLayerByKey({ key: 'id', value: layer.id }, type);
        if (ollayer) {
          if (ollayer.getVisible() !== layer.visible) {
            ollayer.setVisible(layer.visible);
          }
          if (ollayer.getOpacity() !== layer.opacity) {
            ollayer.setOpacity(layer.opacity);
          }
          if (_otherlayerslength > 0) {
            if (ollayer.getZIndex() !== layers.indexOf(layer) + _otherlayerslength) {
              ollayer.setZIndex(layers.indexOf(layer) + _otherlayerslength);
            }

          } else {
            if (ollayer.getZIndex() !== layers.indexOf(layer)) {
              ollayer.setZIndex(layers.indexOf(layer));
            }
          }
        }
      }
    }

  }

  private addUpdateBaseLayers(layers) {
    /** if length of layers has changed add new layers */
    if (layers.length !== this.mapSvc.getLayers('baselayers').length) {
      // set only one visible at start
      const visiblelayers = layers.filter(l => l.visible === true);
      if (visiblelayers.length === 0) {
        layers[0].visible = true;
      } else if (visiblelayers.length > 1) {
        layers.forEach(l => l.visible = false);
        layers[0].visible = true;
      }
      this.mapSvc.setLayers(layers, 'baselayers');
    } else {
      /** if layers already on the map -length not changed- update them */
      for (const layer of layers) {
        const bllayer = this.mapSvc.getLayerByKey({ key: 'id', value: layer.id }, 'baselayers');
        if (bllayer) {
          if (bllayer.getVisible() !== layer.visible) {
            bllayer.setVisible(layer.visible);
          }
          if (bllayer.getZIndex() !== layers.indexOf(layer)) {
            bllayer.setZIndex(layers.indexOf(layer));
          }
          if (bllayer.getOpacity() !== layer.opacity) {
            bllayer.setOpacity(layer.opacity);
          }
        }
      }
    }
  }

  private subscribeToLayers() {
    // ----------------------
    // add/remove layers
    if (this.layersSvc) {
      const baselayersAddRemoveOn = this.layersSvc.getBaseLayers().subscribe(layers =>
        this.addUpdateBaseLayers(layers)
      );
      this.subs.push(baselayersAddRemoveOn);
      const onLayers = this.layersSvc.getLayers().subscribe(layers =>
        this.addUpdateLayers(layers, 'layers', ['baselayers'])
      );
      this.subs.push(onLayers);
      const onOverlays = this.layersSvc.getOverlays().subscribe(layers => {
        this.addUpdateLayers(layers, 'overlays', ['baselayers', 'layers']);
      });
      this.subs.push(onOverlays);
    }
  }

  private subscribeToMapState() {
    if (this.mapStateSvc) {
      const mapStateOn = this.mapStateSvc.getMapState().subscribe(mapState => {
        if (mapState.options.notifier === 'user') {
          this.mapState = mapState;
          // console.log("User triggered mapState change", mapState)
          this.mapSvc.setZoom(mapState.zoom, mapState.options.notifier);
          this.mapSvc.setCenter([mapState.center.lon, mapState.center.lat], true);
        } else if (mapState.options.notifier === 'map') {
          // console.log("Map triggered mapState change", mapState)
        }
      });
      this.subs.push(mapStateOn);

      const extentOn = this.mapStateSvc.getExtent().subscribe(extent => {
        // console.log("new extent is: ", extent);
        if (extent[0] && extent[1] && extent[2] && extent[3]) {
          this.mapSvc.setExtent([extent[0], extent[1], extent[2], extent[3]], true, { duration: 500 });
        }
      });
      this.subs.push(extentOn);
    }
  }

  private subscribeToMapEvents() {
    this.mapOnMoveend = (evt) => {
      // console.log(this.mapState.zoom,this.mapState.center, this.mapState.options)
      // console.log("mapOn fired", evt)
      const zoom = Math.round(this.view.getZoom());
      const center = this.mapSvc.getCenter(true);
      const extent = this.mapSvc.getCurrentExtent(true);
      const ms = new MapState(zoom, { lat: parseFloat(center[1].toFixed(6)), lon: parseFloat(center[0].toFixed(6)) }, { notifier: 'map' }, extent, null);
      this.mapState = ms;
      this.mapStateSvc.setMapState(ms);
    };
    this.map.on('moveend', this.mapOnMoveend);

    /** handle click on vektor layers */
    this.mapOnClick = (evt) => {
      this.mapSvc.layers_on_click(evt);
    };
    this.map.on('click', this.mapOnClick);

    /** handle double click */
    this.mapOnDclick = (evt) => {
      this.mapSvc.removeAllPopups();
    };
    this.map.on('dblclick', this.mapOnDclick);
  }


  private initMap() {
    const _ol = this.mapSvc.createMap();
    this.map = _ol.map; //
    this.view = _ol.view; //

    // add Control only if this functions is defined
    if (this.controls) {
      if (this.controls.attribution) {
        const attribution = new Attribution({
          // collapsible: false,
          collapsed: false
        });
        this.map.addControl(attribution);
      }
      if (this.controls.scaleLine) {
        const scaleLineControl = new ScaleLine();
        this.map.addControl(scaleLineControl);
      }
      if (this.controls.zoom) {
        const zoomControl = new Zoom();
        this.map.addControl(zoomControl);
      }
    }
    if (!this.layersSvc) {
      console.log('there is no layersSvc as defined!');
    }

    if (!this.mapStateSvc) {
      console.log('there is no mapStateSvc as defined!');
    }

    this.subscribeToLayers();

    this.subscribeToMapState();

    this.subscribeToMapEvents();
  }

}
