import { Map as OlMap, Overlay, View } from 'ol';
import Layer from 'ol/layer/Layer';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import { Partition, ScenarioName } from 'src/app/state/state';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { MapService, MapState } from '../map.service';
import BaseEvent from 'ol/events/Event';
import { Subscription, firstValueFrom } from 'rxjs';
import { maybeArraysEqual } from 'src/app/state/helpers';
import { FeatureLike } from 'ol/Feature';
import { TileWMS } from 'ol/source';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit, OnDestroy {

  @Input() scenario!: ScenarioName;
  @Input() partition!: Partition;
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('popup') popup!: ElementRef<HTMLDivElement>;
  @ViewChild('popupBody', { read: ViewContainerRef, static: true }) popupContainer!: ViewContainerRef;

  private baseLayers: Layer[] = getBaseLayers();
  private overlay = new Overlay({});
  private map!: OlMap;

  private olSubs: Map<'moveend' | 'click', (event: BaseEvent | Event) => unknown> = new Map();
  private subs: Subscription[] = [];

  constructor(
    private mapSvc: MapService,
    private changeDetector: ChangeDetectorRef,
    private zone: NgZone,
    private http: HttpClient
  ) {
      // no need to run this outside of zone
      this.map = new OlMap({
        layers: this.baseLayers,
        view: new View({
          projection: 'EPSG:4326',
          center: [0, 0],
          zoom: 0
        }),
        controls: [],
        overlays: [this.overlay]    
      });
  }

  ngOnDestroy(): void {
    this.olSubs.forEach((handler, key) => {
      this.map.un(key as any, handler);
    });
    this.subs.map(s => s.unsubscribe());
  }

  ngAfterViewInit(): void {
    if (this.mapContainer && this.popupContainer) {
  
      // needs to be outside of zone: only place where ol attaches to event-handlers
      this.zone.runOutsideAngular(() => {
        this.map.setTarget(this.mapContainer.nativeElement);
      });
      this.overlay.setElement(this.popup.nativeElement);


      /*********************************************************************
       *   SENDING OUT EVENTS TO STATE-MGMT
       *********************************************************************/

      const moveHandler = (evt: BaseEvent | Event) => {
        const zoom = this.map.getView().getZoom()!;
        const centerCoord = this.map.getView().getCenter()!;
        const center = [centerCoord[0], centerCoord[1]];
        
        // center == [0, 0]: comes from map-initialization. no need to handle this.
        if (center[0] === 0 && center[1] === 0) return;

        this.mapSvc.mapMove(this.scenario, this.partition, zoom, center);
      };
      
      const clickHandler = (evt: any) => {

        const location = evt.coordinate;
        const pixel = this.map.getPixelFromCoordinate(location);
        let clickedFeature: { compositeId: string, feature: any } | undefined = undefined;
        this.map.forEachFeatureAtPixel(pixel, (feature, layer, geometry) => {
          clickedFeature = { compositeId: layer.get("compositeId"), feature };
          return true;
        });

        this.mapSvc.mapClick(this.scenario, this.partition, location, clickedFeature);
      }

      // no need to run this outside of zone
      this.map.on('moveend', moveHandler);
      this.map.on('click', clickHandler);

      this.olSubs.set('moveend', moveHandler);
      this.olSubs.set('click', clickHandler);

      /*********************************************************************
       *   HANDLING EVENTS FROM STATE-MGMT
       *********************************************************************/

      const mapStateSub = this.mapSvc.getMapState(this.scenario, this.partition).subscribe(async mapState => {
          this.handleMove(mapState);
          this.handleLayers(mapState);
          await this.handleClick(mapState);
      });
      this.subs.push(mapStateSub);
    }
  }

  public closePopup() {
    this.mapSvc.closePopup(this.scenario, this.partition);
  }


  private handleMove(state: MapState) {
    if (
      this.map.getView().getZoom() !== state.zoom ||
      this.map.getView().getCenter()![0] !== state.center[0] ||
      this.map.getView().getCenter()![1] !== state.center[1]
    ) {
      this.map.getView().animate({
        center: state.center,
        zoom: state.zoom,
        duration: 100,
      })
    }
  }

  private handleLayers(mapState: MapState) {
    const layers = mapState.layerComposites.map(c => {
      const id = c.id;
      const layer = c.layer;
      layer.set("compositeId", id);
      layer.setOpacity(c.opacity);
      return layer;
    });
    this.map.setLayers([...this.baseLayers, ...layers]);
    // @TODO: set visibility from last time
  }


  private _lastClickLocation: number[] | undefined;
  private async handleClick(mapState: MapState) {
    const location = mapState.clickLocation;
    this.overlay.setPosition(location); 

    if (!location || maybeArraysEqual(this._lastClickLocation, location)) {
      this._lastClickLocation = location;
      return;
    } else {
      this._lastClickLocation = location;
    }

    const pixel = this.map.getPixelFromCoordinate(location);
    let clickedFeature: FeatureLike | undefined;
    let compositeId: string | undefined;

    // trying to get clicked feature from vector-layers ...
    this.map.forEachFeatureAtPixel(pixel, (feature, layer) => {
      if (this.baseLayers.includes(layer)) return false;
      clickedFeature = feature;
      compositeId = layer.get("compositeId");
      return true;
    });

    // ... trying to get feature from raster layers.
    if (!clickedFeature) {
      for (const layer of this.map.getAllLayers()) {
        if (!layer.getVisible() || (layer.getOpacity() <= 0.0) || this.baseLayers.includes(layer)) continue;
        const source = layer.getSource();
        if (source instanceof TileWMS) {
          const view = this.map.getView();
          const url = source.getFeatureInfoUrl(location, view.getResolution() || 10_000, view.getProjection(), { 'INFO_FORMAT': 'application/json' });
          if (url) {
            const result = await firstValueFrom(this.http.get(url));
            if (result) {
              const resultFeatures = new GeoJSON().readFeatures(result);
              clickedFeature = resultFeatures[0];
              compositeId = layer.get("compositeId");
              break;
            }
          }
        }
      }
    }

    // popup
    let madePopup = false;
    if (clickedFeature && compositeId) {
      for (const composite of mapState.layerComposites) {
        if (composite.opacity > 0.0 && composite.id === compositeId) {
          const popup = composite.popup(location, [clickedFeature]);
          if (!popup) break;
          else madePopup = true;
          const { component, args } = popup;
          this.popupContainer.clear();
          const componentRef = this.popupContainer.createComponent(component, { index: 0 });
          for (const key in args) {
            componentRef.instance[key] = args[key];
          }
          this.changeDetector.detectChanges();
          break;
        }
      }
    }
    
    // <-- not going over state-mgmt here. otherwise no popup showing up in `compare-two-scenarios` if second not already there.
    if (!madePopup) this.overlay.setPosition(undefined); // this.closePopup(); 

    // further click handling
    if (clickedFeature) {
      for (const composite of mapState.layerComposites) {
        if (composite.opacity > 0.0) {
          composite.onClick(location, [clickedFeature]);
        }
      }
    }
  }

}


function getBaseLayers() {
  const osmBase = new TileLayer({
    source: new OSM()
  });

  return [osmBase];
}