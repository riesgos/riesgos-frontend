import { Injectable } from '@angular/core';
import { Actions, ofType, Effect } from '@ngrx/effects';
import { WpsActions, EWpsActionTypes, ProductsProvided, ScenarioChosen,
        ClickRunProcess, WpsDataUpdate, RestartingFromProcess, RestaringScenario } from './wps.actions';
import { toGraphviz, toGraphvizDestructured } from './wps.graphviz';
import { map, switchMap, withLatestFrom, mergeMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Store, Action, select } from '@ngrx/store';
import { State } from 'src/app/ngrx_register';
import { NewProcessClicked } from 'src/app/focus/focus.actions';
import { WorkflowControl } from './wps.workflowcontrol';
import { QuakeLedger, inputBoundingbox, mmin, mmax, zmin,
        zmax, p, etype, tlon, tlat, selectedEqs } from '../configuration/chile/quakeledger';
import { inputBoundingboxPeru, QuakeLedgerPeru } from '../configuration/peru/quakeledger';
import { Shakyground, shakemapWmsOutput, shakemapXmlRefOutput } from '../configuration/chile/shakyground';
import { TsService, tsWms, lat, lon, mag, TsServiceTranslator, tsShakemap } from '../configuration/chile/tsService';
import { Process, Product } from './wps.datatypes';
import { LaharWps, direction, laharWms, intensity, parameter } from '../configuration/equador/lahar';
import { ExposureModel, lonmin, lonmax, latmin, latmax, exposureRef,
        assettype, schema, querymode } from '../configuration/chile/assetmaster';
import { VulnerabilityModel, assetcategory, losscategory, taxonomies, fragilityRef } from '../configuration/chile/modelProp';
import { selectedEq, EqSelection, userinputSelectedEq } from '../configuration/chile/eqselection';
import { hydrologicalSimulation, geomerFlood, durationTiff,
    velocityTiff, depthTiff, geomerFloodWcsProvider } from '../configuration/equador/geomerHydrological';
import { EqDeus, loss, eqDamage, eqTransition, eqUpdatedExposure } from '../configuration/chile/eqDeus';
import { PhysicalImpactAssessment, physicalImpact } from '../configuration/chile/pia';
import { DeusTranslator, fragilityRefDeusInput, shakemapRefDeusInput, exposureRefDeusInput } from '../configuration/chile/deusTranslator';
import { Reliability, country, hazard, damage_consumer_areas } from '../configuration/chile/reliability';
import { FlooddamageProcess, damageManzanas, damageBuildings, FlooddamageTranslator, damageManzanasGeojson } from '../configuration/equador/floodDamage';
import { LaharExposureModel, LaharVulnerabilityModel, lonminEcuador, lonmaxEcuador, latminEcuador, latmaxEcuador, LaharDeusTranslator } from '../configuration/equador/laharDamage';
import { FakeDeus } from '../configuration/others/fakeDeus';
import { WpsClient } from 'projects/services-wps/src/public-api';
import { VulnerabilityAndExposure } from '../configuration/chile/vulnAndExpCombined';
import { getScenarioWpsState } from './wps.selectors';
import { WpsScenarioState } from './wps.state';
import { Observable } from 'rxjs';
import { TsDeus, tsDamage, tsTransition, tsUpdatedExposure } from '../configuration/chile/tsDeus';




@Injectable()
export class WpsEffects {

    @Effect()
    RestaringScenario$ = this.actions$.pipe(
        ofType<WpsActions>(EWpsActionTypes.restartingScenario),
        switchMap((action: RestaringScenario) => {

            const newScenario = action.payload.scenario;
            const [procs, prods] = this.loadScenarioDataFresh(action.payload.scenario);

            this.wfc = new WorkflowControl(procs, prods);
            const processes = this.wfc.getProcesses();
            const products = this.wfc.getProducts();
            const graph = this.wfc.getGraph();

            const actions: Action[] = [];
            const wpsUpdate = new WpsDataUpdate({processes, products, graph});
            actions.push(wpsUpdate);
            if (processes.length > 0) {
                const processClicked = new NewProcessClicked({processId: processes[0].uid});
                actions.push(processClicked);
            }

            return actions;
        })
    );

