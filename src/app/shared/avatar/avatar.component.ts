import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { IonAvatar, IonIcon, IonImg, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { FirebaseService, UserData } from 'src/app/services/firebase.service';
import { AppConstants } from '../constants/app-constants';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { cameraOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  standalone: true,
  imports: [IonAvatar, CommonModule, IonSpinner, IonImg,IonIcon]
})
export class AvatarComponent implements OnInit {
  @Input() currentUser: UserData | undefined;
  @Input() canUpload: boolean = false;
  spinner: boolean = true;
  private firebaseService = inject(FirebaseService);
  constructor(private authService: AuthService, private dataService: DataService) {
    addIcons({ cameraOutline });
    this.currentUser = this.authService.getUserProfileFromLocal();
    this.authService.guestUserSubject.subscribe({
      next: (u) => {
        this.currentUser = this.authService.getUserProfileFromLocal();
      }
    });
  }

  ngOnInit() { }

  getAvatarUrl(url: string | null) {
    return this.dataService.getAvatarUrl(url);
  }
  getFlagUrl(countryCode: string) {
    return this.dataService.getFlagUrl(countryCode || AppConstants.DEFAULT_COUNTRY_CODE);
  }

  imageLoaded() {
    this.spinner = false;
  }
  
  handleImageError() {
    this.spinner = false;
    if (this.currentUser) {
      this.currentUser.photoURL = AppConstants.DEFAULT_AVATAR;
    }
  }

  async takePhoto() {
    try {
      if (this.currentUser) {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri, // keep as URI
          source: CameraSource.Prompt,
        });
        const imageUrl = image.webPath;
        if (!imageUrl) {
          console.error('No image URL found');
          return;
        }
        this.spinner = true;
        const resizedBlob = await this.resizeImage(imageUrl, 800, 800); // Resize to max 800x800 pixels
        if (resizedBlob == null) { return; }
        const fileName = `${this.currentUser.uid}_${new Date().getTime()}.jpeg`;
        const uploadResult = await this.firebaseService.uploadToFirebaseBlob(resizedBlob, fileName);
        if (uploadResult && uploadResult.downloadURL) {
          this.currentUser.photoURL = uploadResult.downloadURL;
          this.authService.saveUserProfileInLocal(this.currentUser);
          if (!this.authService.isGuest(this.currentUser)) {
            this.firebaseService.updateUser(this.currentUser.uid, { photoURL: uploadResult.downloadURL });
          }
        }
      }
    } catch (error) {
      console.error('Error while selecting image:', error);
    }
  }

  async resizeImage(imageUri: string, maxWidth: number, maxHeight: number): Promise<Blob | null> {
    const img = new Image();
    img.src = imageUri;

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob); // If a valid blob is created, resolve it
          } else {
            reject('Failed to create blob');
          }
        }, 'image/jpeg', 0.8); // 0.8 is the quality (0 to 1)
      };

      img.onerror = (error) => reject(error);
    });
  }
}
