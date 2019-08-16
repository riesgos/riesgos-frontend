import { Component, OnInit, Input } from '@angular/core';
import { UtilStoreService } from '@ukis/services-util-store';
import { Form, FormControl, Validators } from '@angular/forms';
import { Store, select } from '@ngrx/store';
import { State } from 'src/app/ngrx_register';
import { getFullWpsState } from 'src/app/wps/wps.selectors';
import { WpsState } from 'src/app/wps/wps.state';
import { WpsDataUpdate, ScenarioChosen } from 'src/app/wps/wps.actions';


interface StorageRow {
    name: string;
    date: Date;
    data: WpsState;
}

@Component({
    selector: 'ukis-save-buttons',
    templateUrl: './save-button.component.html',
    styleUrls: ['./save-button.component.scss']
})
export class SaveButtonComponent implements OnInit {

    showResetModal = false;
    showRestoreModal = false;
    showStoreModal = false;
    nameControl: FormControl;
    dataStorage: StorageRow[] = [];
    selectedStorageRow: StorageRow;
    private currentState: WpsState;

    constructor(
        private storageService: UtilStoreService,
        private store: Store<State>
    ) {
        this.nameControl = new FormControl('Save state', [Validators.required]);
    }

    ngOnInit() {
        this.store.pipe(select(getFullWpsState)).subscribe((state: WpsState) => {
            this.currentState = state;
        });
    }

    storeRow(): void {
        const name = this.nameControl.value;
        const data = this.currentState;
        this.dataStorage.push({
            name: name,
            data: data,
            date: new Date()
        });
        this.showStoreModal = false;
    }

    restoreSelectedRow(): void {
        if (this.selectedStorageRow) {
            const processes = this.selectedStorageRow.data.processStates;
            const products = this.selectedStorageRow.data.productValues;
            const graph = this.selectedStorageRow.data.graph;
            this.store.dispatch(new WpsDataUpdate({processes, products, graph}));
        }
        this.showRestoreModal = false;
    }

    onResetClicked(): void {
        const currentScenario = this.currentState.scenario;
        this.store.dispatch(new ScenarioChosen({scenario: currentScenario}));
        this.showResetModal = false;
    }

}
