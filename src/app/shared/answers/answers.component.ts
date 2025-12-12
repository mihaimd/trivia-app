import { Component, Input, OnInit } from '@angular/core';
import { IonRadio, IonCheckbox, IonRadioGroup } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-answers',
  templateUrl: './answers.component.html',
  styleUrls: ['./answers.component.scss'],
  standalone: true,
  imports: [IonRadio, IonCheckbox, CommonModule, IonRadioGroup]
})
export class AnswersComponent  implements OnInit {
  // @Input() public answer: Answer = {type: 'single', options: [''], id: 0};

  constructor() { }

  ngOnInit() {}

}
