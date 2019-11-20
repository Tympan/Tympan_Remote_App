import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionPage } from './prescription.page';

describe('PrescriptionPage', () => {
  let component: PrescriptionPage;
  let fixture: ComponentFixture<PrescriptionPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PrescriptionPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrescriptionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
