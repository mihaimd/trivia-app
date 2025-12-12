import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnChanges,
  Input,
  SimpleChanges,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { IonCol, IonRow } from '@ionic/angular/standalone';
import { AppPlayerData, Campaign, CampaignInterface, GamesInterface } from 'src/app/interfaces/chapter-interface';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-choice',
  templateUrl: './choice.component.html',
  styleUrls: ['./choice.component.scss'],
  standalone: true,
  imports: [CommonModule, IonRow, IonCol],
})
export class ChoiceComponent implements OnInit {
  arrowStyle = {
    top: '-1.5px',
    // left: '0px',
    right: '0px',
    display: 'none',
  };
  public selectedCampaignId: number = 0;
  @Input() campaigns: CampaignInterface[]=[];
  @Input() gameInfo: GamesInterface|undefined;
  @Output() onSelectOption = new EventEmitter<number>();


  constructor(public dataService: DataService) {
    // const appPlayerData: AppPlayerData = this.dataService.getAppPlayerDataFromLocal();
    // if(this.campaigns!=undefined){
    //   this.campaigns.map((ci)=>{
    //     ci.completed = appPlayerData.completedCampaignsIds.includes(ci.id);
    //   });
    // }
  }

  ngOnInit() {}

  selectOption(gameId: number, id: number) {
    const choiceElement: HTMLElement = document.getElementById(`${gameId}${id}`) as HTMLElement;
    if(this.campaigns==undefined) return;
    const campaign: Campaign|undefined = this.campaigns.find((campaign:CampaignInterface)=>campaign.id == id);
    if(campaign && campaign.completed) return;
    this.selectedCampaignId = id;
    const offsetTop = choiceElement.offsetTop;    
    const offsetHeight = choiceElement.offsetHeight;    
    const bulletTextElement: HTMLElement = document.getElementById(
      `bullet-text${gameId}${id}`
    ) as HTMLElement;
    const offsetWidth = bulletTextElement.offsetWidth;    
    const arrowTop = offsetTop + offsetHeight / 2 - 14;
    this.arrowStyle = {
      ...this.arrowStyle,
      top: `${arrowTop}px`,
      right: '0px',
      // left: `${offsetWidth + 35}px`,
      display: 'block'
    };
    this.onSelectOption.emit(id);
  }
}
