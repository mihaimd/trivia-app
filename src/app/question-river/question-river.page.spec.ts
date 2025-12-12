import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionRiverPage } from './question-river.page';

describe('QuestionRiverPage', () => {
  let component: QuestionRiverPage;
  let fixture: ComponentFixture<QuestionRiverPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionRiverPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
