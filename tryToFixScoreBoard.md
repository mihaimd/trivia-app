import { Component, OnChanges, OnInit, SimpleChange, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonAvatar, IonList, IonItem, IonLabel, IonMenuButton, IonButtons, IonButton, IonIcon, MenuController, IonSegment, IonSegmentButton, IonText, IonSpinner, SegmentCustomEvent, SegmentValue, IonFooter, IonBadge, IonInfiniteScroll, IonInfiniteScrollContent, InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { globeOutline, locationOutline, menuOutline } from 'ionicons/icons';
import { FirebaseService, UserData } from '../services/firebase.service';
import { AuthService } from '../services/auth.service';
import { DataService } from '../services/data.service';
import { Observable, take } from 'rxjs';
import { DocumentData, getDocs, Query, QueryDocumentSnapshot } from 'firebase/firestore';

@Component({
  selector: 'app-score-board',
  templateUrl: './score-board.page.html',
  styleUrls: ['./score-board.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonGrid, IonRow, IonCol, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonAvatar, IonList, IonItem, IonLabel, IonMenuButton,
    IonButtons, IonButton, IonIcon, IonSegment, IonSegmentButton, IonText, IonSpinner, IonFooter,
    IonBadge, IonInfiniteScroll, IonInfiniteScrollContent
  ],
})
export class ScoreBoardPage implements OnInit {
  showSpinner: boolean = true;
  selectedSegment: SegmentValue = 'all';
  players: UserData[] = [];
  top3players: UserData[] = [];
  topPlayer1: UserData | undefined;
  topPlayer2: UserData | undefined;
  topPlayer3: UserData | undefined;
  currentUser: UserData | undefined;
  currentPlayerPosition: number = 0;
  boardType: string = 'global';
  perPage: number = 50;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
  hasMore: boolean = true;
  isLoadingMore: boolean = false;

  @ViewChild(IonContent) content!: IonContent;
  constructor(
    public menuCtr: MenuController,
    public firebaseService: FirebaseService,
    public authService: AuthService,
    public dataService: DataService
  ) {
    addIcons({ menuOutline, globeOutline, locationOutline });
  }

  ngOnInit() {
    const lastActive = this.firebaseService.getFbTimestamp();
  }

  ionViewWillEnter() {
    this.resetPaginationData();
    this.currentUser = this.authService.getUserProfileFromLocal();
    this.getPlayers(this.selectedSegment, true);
  }

  onSelectSegment(e: SegmentCustomEvent) {
    const segment = e.detail.value || this.selectedSegment;
    this.selectedSegment = segment;
    this.resetPaginationData();
    this.getPlayers(this.selectedSegment, false);
  }

  onSelectBoardType(type: string) {
    this.boardType = type;
    this.resetPaginationData();
    this.getPlayers(this.selectedSegment, false);
  }

  // Reset pagination & data
  resetPaginationData() {
    this.lastDoc = null;
    this.hasMore = true;
    this.players = [];
    this.top3players = [];
    this.showSpinner = true;
    this.isLoadingMore = false;
  }

  getPlayers(segment: SegmentValue, loadMore = false) {
    if (!this.currentUser || this.isLoadingMore) return;
    this.isLoadingMore = true;
    let method;
    if (segment === 'all') method = this.firebaseService.getTopPlayers.bind(this.firebaseService);
    else if (segment === 'weekly') method = this.firebaseService.getTopPlayersThisWeek.bind(this.firebaseService);
    else method = this.firebaseService.getTopPlayersToday.bind(this.firebaseService);

    const result = method(
      this.boardType,
      this.currentUser.country_code,
      this.perPage,
      loadMore ? this.lastDoc || undefined : undefined
    ) as { data$: Observable<UserData[]>; query: Query<DocumentData> };

    const { data$, query } = result;

    data$.subscribe(async (players: UserData[]) => {
      console.log("PLAYERS_LIST::", players);
      if(this.currentUser) {
        const myId = this.currentUser.uid;
        if (!players.length) {
          this.hasMore = false;
          this.isLoadingMore = false;
          this.showSpinner = false;
          return;
        }        
        // Update pagination reference
        const snapshot = await getDocs(query);
        this.lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        
        // Clean and map players
        players = players.filter(p => p.uid !== myId);
        players = players.map(p=>({
          ...p,
          photoURL: this.dataService.getAvatarUrl(p.photoURL),
          flagURL: this.dataService.getFlagUrl(p.country_code)
        }));
        if (!loadMore) this.players = []; // reset on fresh load
        players.forEach((player)=>{
          const index = this.players.findIndex((p)=>p.uid==player.uid);
          if(index == -1) {
            this.players.push(player);
          } else {
            this.players[index]=player;
          }
        });
        // this.players = [...this.players, ...players.map(p => ({
        //   ...p,
        //   photoURL: this.dataService.getAvatarUrl(p.photoURL),
        //   flagURL: this.dataService.getFlagUrl(p.country_code),
        // }))];
  
  
        // Re-add current user (even if guest)
        if (!this.players.find(p => p.uid === this.currentUser!.uid)) {
          this.players.push({
            ...this.currentUser!,
            photoURL: this.dataService.getAvatarUrl(this.currentUser!.photoURL),
            flagURL: this.dataService.getFlagUrl(this.currentUser!.country_code),
          });
        }
  
        // // Sort by exp (optional)
        // this.players.sort((a, b) => b.exp - a.exp);
  
        // // Find current player's rank
        // const currentPlayerIndex = this.players.findIndex(p => p.uid === this.currentUser!.uid);
        // if (currentPlayerIndex !== -1) {
        //   this.currentPlayerPosition = currentPlayerIndex + 1;
        //   this.currentUser = this.players[currentPlayerIndex];
        // }
  
        // this.showSpinner = false;
        // this.top3players = this.players.slice(0, Math.min(3, this.players.length));
        // [this.topPlayer1, this.topPlayer2, this.topPlayer3] = this.top3players;
  
        // this.showSpinner = false;
        // this.isLoadingMore = false;
      }

    });
  }

  onTapMyScore() {
    const elementId = 'player-' + this.currentPlayerPosition;
    const el = document.getElementById(elementId);
    if (el && this.content) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('activeItem');
      setTimeout(() => { el.classList.remove('activeItem'); }, 1500);
    } else {
      console.warn('Player element not found:', elementId);
    }
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    if (!this.hasMore) {
      event.target.disabled = true;
      event.target.complete();
      return;
    }
    this.getPlayers(this.selectedSegment, true);
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}