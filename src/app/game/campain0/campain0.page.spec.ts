import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Campain0Page } from './campain0.page';

describe('Campain0Page', () => {
  let component: Campain0Page;
  let fixture: ComponentFixture<Campain0Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Campain0Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
