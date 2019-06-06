import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlsPage } from './controls.page';

describe('ControlsPage', () => {
  let component: ControlsPage;
  let fixture: ComponentFixture<ControlsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ControlsPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
