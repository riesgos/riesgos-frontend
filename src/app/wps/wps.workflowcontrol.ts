import { Process, Product, ProcessId, ProcessState, isWatchingProcess, isWpsProcess, WpsProcess,
    ProcessStateRunning, ProcessStateCompleted, ProcessStateError, ProcessStateTypes,
    ProcessStateUnavailable, ProcessStateAvailable, isCustomProcess, CustomProcess } from './wps.datatypes';
import { Graph, alg } from 'graphlib';
import { ProductId, WpsData, WpsDataDescription } from 'projects/services-wps/src/lib/wps_datatypes';
import { HttpClient } from '@angular/common/http';
import { map, tap, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { WpsClient } from 'projects/services-wps/src/public-api';


export class WorkflowControl {

    private processes: Process[];
    private products: Product[];
    private graph: Graph;
    private wpsClient: WpsClient;

    constructor(processes: Process[], products: Product[], httpClient: HttpClient) {

        this.checkDataIntegrity(processes, products);

        this.wpsClient = new WpsClient('1.0.0', httpClient);

        this.graph = new Graph({ directed: true });
        for (const process of processes) {
            for (const inProdId of process.requiredProducts) {
                this.graph.setEdge(inProdId, process.id);
            }
            for (const outProdId of process.providedProducts) {
                this.graph.setEdge(process.id, outProdId);
            }
        }

        if (!alg.isAcyclic(this.graph)) {
            console.log('Graph: ', Graph.json.write(this.graph));
            throw new Error('Process graphs with cycles are not supported');
        }

        this.products = products;
        this.processes = this.getProcessesInExecutionOrder(processes);
        this.processes = this.processes.map(p => {
            return {
                ...p,
                state: this.calculateState(p.id)
            };
        });
    }


    execute(id: ProcessId, doWhileRequesting?: (response: any, counter: number) => void): Observable<boolean> {
        const process = this.getProcess(id);
        if (isWpsProcess(process)) {
            return this.executeWps(id, doWhileRequesting);
        } else if (isCustomProcess(process)) {
            return this.executeCustom(id, doWhileRequesting);
        } else {
            throw new Error(`Tried to execute a non-executable process ${id}`);
        }
    }

    private executeCustom(id: ProcessId, doWhileRequesting?: (response: any, counter: number) => void): Observable<boolean> {

        const process = this.getCustomProcess(id);
        const inputs = this.getProcessInputs(id);

        return process.execute(inputs).pipe(
            tap((outputs: Product[]) => {
                for (const product of outputs) {
                    this.provideProduct(product.uid, product.value);
                }
                this.setProcessState(process.id, new ProcessStateCompleted());
            }),

            map((outputs: Product[]) => {
                return true;
            }),

            catchError((error) => {
                this.setProcessState(process.id, new ProcessStateError(error.message));
                console.error(error);
                return of(false);
            })
        );

    }

    private executeWps(id: ProcessId, doWhileRequesting?: (response: any, counter: number) => void): Observable<boolean> {

        let process = this.getWpsProcess(id);
        const inputs = this.getProcessInputs(id) as WpsData[];
        const outputProducts = this.getProducts(process.providedProducts) as (Product & WpsData)[];
        const outputDescriptions = outputProducts.map(p => p.description) as WpsDataDescription[];

        process = this.setProcessState(process.id, new ProcessStateRunning()) as WpsProcess;
        let requestCounter = 0;
        return this.wpsClient.executeAsync(process.url, process.id, inputs, outputDescriptions, 1000,

            (response: any) => {
                if (doWhileRequesting) {
                    doWhileRequesting(response, requestCounter);
                }
                requestCounter += 1;
            }

        ).pipe(

            map((outputs: WpsData[]) => {
                // Ugly little hack: if outputDescription contained any information that has been lost in translation
                // through marshalling and unmarshalling, we add it here back in.
                for (let i = 0; i < outputs.length; i++) {
                    const outputDescription = outputDescriptions[i];
                    const output = outputs[i];
                    for (const key in outputDescription) {
                        if (!output.description.hasOwnProperty(key)) {
                            output.description[key] = outputDescription[key];
                        }
                    }
                }
                return outputs;
            }),

            tap((outputs: WpsData[]) => {
                const products = this.assignWpsDataToProducts(outputs, outputProducts);
                for (const product of products) {
                    this.provideProduct(product.uid, product.value);
                }
                this.setProcessState(process.id, new ProcessStateCompleted());
            }),

            map((output: WpsData[]) => {
                return true;
            }),

            catchError((error) => {
                this.setProcessState(process.id, new ProcessStateError(error.message));
                console.error(error);
                return of(false);
            })
        );

    }


    getProcesses(ids?: ProcessId[]): Process[] {
        if (!ids) {
            return this.processes;
        } else {
            return this.processes.filter(p => ids.includes(p.id));
        }
    }


    getProducts(ids?: ProductId[]): Product[] {
        if (!ids) {
            return this.products;
        } else {
            return this.products.filter(p => ids.includes(p.uid));
        }
    }

    getGraph(): Graph {
        return this.graph;
    }


    provideProduct(id: ProductId, value: any): void {
        // @TODO: providing a new input-product to an already completed processes should set its state back to available.

        // set new value
        const newProduct = this.setProductValue(id, value);

        // allow watching processes to add or change further products
        for (const process of this.processes) {
            if (isWatchingProcess(process)) {
                const additionalProducts = process.onProductAdded(newProduct, this.products);
                for (const additionalProduct of additionalProducts) {
                    this.updateProduct(additionalProduct); // @TODO: maybe even call provideProduct here?
                }
            }
        }

        // update state of all downstream processes
        this.updateProcessStatesDownstream(id);
    }


    getActiveProcesses(): Process[] {
        return this.processes.filter(p => p.state.type === ProcessStateTypes.available);
    }


    getActiveProcess(): Process | undefined {
        return this.processes.find(p => p.state.type === ProcessStateTypes.available);
    }


    getNextActiveChildProcess(id: ProcessId): Process | undefined {
        const productIds: string[] = this.graph.outEdges(id).map(edge => edge.w);
        for (const productId of productIds) {
            const childProcessIds: ProcessId[] = this.graph.outEdges(productId).map(edge => edge.w);
            for (const childProcessId of childProcessIds) {
                const childProcess = this.getProcess(childProcessId);
                if (childProcess.state.type === ProcessStateTypes.available) {
                    return childProcess;
                }
            }
        }
        return undefined;
    }


    private updateProcessStatesDownstream(id: string): void {

        if (this.isProcess(id)) {
            this.setProcessState(id, this.calculateState(id));
        }

        const outEdges = this.graph.outEdges(id);
        for (const outEdge of outEdges) {
            const targetId = outEdge.w;
            this.updateProcessStatesDownstream(targetId);
        }
    }


    invalidateProcess(id: ProcessId): void {

        const outputEdges = this.graph.outEdges(id);
        for (const outputEdge of outputEdges) {
            const productId = outputEdge.w;
            this.setProductValue(productId, null);

            const nextInputEdges = this.graph.outEdges(productId);
            for (const nextInputEdge of nextInputEdges) {
                const processId = nextInputEdge.w;
                this.invalidateProcess(processId);
            }
        }
        this.setProcessState(id, this.calculateState(id));

    }


    private getProcessInputs(id: ProcessId): Product[] {
        const process = this.getProcess(id);
        const productIds = process.requiredProducts;
        const products = productIds.map(prodId => this.getProduct(prodId));
        return products;
    }


    private getWpsProcess(id: ProcessId): WpsProcess {
        const process = this.getProcess(id);
        if (!isWpsProcess(process)) {
            throw new Error(`is not a WpsProcess: ${process.id}`);
        } else {
            return process;
        }
    }

    private getCustomProcess(id: ProcessId): CustomProcess {
        const process = this.getProcess(id);
        if (!isCustomProcess(process)) {
            throw new Error(`is not a CustomProcess: ${process.id}`);
        } else {
            return process;
        }
    }


    public getProcess(id: ProcessId): Process {
        const process = this.processes.find(p => p.id === id);
        if (!process) {
            throw new Error(`no such process: ${id}`);
        }
        return process;
    }


    private isProcess(id: string): boolean {
        return this.processes.map(p => p.id).includes(id);
    }


    private getProduct(id: ProductId): Product {
        const product = this.products.find(p => p.uid === id);
        if (!product) {
            throw new Error(`no such product: ${id}`);
        }
        return product;
    }


    private setProcessState(id: ProcessId, state: ProcessState): Process {
        this.processes = this.processes.map(process => {
            if (process.id === id) {
                return {
                    ...process,
                    state
                };
            }
            return process;
        });
        return this.getProcess(id);
    }


    private setProductValue(id: ProductId, value: any): Product {
        this.products = this.products.map(product => {
            if (product.uid === id) {
                return {
                    ...product,
                    value
                };
            }
            return product;
        });
        return this.getProduct(id);
    }


    // sometimes we need to update the whole product;
    // for example when we want to change the select-options under description.wizardProps.options
    private updateProduct(newProduct: Product): void {
        this.products = this.products.map(product => {
            if (product.uid === newProduct.uid) {
                return {...newProduct};
            }
            return product;
        });
    }


    private getProcessesInExecutionOrder(processes: Process[]): Process[] {
        const allIds = alg.topsort(this.graph);
        const processIds = processes.map(proc => proc.id);
        const sortedProcessIds = allIds.filter(id => processIds.includes(id));
        const sortedProcesses = sortedProcessIds.map(id => processes.find(proc => proc.id === id) );
        return sortedProcesses;
    }


    private calculateState(id: ProcessId): ProcessState {

        const process = this.getProcess(id);
        const internalUpstreamProducts = process.requiredProducts.filter(prdId => this.hasProvidingProcess(prdId));
        const userprovidedProducts = process.requiredProducts.filter(prdId => !this.hasProvidingProcess(prdId));

        // currently running?
        if (process.state.type === ProcessStateTypes.running) {
            return new ProcessStateRunning();
        }

        // is the output there? -> complete
        const outputs = this.getProducts(process.providedProducts);
        const unfinishedOutputs = outputs.filter(prd => prd.value === null);
        if (unfinishedOutputs.length === 0) {
            return new ProcessStateCompleted();
        }

        // is any internal input missing? -> unavailable
        for (const prodId of internalUpstreamProducts) {
            const product = this.getProduct(prodId);
            if (!product.value) {
                return new ProcessStateUnavailable();
            }
        }

        return new ProcessStateAvailable();
    }


    private hasProvidingProcess(id: ProductId): boolean {
        const inEdges = this.graph.inEdges(id);
        if (inEdges.length < 1) {
            return false;
        }
        return true;
    }


    private checkDataIntegrity(processes: Process[], products: Product[]): void {
        const processIds = processes.map(p => p.id);
        const productIds = products.map(p => p.uid);

        const requiredProducts: string[] = [];
        for (const process of processes) {
            for (const productId of process.requiredProducts) {
                requiredProducts.push(productId);
            }
            for (const productId of process.providedProducts) {
                requiredProducts.push(productId);
            }
        }

        for (const reqiredProd of requiredProducts) {
            if (!productIds.includes(reqiredProd)) {
                throw new Error(`${reqiredProd} is required but not provided to context`);
            }
        }

        const processDuplicates = this.getDuplicates(processIds);
        if (processDuplicates.length > 0) {
            throw new Error(`Duplicate processes: ${processDuplicates}`);
        }

        const productDuplicates = this.getDuplicates(productIds);
        if (productDuplicates.length > 0) {
            throw new Error(`Duplicate products: ${productDuplicates}`);
        }

        for (const product of products) {
            if (product.value) {
                console.log("product already has a value", product)
            }
        }
    }

    private getDuplicates(arr: string[]): string[] {
        const sortedArr = arr.slice().sort();

        const duplicates: string[] = [];
        for (let i = 0; i < sortedArr.length - 1; i++) {
            if (sortedArr[i + 1] === sortedArr[i]) {
                duplicates.push(sortedArr[i]);
            }
        }

        return duplicates;
    }

    private assignWpsDataToProducts(wpsData: WpsData[], initialProds: (Product & WpsData)[]): Product[] {
        const out: Product[] = [];

        for (const prod of initialProds) {
            const equivalentWpsData = wpsData.find(data => {
                return (
                    data.description.id === prod.description.id &&
                    data.description.format === prod.description.format &&
                    data.description.reference === prod.description.reference && 
                    data.description.type === prod.description.type
                );
            });

            if (equivalentWpsData) {
                out.push({
                    ...equivalentWpsData,
                    uid: prod.uid
                });
            }

        }

        return out;
    }
}
