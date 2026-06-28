import { ComponentFixture, TestBed } from '@angular/core/testing';

import { L2vcProvisioningComponent } from './l2vc-provisioning.component';

describe('L2vcProvisioningComponent', () => {
  let component: L2vcProvisioningComponent;
  let fixture: ComponentFixture<L2vcProvisioningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [L2vcProvisioningComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(L2vcProvisioningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
