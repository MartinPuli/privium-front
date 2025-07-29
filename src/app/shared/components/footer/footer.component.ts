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
import { DefaultImageDirective } from '../../directives/default-image.directive';

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    DefaultModalComponent,
    FormFieldComponent,
    DefaultImageDirective,
  ],
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
})
export class FooterComponent {
  @Input() logged = true;
  currentYear = new Date().getFullYear();

  /**
   * Botones rápidos de búsqueda. Cada opción redirige a la pantalla de
   * resultados con un filtro predefinido en el navigation state.
   */
  categories = [
    'Servicios',
    'Inmuebles',
    'Muebles',
    'Vehículos',
    'Indumentaria',
  ];

  // ----- modals -----
  contactOpen = false;
  deleteOpen = false;
  termsOpen = false;
  contactLoading = false;
  deleteLoading = false;

  contactForm: FormGroup = this.fb.group({
    message: ['', Validators.required],
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
    const req: Partial<ListListingsRequestDto> = { page: 1, sortOrder: 'DESC' };

    switch (name.toLowerCase()) {
      case 'servicios':
        req.type = 'SERVICIO';
        break;
      case 'inmuebles':
        req.type = 'INMUEBLE';
        break;
      case 'muebles':
        req.type = 'MUEBLE';
        break;
      case 'vehículos':
      case 'vehiculos':
        req.type = 'VEHICULO';
        break;
      case 'indumentaria':
        req.categoryIds = ['5'];
        break;
      default: {
        const cat = this.categorySrv
          .getCached()
          .find((c) => c.name.toLowerCase() === name.toLowerCase());
        if (cat) req.categoryIds = [cat.id];
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
        form: 'contactForm',
        action: () => this.sendContact(),
        disabled: this.contactForm.invalid,
        loading: this.contactLoading,
      },
    ];
  }

  get deleteButtons(): ModalButton[] {
    return [
      { label: 'Cancelar', type: 'secondary', action: () => (this.deleteOpen = false) },
      { label: 'Confirmar', type: 'primary', action: () => this.deleteAccount(), loading: this.deleteLoading },
    ];
  }

  readonly termsButtons: ModalButton[] = [
    { label: 'Cerrar', type: 'primary', action: () => (this.termsOpen = false) },
  ];

  private async sendContact(): Promise<void> {
    if (this.contactForm.invalid) return;
    try {
      this.contactLoading = true;
      await this.contactSrv.send(this.contactForm.value);
    } finally {
      this.contactLoading = false;
      this.contactOpen = false;
    }
  }

  private async deleteAccount(): Promise<void> {
    this.deleteLoading = true;
    await this.profileSrv.deleteAccount();
    this.deleteLoading = false;
    this.deleteOpen = false;
    this.auth.logout();
  }
}
