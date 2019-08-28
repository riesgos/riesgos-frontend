import { Component, OnInit, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { State } from 'src/app/ngrx_register';
import {  StringSelectUconfProduct } from '../userconfigurable_wpsdata';
import { ProductsProvided } from 'src/app/wps/wps.actions';

@Component({
    selector: 'ukis-form-stringselect-field',
    templateUrl: './form-stringselect-field.component.html',
    styleUrls: ['./form-stringselect-field.component.scss']
})
export class FormStringselectFieldComponent implements OnInit {

    @Input() parameter: StringSelectUconfProduct;
    public options: string[];
    public activeSelection: string;


    constructor(private store: Store<State>) { }

    ngOnInit() {
        this.options = this.parameter.description.options;
        this.activeSelection = this.parameter.value || this.parameter.description.defaultValue || this.parameter.description.options[0];
    }


    onChange(newValString) {
        this.activeSelection = newValString;
        this.store.dispatch(new ProductsProvided({
            products: [{
                ...this.parameter,
                value: newValString
            }]
        }));
    }
}
