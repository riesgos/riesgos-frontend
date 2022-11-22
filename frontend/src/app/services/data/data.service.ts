import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { isRiesgosProductRef, isRiesgosProductResolved, RiesgosProduct, RiesgosProductResolved } from 'src/app/riesgos/riesgos.state';
import { ConfigService } from '../configService/configService';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private cache: {[key: string]: any} = {};

  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) { }

  resolveReferences(products: RiesgosProduct[]): Observable<RiesgosProductResolved[]> {
    const pendingRequests$ = products.map(p => this.resolveReference(p));
    return forkJoin(pendingRequests$);
  }

  resolveReference(product: RiesgosProduct): Observable<RiesgosProductResolved> {
    if (isRiesgosProductResolved(product)) {
      return of(product);
    } else if (isRiesgosProductRef(product)) {
      const link = product.reference;
      const value$ = this.fetchFromLink(link);
      return value$.pipe(
        map(v => {
          const resolvedProduct: RiesgosProductResolved = {
            id: product.id,
            value: v
          };
          return resolvedProduct;
        })
      );
    }
  }

  private fetchFromLink(link: string): Observable<any> {
    if (link in this.cache) return of(this.cache[link]);
    const url = this.config.getConfig().middlewareUrl;
    return this.http.get(`${url}/files/${link}`).pipe(
      tap(data => this.cache[link] = data)
    );
  }
}
