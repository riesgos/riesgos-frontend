import { Map } from 'ol';
import { Layer } from 'ol/layer';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import RenderEvent from 'ol/render/Event';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import Interaction from 'ol/interaction/Interaction';
import Collection from 'ol/Collection';
import { canvasToImage } from 'src/app/helpers/custom_renderers/engine/engine.helpers';




function downloadURI(uri: string, name: string) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  
export function flattenLayers(layers: BaseLayer[]): Layer<any>[] {
    let flattenedLayers: Layer<any>[] = [];
    for (const layer of layers) {
        if (layer instanceof LayerGroup) {
            const subLayers = layer.getLayers().getArray();
            const flattenedSubLayers = flattenLayers(subLayers);
            flattenedLayers = Array.prototype.concat(flattenedLayers, flattenedSubLayers);
        } else {
            // this cast is ok: since `layer` is no LayerGroup, it must be a Layer.
            // See the `Subclasses` section here: https://openlayers.org/en/latest/apidoc/module-ol_layer_Base-BaseLayer.html
            flattenedLayers.push(layer as Layer<any>);
        }
    }
    return flattenedLayers;
}



/** Experimental: This is an experimental technology Check the Browser compatibility table carefully before using this in production. */
/**
 * Merges all layers of a map into one canvas image.
 * Assumes that the ``targetCanvas`` has the same size as the map! If it doesn't, use `scaledMapToSingleCanvas` instead.
 * Create a target-canvas of an appropriate size.
 *  1. Trigger a layer-re-render.
 *  2. For each layer, we capture the 'postrender' event ...
 *  3. ... and copy the canvas-bitmap into the target.
 *
 * Note: if the user moves the original map while the render-process is still ongoing, this can distort the output.
 * We would suggest to deactivate user-interactions until the 'onDone' callback has been received.
 *
 * Note also: Before passing the canvas, set its drawing-buffer size: `canvas.width` and `canvas.height`.
 * This is the size of the actually drawn image in pixels.
 * Note that this value may differ from clientWidth/clientHeight: that is the size to which the actual image is scaled to in the DOM.
 */
export function mapToSingleCanvas(map: Map, targetCanvas: HTMLCanvasElement,
    onDone: (updatedTargetCanvas: HTMLCanvasElement) => void, keepSynced = false): void {

    // Step 0: inspecting targetCanvas
    const targetContext = targetCanvas.getContext('2d');
    if (!targetContext) {
        throw new Error('The target-canvas needs to use a 2d-context.');
    }
    if (!targetCanvas.width || !targetCanvas.height) {
        throw new Error('TargetCanvas: width or height have not been set.');
    }

    if (targetContext instanceof CanvasRenderingContext2D) {
        targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    }


    const mapSize = map.getSize();
    targetCanvas.width = mapSize[0];
    targetCanvas.height = mapSize[1];

    const layers = flattenLayers(map.getLayers().getArray());
    const subscriptions: EventsKey[] = [];
    for (const layer of layers) {
        if (layer.getVisible() && layer.getOpacity() > 0.0) {
            // if (layer.get('id').includes('osm')) continue;  // osm is tainted and cannot be printed

            // Step 2: catch each layer's postrender event.
            // Note that ol/renderer/webgl/* does not call `this.postRender(context, frameState)`
            // in `renderFrame` - so heatmaps won't be copied here!
            const key = layer.on('postrender', (event: RenderEvent) => {
                const sourceContext = event.context;
                if (sourceContext instanceof CanvasRenderingContext2D) {
                    const sourceCanvas = sourceContext.canvas as HTMLCanvasElement;
                    // Step 3: copy source bitmap to target-canvas.
                    targetContext.drawImage(sourceCanvas, 0, 0, sourceCanvas.clientWidth, sourceCanvas.clientHeight, 0, 0, targetCanvas.width, targetCanvas.height);
                } else if (sourceContext instanceof WebGL2RenderingContext) {
                    const sourceCanvas = sourceContext.canvas as HTMLCanvasElement;
                    const image = canvasToImage(sourceCanvas);
                    // downloadURI(sourceCanvas.toDataURL('image/png'), 'image.png'); <-- image is correctly rendered out of webgl.
                    targetContext.drawImage(image, 0, 0, image.width, image.height, 0, 0, targetCanvas.width, targetCanvas.height);
                }
            });
            if (Array.isArray(key)) {
                key.map(k => subscriptions.push(k));
            } else {
                subscriptions.push(key);
            }
        }
    }

    if (keepSynced) {
        map.on('rendercomplete', (evt: RenderEvent) => {
            onDone(targetCanvas);
        });
    } else {
        // if we don't want the canvas to remain in sync with the map, we unsubscribe to further changes here.
        map.once('rendercomplete', (evt: RenderEvent) => {
            // note that a map-render-event does not have a context ... contrary to a layer-render-event.
            for (const key of subscriptions) {
                unByKey(key);
            }
            onDone(targetCanvas);
        });
    }

    // Step 1: trigger a re-render of the map.
    map.renderSync();

}


