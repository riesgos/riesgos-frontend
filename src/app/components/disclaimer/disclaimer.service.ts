import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DisclaimerService {

  public alertClosed = false;
  constructor() { }
}
