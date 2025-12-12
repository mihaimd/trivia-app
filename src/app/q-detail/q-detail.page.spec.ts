import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QDetailPage } from './q-detail.page';

describe('QDetailPage', () => {
  let component: QDetailPage;
  let fixture: ComponentFixture<QDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
