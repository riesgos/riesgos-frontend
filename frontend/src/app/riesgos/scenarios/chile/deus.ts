import { WpsProcess, ProcessStateUnavailable } from 'src/app/riesgos/riesgos.datatypes';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';


export class Deus extends WpsProcess {
    constructor(http: HttpClient) {
        super(
            'deus',
            'DEUS',
            ['intensity', 'exposure', 'schema', 'fragility'],
            ['updated_exposure', 'transition', 'damage'],
            'org.n52.gfz.riesgos.algorithm.impl.DeusProcess',
            'This service returns damage caused by the selected earthquake.',
            `https://rz-vm140.gfz-potsdam.de:${ environment.production ? '' : '8443' }/wps/WebProcessingService`,
            '1.0.0',
            http,
            new ProcessStateUnavailable()
        );
    }
}
