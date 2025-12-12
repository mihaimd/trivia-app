import { Injectable, signal, WritableSignal } from '@angular/core';
import { AppConstants } from '../shared/constants/app-constants';
import { CoinsBundle } from '../interfaces/chapter-interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  public products: WritableSignal<CoinsBundle[]> = signal([]);
  constructor() { }

  // In a service - map product ID to coins
  getCoinsFromProductId(productId: string): number {
    const mapping = {
      [AppConstants.PRODUCT_ID_SMALL]: 100,
      [AppConstants.PRODUCT_ID_MEDIUM]: 300,
      [AppConstants.PRODUCT_ID_LARGE]: 700,
      [AppConstants.PRODUCT_ID_ECONOMY]: 1200
    };
    return mapping[productId] || 0;
  }

}
