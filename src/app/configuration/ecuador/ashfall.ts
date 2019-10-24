import { WizardableProcess, WizardProperties } from 'src/app/components/config_wizard/wizardable_processes';
import { WpsProcess, ProcessStateUnavailable, Product, AutorunningProcess } from 'src/app/wps/wps.datatypes';
import { vei } from './lahar';
import { WpsData } from '@ukis/services-wps/src/public-api';
import { HttpClient } from '@angular/common/http';
import { VectorLayerData } from 'src/app/components/map/mappable_wpsdata';
import { toDecimalPlaces, linInterpolateHue } from 'src/app/helpers/colorhelpers';
import { StringSelectUconfProduct } from 'src/app/components/config_wizard/userconfigurable_wpsdata';
import { Style as olStyle, Fill as olFill, Stroke as olStroke, Circle as olCircle, Text as olText } from 'ol/style';
import { Feature as olFeature } from 'ol/Feature';
import { createKeyValueTableHtml } from 'src/app/helpers/others';
// import * as d3interp from 'd3-interpolate';


export const ashfallVei: Product & WpsData = {
    uid: 'ashfall_vei',
    description: {
        id: 'vei',
        type: 'literal',
        reference: false,
    },
    value: null,
};


export const AshfallTranslator: AutorunningProcess = {
    name: 'ashfall_translator',
    uid: 'ashfall_translator',
    state: new ProcessStateUnavailable(),
    requiredProducts: [vei.uid],
    providedProducts: [ashfallVei.uid],
    onProductAdded: (newProd: Product, allProds: Product[]) => {
        switch (newProd.uid) {
            case vei.uid:
                return [{
                    ...ashfallVei,
                    value: (newProd.value as string).replace('VEI', '')
                }];
            default:
                return [];
        }
    }

};


const allDepths = [];

export const ashfall: WpsData & Product & VectorLayerData = {
    uid: 'ashfall',
    description: {
        id: 'ashfall',
        reference: false,
        type: 'complex',
        format: 'application/vnd.geo+json',
        name: 'ashfall-depth',
        vectorLayerAttributes: {
            style: (feature: olFeature, resolution: number) => {
                const props = feature.getProperties();
                const thickness = props.thickness;
                allDepths.push(thickness);

                const hue = linInterpolateHue(0, 170, 100, 280, thickness);
                const colorString = `hsl(${hue}, 50%, 50%)`;

                // we can also repeat labels along each polygon-segment, roughly like this:
                // https://stackoverflow.com/questions/38391780/multiple-text-labels-along-a-linestring-feature

                return new olStyle({
                  fill: new olFill({
                    color: colorString,
                  }),
                  stroke: new olStroke({
                    color: [0, 0, 0, 1],
                    witdh: 2
                  }),
                  text: new olText({
                    font: 'bold 14px Calibri,sans-serif',
                    text: toDecimalPlaces(thickness as number, 1) + ' mm',
                    fill: new olFill({color: [0, 0, 0, 1]}),
                    stroke: new olStroke({color: colorString, width: 1}),
                    placement: 'line',
                    textAlign: 'left'
                    // maxAngle: maxAngle,
                    // overflow: true,
                  }),
                  zIndex: thickness * 100
                });
            },
            text: (properties) => {
                const thickness = properties['thickness'];
                if (thickness) {
                    allDepths.sort();
                    const nextBiggerThickness = allDepths.find(d => +d > +thickness);
                    let thicknessText: string;
                    if (nextBiggerThickness) {
                        thicknessText = `${toDecimalPlaces(thickness as number, 1)} - ${toDecimalPlaces(nextBiggerThickness as number, 1)} mm`;
                    } else {
                        thicknessText = `> ${toDecimalPlaces(thickness as number, 1)} mm`;
                    }

                    const selectedProperties = {
                        Thickness: thicknessText,
                        VEI: toDecimalPlaces(properties['vei'] as number, 1),
                        Probability: properties['prob'] + ' %'
                    };
                    return createKeyValueTableHtml('Ashfall', selectedProperties);
                }
            }
        }
    },
    value: null
};

export const probability: StringSelectUconfProduct & WpsData = {
    uid: 'ashfall_range_prob',
    description: {
        id: 'probability',
        type: 'literal',
        reference: false,
        options: ['1', '50', '99'],
        defaultValue: '50',
        wizardProperties: {
            fieldtype: 'stringselect',
            name: 'probability',
            description: 'probability of range',
        }
    },
    value: null
};


export class AshfallService extends WpsProcess implements WizardableProcess {

    wizardProperties: WizardProperties;

    constructor(http: HttpClient) {
        super(
            'ashfall-service',
            'Ashfall Service',
            [ashfallVei.uid, probability.uid],
            [ashfall.uid],
            'org.n52.dlr.riesgos.algorithm.CotopaxiAshfall',
            '',
            'http://riesgos.dlr.de/wps/WebProcessingService?',
            '1.0.0',
            http,
            new ProcessStateUnavailable(),
        );
        this.wizardProperties = {
            providerName: 'Instituto Geofísico EPN',
            providerUrl: 'https://www.igepn.edu.ec',
            shape: 'volcanoe'
        };
    }
}