    @Effect()
    scenarioChosen$ = this.actions$.pipe(
        ofType<WpsActions>(EWpsActionTypes.scenarioChosen),
        withLatestFrom(this.store$),
        switchMap(([action, state]: [ScenarioChosen, State]) => {

            const newScenario = action.payload.scenario;

            let procs: Process[];
            let prods: Product[];
            if (state.wpsState.scenarioData[newScenario]) {
                const scenarioData = state.wpsState.scenarioData[newScenario];
                procs = scenarioData.processStates;
                prods = scenarioData.productValues;
            } else {
                [procs, prods] = this.loadScenarioDataFresh(action.payload.scenario);
            }

            this.wfc = new WorkflowControl(procs, prods);
            const processes = this.wfc.getProcesses();
            const products = this.wfc.getProducts();
            const graph = this.wfc.getGraph();

            const actions: Action[] = [];
            const wpsUpdate = new WpsDataUpdate({processes, products, graph});
            actions.push(wpsUpdate);
            if (processes.length > 0) {
                const processClicked = new NewProcessClicked({processId: processes[0].uid});
                actions.push(processClicked);
            }

            return actions;
        })
    );

    @Effect()
    ProductsProvided = this.actions$.pipe(
        ofType<WpsActions>(EWpsActionTypes.productsProvided),
        map((action: ProductsProvided) => {

            for (const product of action.payload.products) {
                this.wfc.provideProduct(product.uid, product.value);
            }
            const processes = this.wfc.getProcesses();
            const products = this.wfc.getProducts();
            const graph = this.wfc.getGraph();
            return new WpsDataUpdate({processes, products, graph});

        })
    );


    @Effect()
    runProcessClicked$ = this.actions$.pipe(
        ofType<WpsActions>(EWpsActionTypes.clickRunProduct),
        mergeMap((action: ClickRunProcess) =>  {

            const newProducts = action.payload.productsProvided;
            const process = action.payload.process;
            for (const prod of newProducts) {
                this.wfc.provideProduct(prod.uid, prod.value);
            }
            return this.wfc.execute(process.uid,
                (response, counter) => {
                    if (counter < 1) {
                        this.store$.dispatch(new WpsDataUpdate({
                            processes: this.wfc.getProcesses(),
                            products: this.wfc.getProducts(),
                            graph: this.wfc.getGraph()
                        }));
                    }
            }).pipe(map(success => {
                return [success, process.uid];
            }));
        }),
        mergeMap(([success, processId]: [boolean, string]) => {
            const actions: Action[] = [];

            const processes = this.wfc.getProcesses();
            const products = this.wfc.getProducts();
            const graph = this.wfc.getGraph();
            const wpsUpdate = new WpsDataUpdate({processes, products, graph});
            actions.push(wpsUpdate);

            // We abstain from moving on to the next process for now, until we have a nice way of finding the next one in line.
            // let nextProcess = this.wfc.getNextActiveChildProcess(processId);
            // if (! nextProcess) {
            //     nextProcess = this.wfc.getActiveProcess();
            // }
            // if (nextProcess && success) {
            //     const processClicked = new NewProcessClicked({processId: nextProcess.id});
            //     actions.push(processClicked);
            // }

            return actions;

        })
    );


    @Effect()
    restartingFromProcess$ = this.actions$.pipe(
        ofType<WpsActions>(EWpsActionTypes.restartingFromProcess),
        map((action: RestartingFromProcess) => {

            this.wfc.invalidateProcess(action.payload.process.uid);
            const processes = this.wfc.getProcesses();
            const products = this.wfc.getProducts();
            const graph = this.wfc.getGraph();
            return new WpsDataUpdate({processes, products, graph});

        })
    );



