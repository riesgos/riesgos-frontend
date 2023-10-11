import { Datum, Step } from "../../../scenarios/scenarios";
import { Bbox, getExposureModel } from "../../wpsServices";

async function getExposure(inputs: Datum[]) {

    const exposureSelection = inputs.find(i => i.id === 'exposureModelNameChile')!;

    const bbox: Bbox = {
        crs: 'EPSG:4326',
        lllon: -73,
        urlon:  -70,
        lllat: -35,
        urlat: -32
    }

    const { exposureModel, exposureRef } = await getExposureModel(exposureSelection.value, 'SARA_v1.0', bbox);
  
    return [{
        id: 'exposureChile',
        value: exposureModel
    }, {
        id: 'exposureRefChile',
        value: exposureRef
    }];
}



export const step: Step = {
    id: 'ExposureChile',
    title: 'Exposure',
    description: 'exposure_process_description',
    inputs: [{
        id: 'exposureModelNameChile',
        options: [
            'ValpCVTBayesian',
            'ValpCommuna',
            'ValpRegularOriginal',
            'ValpRegularGrid',
            'ValpOBM23Comunas',
            'ValpOBM23Region'
         ]
    }],
    outputs: [{
        id: 'exposureChile'
    }, {
        id: 'exposureRefChile'
    }],
    function: getExposure
};
