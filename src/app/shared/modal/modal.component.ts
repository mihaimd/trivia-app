import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonHeader, IonToolbar, IonTitle, IonButton, IonButtons, IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import {  HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButton, IonContent, IonButtons, HeaderComponent],
  providers: [ModalController],
})
export class ModalComponent {

  @Input() text: string = '';

  constructor(private modalCtrl: ModalController, private router: Router) { }
  close() {
    this.modalCtrl.dismiss();
  }

  save(path: string = 'tabs/home') {
    this.modalCtrl.dismiss({ path });
  }
}
