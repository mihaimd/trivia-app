import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Game0Page } from './game0.page';

describe('Game0Page', () => {
  let component: Game0Page;
  let fixture: ComponentFixture<Game0Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Game0Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
