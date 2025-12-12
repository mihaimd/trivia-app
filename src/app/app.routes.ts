import { Routes } from '@angular/router';
import { TabsPage } from './tabs/tabs.page';
/* import { authGuard } from './services/auth.guard'; */

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/home',
    pathMatch: 'full'
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.page').then( m => m.SignupPage)
  },
  {
    path: 'tabs',
    component: TabsPage,
    /* canActivate: [authGuard], */
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage),
      },
      {
        path: 'score-board',
        loadComponent: () => import('./score-board/score-board.page').then(m => m.ScoreBoardPage),
      },
      {
        path: 'campaigns',
        loadComponent: () => import('./campaigns/campaigns.page').then( m => m.CampaignsPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage),
      },
      {
        path: 'home/how-to',
        loadComponent: () => import('./how-to/how-to.page').then(m => m.HowToPage)
      },
      {
        path: 'home/question-river',
        loadComponent: () => import('./question-river/question-river.page').then(m => m.QuestionRiverPage)
      },
      {
        path: 'home/campain0/:chapterId/:gameId/:campaignId/:starScreen',
        loadComponent: () => import('./game/campain0/campain0.page').then(m => m.Campain0Page)
      },
      {
        path: 'home/q-detail/:chapterId/:gameId/:campaignId/:questionId/:lastQuestion/:isRiverQuestion',
        loadComponent: () => import('./q-detail/q-detail.page').then(m => m.QDetailPage)
      },
      {
        path: 'home/game/:chapterId/:gameId',
        loadComponent: () => import('./game/game-home/game.page').then(m => m.GamePage),
      },
      {
        path: 'home/game0/:completedCampaign',
        loadComponent: () => import('./game/game0/game0.page').then(m => m.Game0Page)
      },
      {
        path: 'home/gold-coins',
        loadComponent: () => import('./gold-coins/gold-coins.page').then( m => m.GoldCoinsPage)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      }
    ],
  },

];

