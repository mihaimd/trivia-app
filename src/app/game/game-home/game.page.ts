import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonAvatar,
  IonCard,
  IonRow,
  IonCol,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonGrid,
  IonFooter,
  IonButtons,
  IonButton,
  IonFab,
  IonFabButton,
  IonTabBar,
  IonTabButton,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, personCircle, home } from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import {
  Campaign,
  CampaignInterface,
  ChapterInterface,
  GamesInterface,
} from 'src/app/interfaces/chapter-interface';
import { ChoiceComponent } from 'src/app/shared/choice/choice.component';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonIcon,
    IonAvatar,
    IonCard,
    IonRow,
    IonCol,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonGrid,
    IonFooter,
    IonButtons,
    IonButton,
    IonFab,
    IonFabButton,
    IonTabBar,
    IonTabButton,
    IonLabel,
    ChoiceComponent,
  ],
})
export class GamePage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  public selectedCampaignId: number = 0;
  public isGameCompleted: boolean = false;
  public chapterId: number = 1;
  public gameId: number = 1;
  public chapterInfo: ChapterInterface | undefined;
  public gameInfo: GamesInterface | undefined;
  public campaigns: CampaignInterface[] = [];
  public isDisabled: boolean = true;
  public buttonText: string = 'Next';

  constructor(public dataService: DataService) {
    addIcons({ createOutline, home, personCircle });
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {      
      this.chapterId = parseInt(params['chapterId']);
      this.gameId = parseInt(params['gameId']);     

      this.dataService.getChapterByIdFromJsonFile(this.chapterId).subscribe({
        next: (response: any) => {
          this.chapterInfo = response;
          if (this.chapterInfo) {
            this.gameInfo = this.chapterInfo.games.find((game) => game.gameId == this.gameId);
            if (this.gameInfo != undefined) {              
              const appPlayerData = this.dataService.getAppPlayerDataFromLocal()
              this.gameInfo.campaigns.map((c)=> c.completed = appPlayerData.completedCampaignsIds.includes(c.id));
              this.campaigns = this.gameInfo.campaigns;              
              if (this.campaigns.length > 0) {
                this.isGameCompleted =
                  this.campaigns.filter((campaign) => campaign.completed)
                    .length == this.campaigns.length;
                if (this.isGameCompleted) {
                  this.buttonText = 'Next';
                  this.isDisabled = false;
                } else {
                  this.buttonText = 'Play';
                }
              } else {
                this.isDisabled = false;
              }
            }
          }
        },
      });
    });
  }

  goToBack() {
    this.location.back();
    // this.router.navigate(['tabs/home']);
  }

  /* selectOption(id: number) {
    this.selectedCampaignId = id;
    this.isDisabled = false;
  } */

  arrowStyle = {
    top: '-1.5px',
    left: '0px',
    display: 'none',
  };
  selectOption(gameId: number, id: number) {    
    const choiceElement: HTMLElement = document.getElementById(`${gameId}${id}`) as HTMLElement;
    if(this.campaigns==undefined) return;
    const campaign: Campaign|undefined = this.campaigns.find((campaign:CampaignInterface)=>campaign.id == id);
    if(campaign && campaign.completed) return;
    this.selectedCampaignId = id;
    this.isDisabled = false;
    const offsetTop = choiceElement.offsetTop;    
    const offsetHeight = choiceElement.offsetHeight;    
    const bulletTextElement: HTMLElement = document.getElementById(
      `bullet-text${gameId}${id}`
    ) as HTMLElement;
    const offsetWidth = bulletTextElement.offsetWidth;    
    const arrowTop = offsetTop + offsetHeight / 2 - 14;
    this.arrowStyle = {
      top: `${arrowTop}px`,
      left: '91%',
      display: 'block'
    };
  }

  goToNextStep() {    
    if (this.isGameCompleted) {
      this.gameId += 1;
      this.router.navigate([`tabs/home/game`, this.chapterId, this.gameId]);
    } else {
      if(this.campaigns.length==0) {
        this.gameId += 1;
        this.router.navigate([`tabs/home/game`, this.chapterId, this.gameId]);
      } else {
        this.router.navigate(
          [
            `tabs/home/campain0`,
            this.chapterId,
            this.gameId,
            this.selectedCampaignId,
            'false',
          ]
        );
      }      
    }
  }
  ionViewDidLeave() {    
    this.arrowStyle = {
      top: '-1.5px',
      left: '0px',
      display: 'none',
    };
    this.isDisabled = true;
    this.selectedCampaignId = 0;
  }
}