/**
 * Copies a map's layers onto a single canvas.
 * For this, we ...
 *  1. Update the original map's size to match the target-canvas.
 *  2. Get an image of the scaled map
 *  3. Reset the map's dimensions to the initial values.
 *
 * Note: if the user moves the original map while the render-process is still ongoing, this can distort the output.
 * We would suggest to deactivate user-interactions until the 'done' callback has been received.
 *
 * Note also: Before passing the canvas, set its drawing-buffer size: `canvas.width` and `canvas.height`.
 * This is the size of the actually drawn image in pixels.
 * Note that this value may differ from clientWidth/clientHeight: that is the size to which the actual image is scaled to in the DOM.
 */
export function scaledMapToSingleCanvas(map: Map, targetCanvas: HTMLCanvasElement,
    onDone: (updatedTargetCanvas: HTMLCanvasElement) => void, keepSynced = false): void {
    /* An alternative approach would be to create a new map with the desired size and copies of the old map's layers.
     * This way we wouldn't have to mess with the original map's size.
     * But unfortunately openlayers provides no means of cloning a layer.
     * I could not find one, either: neither of JSON.parse, lodash.cloneDeep, ramda.clone or rfdc works here.
     */

    // Step 1: adjust map-size to match targetCanvas.
    const initialMapSize = map.getSize();
    const initialMapResolution = map.getView().getResolution();
    map.setSize([targetCanvas.width, targetCanvas.height]);
    const scale = Math.min(targetCanvas.width / initialMapSize[0], targetCanvas.height / initialMapSize[1]);
    map.getView().setResolution(initialMapResolution / scale);

    // Step 2: get image of scaled map
    mapToSingleCanvas(map, targetCanvas, (updatedTargetCanvas: HTMLCanvasElement) => {
        // Step 3: set map-size back to initial values.
        map.setSize(initialMapSize);
        map.getView().setResolution(initialMapResolution);
        onDone(updatedTargetCanvas);
    }, keepSynced);
}


/**
 * A comfort-function for getting a snapshot of a map into a canvas.
 * Halts all map-interactions to prevent the user from panning the map during rendering.
 * Sets the canvas' internal drawing-buffer-size: this way, the canvas' contents can be exported
 * in the drawing-buffer-size, which may differ from the display-size (the latter is set by the DOM/CSS).
 *
 * Example usage:
 * ```
 *   previewButton.addEventListener('click', () => {
 *   simpleMapToCanvas(map, previewCanvas, paper.widthPx, paper.heightPx, (updated) => {
 *       console.log('done');
 *   });
 *   downloadButton.addEventListener('click', () => {
 *      downloadUrl(previewCanvas.toDataURL('image/png'), 'full');
 *   });
 * ```
 */
