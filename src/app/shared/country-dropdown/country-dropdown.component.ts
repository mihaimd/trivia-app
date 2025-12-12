import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRadio,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { Flag } from 'src/app/interfaces/chapter-interface';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { FirebaseService, UserData } from 'src/app/services/firebase.service';
import { AppConstants } from '../constants/app-constants';
@Component({
  selector: 'app-country-dropdown',
  templateUrl: './country-dropdown.component.html',
  styleUrls: ['./country-dropdown.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonItem,
    IonList,
    IonSearchbar,
    IonTitle,
    IonToolbar,
    IonLabel,
    IonModal,
    IonAvatar,
    IonRadio
  ],
})
export class CountryDropdownComponent implements OnInit {
  @Output() selectionChange = new EventEmitter<string>();
  currentUser: UserData | undefined;
  flags: Flag[] = [];
  selectedCountryCode: string = AppConstants.DEFAULT_COUNTRY_CODE;
  filteredFlags: Flag[] = [];
  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private modalCtrl: ModalController
  ) {
    this.currentUser = this.authService.getUserProfileFromLocal();
    if(this.currentUser) {      
      this.selectedCountryCode = this.currentUser.country_code;    
    }
  }

  ngOnInit() {
    this.dataService.getAllFlags().subscribe({
      next: (flags) => {
        if(flags) {
          this.flags = flags;
          this.filteredFlags = [...this.flags];
        }
      }
    });
  }

  confirmChanges() {
    if(this.selectedCountryCode.length) {
      this.modalCtrl.dismiss();
      this.selectionChange.emit(this.selectedCountryCode);
    }
  }

  searchbarInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.filterList(inputElement.value);
  }

  /**
   * Update the rendered view with
   * the provided search query. If no
   * query is provided, all data
   * will be rendered.
   */
  filterList(searchQuery: string | undefined) {
    /**
     * If no search query is defined,
     * return all options.
     */
    if (searchQuery === undefined || searchQuery.trim() === '') {
      this.filteredFlags = [...this.flags];
    } else {
      /**
       * Otherwise, normalize the search
       * query and check to see which items
       * contain the search query as a substring.
       */
      const normalizedQuery = searchQuery.toLowerCase();
      this.filteredFlags = this.flags.filter((flag) =>
        flag.name.toLowerCase().includes(normalizedQuery)
      );
    }
  }

  checkboxChange(event: CustomEvent<{ checked: boolean; value: string }>, flag: Flag) {
    const { checked, value } = event.detail;
    if (checked) {
      if(this.currentUser) {
        this.selectedCountryCode = value;
        this.currentUser.country_code = value;
        this.currentUser.country = flag.name;  
        this.authService.saveUserProfileInLocal(this.currentUser);
        if(this.authService.isGuest(this.currentUser)==false) {
          this.firebaseService.updateUser(this.currentUser.uid, { country: this.currentUser.country, country_code: this.currentUser.country_code });
        }
      }
    } else {
      this.selectedCountryCode = '';
    }
  }
}
