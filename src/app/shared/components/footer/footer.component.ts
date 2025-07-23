import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup,
} from "@angular/forms";
import { DefaultModalComponent, ModalButton } from "../default-modal/default-modal.component";
import { FormFieldComponent } from "../form-field/form-field.component";
import { CategoryService } from "../../services/category.service";
import { ProfileService } from "../../services/profile.service";
import { AuthService } from "../../services/auth.service";
import { ContactService } from "../../services/contact.service";
import { ListListingsRequestDto } from "../../models/listing.model";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    DefaultModalComponent,
    FormFieldComponent,
  ],
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
})
export class FooterComponent {
  @Input() logged = true;
  currentYear = new Date().getFullYear();

  categories = [
    'Vehículos',
    'Hogar',
    'Muebles',
    'Indumentaria',
    'Electrónica',
  ];

  // ----- modals -----
  contactOpen = false;
  deleteOpen = false;
  termsOpen = false;

  contactForm: FormGroup = this.fb.group({
    subject: ['', Validators.required],
    body: ['', Validators.required],
  });

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private categorySrv: CategoryService,
    private profileSrv: ProfileService,
    private auth: AuthService,
    private contactSrv: ContactService
  ) {}

  // ----- navegación por categoría -----
  onCategory(name: string): void {
    const cat = this.categorySrv
      .getCached()
      .find((c) => c.name.toLowerCase() === name.toLowerCase());

    const req: Partial<ListListingsRequestDto> = { page: 1, sortOrder: 'DESC' };

    if (cat) {
      req.categoryIds = [cat.id];
    } else {
      switch (name.toLowerCase()) {
        case 'vehículos':
        case 'vehiculos':
          req.type = 'VEHICULO';
          break;
        case 'muebles':
          req.type = 'MUEBLE';
          break;
        case 'hogar':
          req.type = 'INMUEBLE';
          break;
      }
    }

    this.router.navigate(['/search'], { state: { request: req } });
  }

  goToPublish(): void {
    this.router.navigate(['/publish']);
  }

  openTerms(): void {
    this.termsOpen = true;
  }

  openDelete(): void {
    this.deleteOpen = true;
  }

  openContact(): void {
    this.contactForm.reset();
    this.contactOpen = true;
  }

  get contactButtons(): ModalButton[] {
    return [
      { label: 'Cancelar', type: 'secondary', action: () => this.contactOpen = false },
      {
        label: 'Enviar',
        type: 'primary',
        action: () => this.sendContact(),
        disabled: this.contactForm.invalid,
      },
    ];
  }

  get deleteButtons(): ModalButton[] {
    return [
      { label: 'Cancelar', type: 'secondary', action: () => (this.deleteOpen = false) },
      { label: 'Confirmar', type: 'primary', action: () => this.deleteAccount() },
    ];
  }

  readonly termsButtons: ModalButton[] = [
    { label: 'Cerrar', type: 'primary', action: () => (this.termsOpen = false) },
  ];

  private async sendContact(): Promise<void> {
    if (this.contactForm.invalid) return;
    try {
      await this.contactSrv.send(this.contactForm.value);
    } finally {
      this.contactOpen = false;
    }
  }

  private async deleteAccount(): Promise<void> {
    await this.profileSrv.deleteAccount();
    this.deleteOpen = false;
    this.auth.logout();
  }
}
