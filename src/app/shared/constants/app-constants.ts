export class AppConstants {
    public static readonly APP_NAME: string = 'Trivia';
    public static readonly REVENUE_CAT_ANDROID_PUBLIC_API_KEY: string = 'test_CETwVQlfKPEHZzznzagRfLndBAW';

    public static readonly PRODUCT_ID_SMALL: string = 'com.triviatwist480.app.smallbundle';
    public static readonly PRODUCT_ID_MEDIUM: string = 'com.triviatwist480.app.mediumbundle';
    public static readonly PRODUCT_ID_LARGE: string = 'com.triviatwist480.app.largebundle';
    public static readonly PRODUCT_ID_ECONOMY: string = 'com.triviatwist480.app.economybundle';

    public static readonly TOTAL_PNG_AVATARS: number = 190;
    
    public static readonly DEFAULT_AVATAR: string = 'avatar.svg'; //'https://ionicframework.com/docs/img/demos/avatar.svg';
    public static readonly DEFAULT_COUNTRY: string = 'Romania';
    public static readonly DEFAULT_COUNTRY_CODE: string = 'RO';

    // Gold coins bundles
    public static readonly GOLD_COINS_SMALL: number = 100;
    public static readonly GOLD_COINS_MEDIUM: number = 300;
    public static readonly GOLD_COINS_LARGE: number = 700;
    public static readonly GOLD_COINS_ECONOMY: number = 1200;

    // Try Again Default Limit
    public static readonly TRY_AGAIN_LIMIT_FOR_JOURNEY: number = 5;
    public static readonly TRY_AGAIN_LIMIT_FOR_CHALLENGE: number = 5;
    
    // Game Type
    public static readonly SOLO: string = 'solo';
    public static readonly CHALLENGE: string = 'challenge';

    public static readonly GAME_CHALLENGE_TOTAL_QUESTIONS: number = 480;

    // For Ads
    public static readonly SOLO_ADS_PLAY_EACH_CAMPAIGN: number = 1;
    public static readonly CHALLENGE_ADS_PLAY_EACH_QUESTION: number = 3;
    public static readonly SUB_SEQUENT_LEVEL_EVENRY: number = 5000;

    // For Skill System
    public static readonly SKILL_UNLOCK_LEVEL: number = 2;
    public static readonly SKILL1: string = 'Quick Thinking';
    public static readonly SKILL2: string = 'Intuition';
    public static readonly SKILL1_EXTRA_SEC: number = 10;

    // For Localstorage
    public static readonly LK_APP_PLAYER_PROFILE: string = 'TriviaAppPlayerProfile';
    public static readonly LK_APP_PLAYER_DATA: string = 'TriviaAppPlayerData';
    public static readonly LK_COMPLETED_CAMPAIGNS: string = 'completedCampaigns';
    public static readonly LK_COMPLETED_CAMPAIGNS_IDS: string = 'completedCampaignsIds';
    public static readonly LK_SETTING: string = 'TriviaAppSetting';
    public static readonly LK_CHALLENGE_START: string = 'TriviaAppChallengeStart';
    public static readonly LK_ACTIVE_MENU: string = 'TriviaAppActiveMenu';
    public static readonly LK_COMPLETED_RIVERS: string = 'TriviaAppCompletedRivers';
    public static readonly LK_VISIT_CAMPAIGN_QUESTIONS: string = 'TriviaAppVisitCampaignQuestions';
    public static readonly LK_TIMER_IS_PLAYING: string = 'TriviaAppTimerPlay';

    // For Firebase
    public static readonly FB_REF_USERS: string = 'users';
    public static readonly FB_REF_SEASONS: string = 'seasons';
    public static readonly FB_REF_COMPLETED_CAMPAIGNS: string = 'completedCampaigns';
    public static readonly FB_REF_QUESTION_RIVERS: string = 'questionRivers';
    public static readonly FB_REF_COMPLETED_RIVERS: string = 'completedRivers';
    public static readonly NORMAL_HIT: number = 50;
    public static readonly SPECIAL_HIT: number = 150;
    public static readonly CRITICAL_HIT: number = 250;
    
    
    
}