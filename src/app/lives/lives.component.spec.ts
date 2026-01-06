import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LivesComponent } from './lives.component';

describe('LivesComponent', () => {
  let component: LivesComponent;
  let fixture: ComponentFixture<LivesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LivesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LivesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
