import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScoreBoardPage } from './score-board.page';

describe('ScoreBoardPage', () => {
  let component: ScoreBoardPage;
  let fixture: ComponentFixture<ScoreBoardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreBoardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
