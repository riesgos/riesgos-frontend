import { Process, WpsProcess, ProcessState } from 'src/app/wps/wps.datatypes';
import { WpsVerion } from '@ukis/services-wps/src/public-api';
import { HttpClient } from '@angular/common/http';


export interface WizardProperties {
    shape: 'dot-circle' | 'earthquake' | 'avalance' | 'tsunami' | 'volcanoe' | 'critical_infrastructure' | 'vulnerability' | 'exposure' | 'bolt' | 'flame' | 'bullseye' | 'target' | 'router' | 'building';
    providerName: string;
    providerUrl: string;
}


export interface WizardableProcess extends Process {
    readonly wizardProperties: WizardProperties;
}


export const isWizardableProcess = (process: Process): process is WizardableProcess => {
    return process['wizardProperties'] !== undefined && process['wizardProperties']['shape'] !== undefined;
}