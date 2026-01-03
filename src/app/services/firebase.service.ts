import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collectionData,
  docData,
  addDoc,
  query,
  orderBy,
  Timestamp,
  where,
  Query,
  DocumentData,
  QueryDocumentSnapshot,
  startAfter
} from '@angular/fire/firestore';

import { from, map, Observable, of } from 'rxjs';
import { AppConstants } from '../shared/constants/app-constants';
import {
  AnswerInterface,
  CompletedCampaigns,
  CompletedRivers,
  MySeasons,
  QuestionInterface,
  Seasons,
} from '../interfaces/chapter-interface';
import {
  getDocs,
  limit,
  QuerySnapshot,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { AuthService } from './auth.service';

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: number | string | null;
  providerId: string | null;
  photoURL: string | null;
  country: string;
  country_code: string;
  exp: number;
  level: number;
  timeBonus: number;
  lastActive: Timestamp;
  skill: string;
  adsRemoved: boolean;
  flagURL?: string;
  isChallengeStart?: boolean;
  mySeasons?: MySeasons[];
  totalGoldCoins: number;
  isJourneyStarted: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  constructor(private firestore: Firestore, private authService: AuthService) { }
  getFbTimestamp() {
    const now = new Date();
    return Timestamp.fromDate(now);
  }
  /* ==================USERS COLLECTION START================== */
  private usersColRef() {
    return collection(this.firestore, 'users');
  }

  getUser(uid: string): Observable<UserData | undefined> {
    const docRef = doc(this.firestore, `${AppConstants.FB_REF_USERS}/${uid}`);
    return docData(docRef, { idField: 'uid' }) as Observable<
      UserData | undefined
    >;
  }

  createUser(data: UserData): Promise<void> {
    const docRef = doc(this.firestore, `users/${data.uid}`);
    return setDoc(docRef, data);
  }

  updateUser(uid: string, partial: Partial<UserData>): Promise<void> {
    const docRef = doc(this.firestore, `${AppConstants.FB_REF_USERS}/${uid}`);
    return updateDoc(docRef, partial);
  }

  deleteUser(uid: string): Promise<void> {
    const docRef = doc(this.firestore, `${AppConstants.FB_REF_USERS}/${uid}`);
    return deleteDoc(docRef);
  }

  getAllUsers(): Observable<UserData[]> {
    return collectionData(this.usersColRef(), { idField: 'uid' }) as Observable<
      UserData[]
    >;
  }

  addUserAutoId(data: Omit<UserData, 'uid'>): Promise<any> {
    return addDoc(this.usersColRef(), data);
  }
  /* ==================USERS COLLECTION END================== */

  /* ==================SCORE BOARD FROM  COLLECTION START================== */
  getScoreBoardPlayers(): Observable<UserData[]> {
    const q = query(this.usersColRef(), orderBy('exp', 'desc'));
    return collectionData(q, { idField: 'uid' }) as Observable<UserData[]>;
  }

  // Top users globally by level and exp
  getTopPlayers(boardType: string, country_code: string, perPage: number, lastDoc?: QueryDocumentSnapshot<DocumentData>) {
    let q: Query<DocumentData>;
    if (boardType === 'global') {
      q = query(
        this.usersColRef(),
        orderBy('level', 'desc'),
        orderBy('exp', 'desc'),
        ...(lastDoc ? [startAfter(lastDoc)] : []),
        limit(perPage)
      );
    } else {
      q = query(
        this.usersColRef(),
        where('country_code', '==', country_code),
        orderBy('level', 'desc'),
        orderBy('exp', 'desc'),
        ...(lastDoc ? [startAfter(lastDoc)] : []),
        limit(perPage)
      );
    }
    return { data$: collectionData(q, { idField: 'uid' }) as Observable<UserData[]>, query: q };
  }

  getTopPlayersToday(
    boardType: string,
    country_code: string,
    perPage: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): { data$: Observable<UserData[]>; query: Query<DocumentData> } {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let q: Query<DocumentData>;

    if (boardType === 'global') {
      q = query(
        this.usersColRef(),
        where('lastActive', '>=', Timestamp.fromDate(startOfDay)),
        orderBy('lastActive', 'desc'),
        orderBy('level', 'desc'),
        orderBy('exp', 'desc'),
        ...(lastDoc ? [startAfter(lastDoc)] : []),
        limit(perPage)
      );
    } else {
      q = query(
        this.usersColRef(),
        where('country_code', '==', country_code),
        where('lastActive', '>=', Timestamp.fromDate(startOfDay)),
        orderBy('lastActive', 'desc'),
        orderBy('level', 'desc'),
        orderBy('exp', 'desc'),
        ...(lastDoc ? [startAfter(lastDoc)] : []),
        limit(perPage)
      );
    }

    return {
      data$: collectionData(q, { idField: 'uid' }) as Observable<UserData[]>,
      query: q
    };
  }

  getTopPlayersThisWeek(
    boardType: string,
    country_code: string,
    perPage: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): { data$: Observable<UserData[]>; query: Query<DocumentData> } {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    let q: Query<DocumentData>;

    if (boardType === 'global') {
      q = query(
        this.usersColRef(),
        where('lastActive', '>=', Timestamp.fromDate(startOfWeek)),
        orderBy('lastActive', 'desc'),
        orderBy('level', 'desc'),
        orderBy('exp', 'desc'),
        ...(lastDoc ? [startAfter(lastDoc)] : []),
        limit(perPage)
      );
    } else {
      q = query(
        this.usersColRef(),
        where('country_code', '==', country_code),
        where('lastActive', '>=', Timestamp.fromDate(startOfWeek)),
        orderBy('lastActive', 'desc'),
        orderBy('level', 'desc'),
        orderBy('exp', 'desc'),
        ...(lastDoc ? [startAfter(lastDoc)] : []),
        limit(perPage)
      );
    }

    return {
      data$: collectionData(q, { idField: 'uid' }) as Observable<UserData[]>,
      query: q
    };
  }



  /* ==================SCORE BOARD FROM COLLECTION END================== */

  /* ==================COMPLETED_CAMPAIGNS COLLECTION END================== */
  private completedCampaignsColRef() {
    return collection(this.firestore, AppConstants.FB_REF_COMPLETED_CAMPAIGNS);
  }

  /* getCompletedCampaignsByCurrentUser(): Observable<CompletedCampaigns[]> {
    const user = this.authService.getUserProfileFromLocal();
    if (user && this.authService.isGuest(user) == false) {
      const q = query(
        this.completedCampaignsColRef(),
        where('uid', '==', user.uid),
        orderBy('time', 'desc')
      );
      return collectionData(q) as Observable<
        CompletedCampaigns[]
      >;
    }
    return [] as unknown as Observable<CompletedCampaigns[]>;
  } */
  getCompletedCampaignsByCurrentUser(): Observable<CompletedCampaigns[]> {
    const user = this.authService.getUserProfileFromLocal();
    if (user && !this.authService.isGuest(user)) {
      const q = query(
        this.completedCampaignsColRef(),
        where('uid', '==', user.uid),
        orderBy('time', 'desc')
      );
      return collectionData(q) as Observable<CompletedCampaigns[]>;
    }
    return of([]); // Return an observable of an empty array
  }

  async updateCompletedCampaignsByUid(
    uid: string,
    partial: Partial<CompletedCampaigns>
  ): Promise<void> {
    Object.assign(partial, { uid: uid });
    const docRef = doc(
      this.firestore,
      `${AppConstants.FB_REF_COMPLETED_CAMPAIGNS}/${partial.id}_${uid}`
    );

    // upsert: will update if exists or create if not
    return await setDoc(docRef, partial, { merge: true });
  }
  /* ==================COMPLETED_CAMPAIGNS COLLECTION END================== */

  /* ==================QUESTION_RIVERS COLLECTION START================== */
  private questionRiversColRef() {
    return collection(this.firestore, AppConstants.FB_REF_QUESTION_RIVERS);
  }
  // Get today's questions
  getDailyQuestions(limitCount: number = 10): Observable<QuestionInterface[]> {
    const todayStart = this.getStartOfDay();
    const todayEnd = this.getEndOfDay();

    // Query questions where date is between the start and end of today
    const dailyQuery = query(
      this.questionRiversColRef(),
      where('date', '>=', todayStart),
      where('date', '<=', todayEnd),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    return collectionData(dailyQuery) as Observable<QuestionInterface[]>;
  }

  getSeasonQuestions(
    season: Seasons,
    limitCount: number
  ): Observable<QuestionInterface[]> {
    const seasonStart = season.startDate;
    const now = Timestamp.now();

    // Fetch all questions from the start of the season until now
    const seasonQuery = query(
      this.questionRiversColRef(),
      where('date', '>=', seasonStart),
      where('date', '<=', now),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    return collectionData(seasonQuery) as Observable<QuestionInterface[]>;
  }

  // Helper function to get the start of the day (midnight)
  private getStartOfDay(): Timestamp {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set time to midnight
    return Timestamp.fromDate(now); // Convert to Firestore Timestamp
  }

  // Helper function to get the end of the day (one second before midnight)
  private getEndOfDay(): Timestamp {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // Set time to just before midnight
    return Timestamp.fromDate(now); // Convert to Firestore Timestamp
  }
  getRiverQuestionByDocId(
    id: number
  ): Observable<QuestionInterface | undefined> {
    const docRef = doc(
      this.firestore,
      `${AppConstants.FB_REF_QUESTION_RIVERS}/${id}`
    );
    return docData(docRef) as Observable<QuestionInterface | undefined>;
  }
  setRiverQuestionByDocId(
    docId: string,
    data: QuestionInterface
  ): Promise<void> {
    const docRef = doc(
      this.firestore,
      `${AppConstants.FB_REF_QUESTION_RIVERS}/${docId}`
    );
    return setDoc(docRef, data);
  }
  updateRiverQuestionByDocId(
    uid: number
  ): Observable<QuestionInterface | undefined> {
    const docRef = doc(
      this.firestore,
      `${AppConstants.FB_REF_QUESTION_RIVERS}/${uid}`
    );
    return docData(docRef) as Observable<QuestionInterface | undefined>;
  }
  /* ==================QUESTION_RIVERS COLLECTION END================== */

  /* ==================COMPLETED_RIVERS COLLECTION START================== */
  private completedRiversColRef() {
    return collection(this.firestore, AppConstants.FB_REF_COMPLETED_RIVERS);
  }

  getCompletedRiversByUid(): Observable<CompletedRivers | undefined> {
    const user = this.authService.getUserProfileFromLocal();
    if (user && !this.authService.isGuest(user)) {
      const docRef = doc(
        this.firestore,
        `${AppConstants.FB_REF_COMPLETED_RIVERS}/${user.uid}`
      );
      return docData(docRef) as Observable<CompletedRivers | undefined>;

    }
    return of(undefined);
  }


  setCompletedRiversByUid(uid: string, data: CompletedRivers): Promise<void> {
    const docRef = doc(
      this.firestore,
      `${AppConstants.FB_REF_COMPLETED_RIVERS}/${uid}`
    );
    return setDoc(docRef, data);
  }

  updateCompletedRiversByUid(
    uid: string,
    partial: Partial<CompletedRivers>
  ): Promise<void> {
    const docRef = doc(
      this.firestore,
      `${AppConstants.FB_REF_COMPLETED_RIVERS}/${uid}`
    );
    return updateDoc(docRef, partial);
  }
  /* ==================COMPLETED_RIVERS COLLECTION END================== */

  /* ==================SEASONS COLLECTION START================== */
  private seasonsColRef() {
    return collection(this.firestore, AppConstants.FB_REF_SEASONS);
  }

  getCurrentSeason(): Promise<Seasons | undefined> {
    const now = Timestamp.now();
    const q = query(
      this.seasonsColRef(),
      where('startDate', '<=', now),
      where('endDate', '>=', now)
    );

    return getDocs(q).then((querySnapshot: QuerySnapshot<DocumentData>) => {
      if (querySnapshot.empty) return undefined;
      // Take the first matching season
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data() as Seasons;
      data.id = docSnap.id;
      return data;
    });
  }

  getNextActiveSeason(): Promise<Seasons | undefined> {
    const now = Timestamp.now();
    const q = query(
      this.seasonsColRef(),
      where('startDate', '>=', now),
      orderBy('startDate', 'desc'),
      limit(1)
    );

    return getDocs(q).then((querySnapshot: QuerySnapshot<DocumentData>) => {
      if (querySnapshot.empty) return undefined;
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Seasons;
    });
  }

  /**
   * Get the currently active 4-month season (round)
   */
  getActiveSeason(): Observable<Seasons | undefined> {
    const now = Timestamp.now();

    const q = query(
      this.seasonsColRef(),
      where('startDate', '<=', now),
      where('endDate', '>=', now)
    );

    return from(getDocs(q)).pipe(
      map((snapshot: QuerySnapshot<DocumentData>) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() } as Seasons;
        }
        return undefined;
      })
    );
  }

  getUserAvailableQuestions(season: Seasons): number {
    const start = season.startDate.toDate();
    const now = new Date();

    // Number of days passed since the start of the season
    const daysPassed =
      Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Each day gives 4 questions
    return Math.min(daysPassed * season.dailyQuestions, season.totalQuestions);
  }
  howManyDaysPassed(season: Seasons): number {
    const start = season.startDate.toDate();
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return daysPassed;
  }
  /* ==================SEASONS COLLECTION END================== */

  /* ==================STORAGE FOR FILES START================== */
  async uploadToFirebase(
    imagePath: string
  ): Promise<{ downloadURL: string | null; error: any }> {
    return new Promise(async (resolve, reject) => {
      // Get Firebase Storage reference
      const storage = getStorage();
      // Create a reference to the location where you want to store the image
      const storageRef = ref(storage, 'players/' + new Date().getTime());
      // Fetch the image file as a Blob
      const response = await fetch(imagePath);
      const blob = await response.blob();
      // Upload the image to Firebase Storage
      uploadBytes(storageRef, blob)
        .then((snapshot) => {
          // Get the download URL after the upload completes
          getDownloadURL(snapshot.ref).then((downloadURL) => {
            resolve({ downloadURL, error: null }); // Store the download URL
          });
        })
        .catch((error) => {
          console.error('Error uploading image: ', error);
          reject({ downloadURL: null, error });
        });
    });
  }
  async uploadToFirebaseBlobOld(blob: Blob, fileName: string) {
    // Get Firebase Storage reference
    const storage = getStorage();
    const storageRef = ref(storage, `players/${fileName}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return { downloadURL };
  }

  async uploadToFirebaseBlob(blob: Blob, fileName: string) {
    const storage = getStorage();
    const storageRef = ref(storage, `players/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, blob); // Use uploadBytesResumable for better handling

    return new Promise<{ downloadURL: string }>((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // Optional: track progress here
          // const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          reject(error);
        },
        () => {
          // Once the upload is complete, get the download URL
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve({ downloadURL });
          });
        }
      );
    });
  }


  /* ==================STORAGE FOR FILES END================== */
}