    private wfc: WorkflowControl;

    constructor(
        private actions$: Actions,
        private store$: Store<State>,
        private httpClient: HttpClient,
        ) {
        // this.wfc = new WorkflowControl([], [], this.httpClient);
    }


    private loadScenarioData(scenario: string): Observable<[Process[], Product[]]> {
        // @TODO: per default, load data from store.
        return this.store$.select(getScenarioWpsState, {scenario}).pipe(map((scenarioState: WpsScenarioState) => {
            if (scenarioState) {
                return [scenarioState.processStates, scenarioState.productValues];
            } else {
                return this.loadScenarioDataFresh(scenario);
            }
        }));
    }


    private loadScenarioDataFresh(scenario: string): [Process[], Product[]] {
        let processes: Process[] = [];
        let products: Product[] = [];
        switch (scenario) {
            case 'c1':
                processes = [
                    new VulnerabilityAndExposure(this.httpClient),
                    new QuakeLedger(this.httpClient),
                    EqSelection,
                    new Shakyground(this.httpClient),
                    DeusTranslator,
                    //EqDeus,
                    new FakeDeus(this.httpClient),
                    TsServiceTranslator,
                    new TsService(this.httpClient),
                    new TsDeus(this.httpClient),
                    new Reliability(this.httpClient),
                    // PhysicalImpactAssessment
                ];
                products = [
                    lonmin, lonmax, latmin, latmax, assettype, schema, querymode, exposureRef,
                    assetcategory, losscategory, taxonomies, fragilityRef,
                    inputBoundingbox, mmin, mmax, zmin, zmax, p, etype, tlon, tlat,
                    selectedEqs, userinputSelectedEq,
                    selectedEq, shakemapWmsOutput, shakemapXmlRefOutput,
                    loss, eqDamage, eqTransition, eqUpdatedExposure,
                    tsDamage, tsTransition, tsUpdatedExposure,
                    lat, lon, mag, tsWms, tsShakemap,
                    fragilityRefDeusInput, shakemapRefDeusInput, exposureRefDeusInput,
                    country, hazard, damage_consumer_areas
                    // physicalImpact
                ];
                break;
            case 'e1':
                processes = [
                    new LaharWps(this.httpClient),
                    new LaharVulnerabilityModel(this.httpClient),
                    new LaharExposureModel(this.httpClient),
                    LaharDeusTranslator,
                    // Deus,
                    geomerFlood,
                    geomerFloodWcsProvider,
                    new FlooddamageProcess(this.httpClient),
                    FlooddamageTranslator
                ];
                products = [
                    direction, intensity, parameter, laharWms,
                    schema, assetcategory, losscategory, taxonomies,
                    lonminEcuador, lonmaxEcuador, latminEcuador, latmaxEcuador, querymode, assettype,
                    fragilityRef, exposureRef,
                    fragilityRefDeusInput, exposureRefDeusInput,
                    hydrologicalSimulation,
                    durationTiff, velocityTiff, depthTiff, damageManzanas, damageBuildings,
                    damageManzanasGeojson
                ];
                break;
            case 'p1':
                processes = [
                    QuakeLedgerPeru,
                    new VulnerabilityAndExposure(this.httpClient),
                    EqSelection,
                    new Shakyground(this.httpClient),
                    DeusTranslator,
                    // Deus,
                    new FakeDeus(this.httpClient),
                    TsServiceTranslator,
                    new TsService(this.httpClient),
                    new Reliability(this.httpClient),
                    new PhysicalImpactAssessment(this.httpClient)
                ];
                products = [
                    inputBoundingboxPeru, mmin, mmax, zmin, zmax, p, etype, tlon, tlat,
                    selectedEqs, userinputSelectedEq,
                    selectedEq, shakemapWmsOutput, shakemapXmlRefOutput,
                    lat, lon, mag, tsWms
                ];
                break;
            default:
                throw new Error(`Unknown scenario ${scenario}`);
        }

        return [processes, products];
    }

}
