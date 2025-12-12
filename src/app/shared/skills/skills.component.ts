import { Component, OnInit } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { AppConstants } from '../constants/app-constants';

@Component({
  selector: 'app-skills',
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon]
})
export class SkillsComponent  implements OnInit {
  skill1: string = AppConstants.SKILL1;
  skill2: string = AppConstants.SKILL2;
  selectedSkill: string = '';
  constructor(private modalCtrl: ModalController) {
    addIcons({
      closeCircle
    });    
  }

  ngOnInit() {}

  selectSkill(skill: string) {
    this.selectedSkill = skill;
  }

  closeModal() {
    this.modalCtrl.dismiss(this.selectedSkill, 'confirm');
  }
}
