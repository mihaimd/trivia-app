import {
  Component,
  OnInit,
  inject,
  ViewChild,
  ElementRef,
  ViewChildren,
  QueryList,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { createOutline, personCircle, home } from 'ionicons/icons';
import { Router, ActivatedRoute } from '@angular/router';
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
} from '@ionic/angular/standalone';
import { ChoiceComponent } from 'src/app/shared/choice/choice.component';
import { DataService } from 'src/app/services/data.service';
import { AppPlayerData, CampaignInterface, ChapterInterface, GamesInterface } from 'src/app/interfaces/chapter-interface';

@Component({
  selector: 'app-game0',
  templateUrl: './game0.page.html',
  styleUrls: ['./game0.page.scss'],
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
    ChoiceComponent,
  ],
})
export class Game0Page {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private nextStep: number = 1;
  public isDisabled: boolean = true;
  public buttonText: string = 'Play';
  public isGameCompleted: boolean = false;
  
  public chapterId: number = 0;
  public gameId: number = 0;
  public chapterInfo: ChapterInterface | undefined;
  public gameInfo: GamesInterface | undefined;
  public campaigns: CampaignInterface[]=[];
  public appPlayerData: AppPlayerData;
  constructor(private dataService: DataService) {
    addIcons({ createOutline, home, personCircle });
    this.appPlayerData = this.dataService.getAppPlayerDataFromLocal();
    this.ionViewWillEnter();
  }

  ionViewWillEnter() {
   this.route.params.subscribe((params) => {      
      this.chapterId = parseInt(params['chapterId']);
      this.gameId = parseInt(params['gameId']);

      if (this.gameId >= 2) {
        this.buttonText = 'Play';
      } else {
        this.isDisabled = false;
      }

      this.dataService.getChapterByIdFromJsonFile(this.chapterId).subscribe({
        next: (response: any) => {
          this.chapterInfo = response;
          if(this.chapterInfo!=undefined) {
            this.gameInfo = this.chapterInfo.games.find((game)=>game.gameId==this.gameId);
            if(this.gameInfo!=undefined) {
              this.campaigns = this.gameInfo.campaigns;
              this.campaigns.map((c)=>c.completed = this.appPlayerData.completedCampaignsIds.includes(c.id));
            }
          }
        }
      });

    });
  }

  goHome(): void {
    this.router.navigateByUrl('/');
  }

  goToProfile() {
    this.router.navigate(['tabs/profile']);
  }

  selectOption(id: number) {    
    this.nextStep = id;
    this.isDisabled = false;
  }

  goToNextStep() {    
    if (this.isGameCompleted) {
      this.router.navigate([`tabs/home/game${this.nextStep}-2`, 0], { replaceUrl: true});
    } else {
      this.router.navigate([`tabs/home/campain0`,'1','1',`${this.nextStep}`,'false'], { replaceUrl: true});
    }
  }
}
