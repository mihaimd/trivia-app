import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoldCoinsPage } from './gold-coins.page';

describe('GoldCoinsPage', () => {
  let component: GoldCoinsPage;
  let fixture: ComponentFixture<GoldCoinsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GoldCoinsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