export function simpleMapToCanvas(map: Map, targetCanvas: HTMLCanvasElement, drawingBufferWidth?: number, drawingBufferHeight?: number,
    onDone?: (canvas: HTMLCanvasElement) => void, keepSynced = false) {

    // Halting interactions: prevents user from panning map during drawing process.
    const interactions = map.getInteractions();
    interactions.forEach((interaction: Interaction) => {
        interaction.setActive(false);
    });

    if (drawingBufferHeight && drawingBufferWidth) {
        // Before passing the canvas, set its drawing-buffer size: `canvas.width` and `canvas.height`.
        // This is the size of the actually drawn image in pixels.
        // Note that this value may differ from clientWidth/clientHeight:
        // that is the size to which the actual image is scaled to in the DOM.
        targetCanvas.width = drawingBufferWidth;
        targetCanvas.height = drawingBufferHeight;
    }

    scaledMapToSingleCanvas(map, targetCanvas, (updatedCanvas) => {

        // reactivating interactions
        interactions.forEach((interaction: Interaction) => {
            interaction.setActive(true);
        });

        if (onDone) {
            onDone(updatedCanvas);
        }
    }, keepSynced);
}



/**
 * Get a item from ol/Collection by ID
 * @returns ol/Collection item and the index in the collection array
 */
export function getCollectionItem(id: string, collection: Collection<BaseLayer | LayerGroup>, idKey = 'id') {
    let item: null | { index: number, layer: BaseLayer | LayerGroup } = null;
    collection.getArray().find((l, index) => {
        const lID = l.get(idKey);
        if (lID === id) {
            item = {
                index: index,
                layer: l
            };
            return true;
        }
    });
    return item;
}

/**
 * setVisible for all layers in ol/layer/Group
 * 
 * OpenLayers does not handle handle child layers
 * https://github.com/openlayers/openlayers/issues/3837
 * 
 * so if anyone uses map.getAllLayers the visibility for the group and their child is not the same
 */
export function layerOrGroupSetVisible(lg: LayerGroup | BaseLayer, visible: boolean, skipGroup = false) {
    lg.setVisible(visible);
    if (!skipGroup && lg instanceof LayerGroup) {
        const collection = lg.getLayers();
        // Sublayers of groups are not updated directly from ol/layer/Group
        collection.forEach(l => {
            layerOrGroupSetVisible(l, visible);
        });
    }
}

/**
 * setOpacity for all layers in ol/layer/Group
 * 
 * OpenLayers does not handle handle child layers
 * https://github.com/openlayers/openlayers/issues/3837
 * 
 * @param opacity number from 0 - 1
 */
export function layerOrGroupSetOpacity(lg: LayerGroup | BaseLayer, opacity: number, skipGroup = false) {
    lg.setOpacity(opacity);
    if (!skipGroup && lg instanceof LayerGroup) {
        const collection = lg.getLayers();
        // Sublayers of groups are not updated directly from ol/layer/Group
        collection.forEach(l => {
            layerOrGroupSetOpacity(l, opacity);
        });
    }
}


/**
 * setZIndex for all layers in ol/layer/Group
 * 
 * appendToZIndex - appends this number to the index so you can change the zIndex
 */
export function layerOrGroupSetZIndex(lg: BaseLayer | LayerGroup, index: number, appendToZIndex?: number) {
    const newZIndex = (appendToZIndex > 0) ? index + appendToZIndex : index;
    lg.setZIndex(newZIndex);

    // addresses an issue in openlayers: https://github.com/openlayers/openlayers/issues/6654
    if (lg instanceof LayerGroup) {
        const collection = lg.getLayers();
        // Set the index of the group layers to the same as the group.
        // This is also done in olLayerGroup [getLayerStatesArray](https://github.com/openlayers/openlayers/blob/v7.1.0/src/ol/layer/Group.js#L288-L289) if not set
        // but not if you get layers from the map e.g. map.getAllLayers()
        collection.forEach(l => {
            layerOrGroupSetZIndex(l, index, appendToZIndex);
        });
    }
}


/**
 * moves the item in the collection to the index
 */
export function collectionItemSetIndex(lg: BaseLayer | LayerGroup, index: number, collection: Collection<BaseLayer>) {
    collection.remove(lg);
    collection.insertAt(index, lg);
}