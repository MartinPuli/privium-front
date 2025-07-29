import {
  Component,
  EventEmitter,
  Input,
  Output,
  forwardRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import {
  type ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgModelGroup,
  ReactiveFormsModule,
} from "@angular/forms";

export type FormFieldType =
  | "text"
  | "email"
  | "password"
  | "tel"
  | "textarea"
  | "select"
  | "checkbox"
  | "file"
  | "radio"
  | "date"
  | "money";

export interface SelectOption {
  value: any;
  label: string;
}

@Component({
  selector: "app-form-field",
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, FormsModule],
  templateUrl: "./form-field.component.html",
  styleUrls: ["./form-field.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
      multi: true,
    },
  ],
})
export class FormFieldComponent implements ControlValueAccessor {
  @Input() label!: string;
  @Input() subLabel?: string;
  @Input() type: FormFieldType = "text";
  @Input() placeholder = "";
  @Input() errorMessage = "";
  @Input() hasError = false;
  @Input() disabled = false;
  @Input() required = false;
  @Input() options: SelectOption[] = [];
  @Input() rows = 4;
  @Input() showPasswordToggle = false;
  @Input() prefixIcon?: string;
  @Input() suffixIcon?: string;
  @Input() currencySymbol: string = "$";
  @Input() maxLength?: number;

  @Output() selected = new EventEmitter<any>();

  value: any = "";
  hidePassword = true;

  readonly fieldId = crypto.randomUUID();

  onChange = (value: any) => {};
  onTouched = () => {};

  writeValue(value: any): void {
    this.value = value ?? (this.type === "file" ? null : "");
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    if (this.type === "file") {
      const files = (target as HTMLInputElement).files;
      const file = files && files.length ? files[0] : null;
      this.value = file;
      this.onChange(file);
      if (file) {
        this.selected.emit(file);
      }
    } else {
      this.value = target.value;
      this.onChange(this.value);
    }
    this.onTouched();
  }

  onSelect(val: any): void {
    this.value = val;
    this.onChange(val);
    this.onTouched();
  }

  onCheckboxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.checked;
    this.onChange(this.value);
    this.onTouched();
  }

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  getInputType(): string {
    if (this.type === "password" && this.showPasswordToggle) {
      return this.hidePassword ? "password" : "text";
    }
    return this.type;
  }

  /** Limpia el archivo seleccionado */
  clearFile(): void {
    // 1) resetea el valor interno y del formControl
    this.value = null;
    this.onChange(null);

    // 2) notifica al padre (si tiene suscriptor)
    this.selected.emit(null);

    // 3) View: permite volver a seleccionar
    this.onTouched();
  }
}
