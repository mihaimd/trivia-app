import { Timestamp } from 'firebase/firestore';

export interface ChapterInterface {
  id: number;
  name: string;
  title: string;
  image: string;
  games: GamesInterface[];
}

export interface GamesInterface {
  gameId: number;
  chapterName: string | null;
  gameTitle: string | null;
  gameContent: string;
  campaigns: CampaignInterface[] | [];
}

export interface CampaignInterface {
  id: number;
  completed: boolean | false;
  title: string;
}

export interface QuestionInterface {
  question: string;
  answers: AnswerInterface;
  date: Timestamp;
  id: number;
  category: string;
  top: string;
  left: string;
  level: number;
  answtype: string;
  format: string;
  pts: number;
  isAnswerdByUser?: boolean;
  answerWasCorrect?: boolean;
  answerdTime?: number;
  answerIs?: string;
  timeBonus?: number;
  status?: string;
}

export interface AnswerInterface {
  options: OptionInterface[];
}

export interface OptionInterface {
  label: string;
  correct: boolean;
}

export interface AppPlayerData {
  completedCampaignsIds: Array<number>;
  completedCampaigns: CompletedCampaigns[];
}

export interface CompletedCampaigns {
  id: number;
  chapterId: number;
  gameId: number;
  title: string | null;
  exp: number;
  timeBonus: number;
  correctAnswers: number;
  totalQuestions: number;
  totalPoints: number;
  time: number;
}

export interface PercentageWithStars {
  percentage: number;
  stars: number;
}

export interface AppSettingInterface {
  sound: boolean;
  notification: boolean;
  fontSize: 'small' | 'normal' | 'large';
}

/* ==========DataService All Interface START=========== */
export interface Message {
  question: string;
  answers: Answer;
  date: string;
  id: number;
  category: string;
  pts?: number;
}

export interface Answer {
  type: string;
  options: Option[];
}

export interface Option {
  label: string;
  correct: boolean;
}

export interface Chapter {
  id: number;
  campaigns: Campaign[];
}
export interface Campaign {
  id: number;
  title: string;
  completed: boolean;
}
/* ==========DataService All Interface END=========== */
export interface GameLevels {
  level: number;
  exp: number;
  nextLevelExp: number;
  progressPercent: number;
}

export interface CompletedRivers {
  questionIds: number[];
  questions: CompletedRiversQuestions[];
}

export interface CompletedRiversQuestions {
  questionId: number;
  answer: string;
  pts: number;
  datetime: number;
  correct: boolean;
  timeBonus: number;
}

export interface Seasons {
  id: string;
  startDate: Timestamp;
  endDate: Timestamp;
  totalQuestions: number;
  dailyQuestions: number;
  active: boolean;
}

export interface UserAnswerd {
  isAnswerdByUser: boolean;
  answerWasCorrect: boolean;
  answerdTime: number;
  answerIs: string;
  timeBonus: number;
  canPlay: boolean;
}

export interface MySeasons {
  id: string;
  startDate: number;
}

export interface Flag {
  code: string;
  name: string;
  url: string;
}

export interface CurrentCampaignPercentage {
  totalQuestion: number;
  totalPoints: number;
  obtainPercentage: number;
  correctAnswers: number;
  timeBonus: number;
  questions: QuestionInterface[];
}

export interface UserProgress {
  soloCampaignCompleted: number; // campaigns completed
  challengeQuestionsAnswered: number; // number of questions answered
  lastAdShownAt?: number; // timestamp (optional)
}

export interface CoinsBundle {
  id: string;
  name: string | undefined;
  price: string;
  coins: number;
}
