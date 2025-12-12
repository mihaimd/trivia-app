import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonAvatar, IonBadge, IonButton, IonChip, IonCol, IonContent, IonGrid, IonHeader, IonItem, IonLabel, IonList, IonRow, IonSpinner, IonTitle, IonToolbar, Platform } from '@ionic/angular/standalone';
import { CoinsBundle } from '../interfaces/chapter-interface';
import { AuthService } from '../services/auth.service';
import { FirebaseService, UserData } from '../services/firebase.service';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { AppConstants } from '../shared/constants/app-constants';
import { ProductService } from '../services/product.service';
import 'cordova-plugin-purchase';
declare var CdvPurchase: any;

@Component({
  selector: 'app-gold-coins',
  templateUrl: './gold-coins.page.html',
  styleUrls: ['./gold-coins.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonButton, IonBadge,
    IonGrid, IonRow, IonCol, IonChip, IonAvatar, IonSpinner
  ],
  providers: [],
})


export class GoldCoinsPage implements OnInit {
  productBundles: CoinsBundle[] = [];
  currentUser: UserData | undefined;
  selectedProductId: string = '';
  constructor(
    private plt: Platform,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private dataService: DataService,
    private router: Router,
    private productService: ProductService,
  ) { }

  ngOnInit() { }

  async ionViewWillEnter() {
    this.currentUser = this.authService.getUserProfileFromLocal();

    if (this.plt.is('cordova')) {
      // Products are ALREADY registered & initialized from app.component.ts
      // So simply read them
      this.loadProducts();
    }
  }

  loadProducts() {
    this.productBundles = [];

    CdvPurchase.store.products.forEach((product: any) => {
      this.productBundles.push({
        id: product.id,
        name: product.title,
        price: product.pricing?.price,
        coins: this.productService.getCoinsFromProductId(product.id),
      });
    });
  }

  async buy(p: CoinsBundle) {
    if(this.currentUser) {
      if(this.authService.isGuest(this.currentUser)) {
        this.showAlertForLogin('Alert', 'Please login to continue buy gold coin');
        return;
      }
    }

    const product = CdvPurchase.store.get(p.id);
    if (!product) {
      console.log('Product not found');
      return;
    }
    product.getOffer()?.order()
      .then((error: any) => {
        if (error) {
          if (error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
            console.log('Payment cancelled by user');
          }
          else {
            console.log('Failed to subscribe:', error);
          }
        }
      });
  }

  async showAlertForLogin(header: string, message: string) {
    const alert = await this.alertCtrl.create({ 
      header, 
      message, 
      buttons: [
        {
          text: 'OK',
          handler: () => {
            console.log('Login Handle Action confirmed'); // Custom handler logic for OK
            this.router.navigate([`tabs/profile`]);
          },
        },
      ]
    });
    await alert.present();
  }
}
