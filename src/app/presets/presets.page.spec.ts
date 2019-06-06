import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PresetsPage } from './presets.page';

describe('PresetsPage', () => {
  let component: PresetsPage;
  let fixture: ComponentFixture<PresetsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PresetsPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PresetsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
