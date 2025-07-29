import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  Renderer2,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

export interface ModalButton {
  label: string;
  type?: "primary" | "secondary";
  action: () => void;
  disabled?: boolean;
  form?: string;
  loading?: boolean;
}

@Component({
  selector: "app-default-modal",
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: "./default-modal.component.html",
  styleUrls: ["./default-modal.component.scss"],
})
export class DefaultModalComponent implements OnInit, OnDestroy {
  @Input() title = "";
  @Input() buttons: ModalButton[] = [];
  /** Width of the modal container. Accepts any CSS width value. */
  @Input() width = '70vw';
  @Output() close = new EventEmitter<void>();

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, "modal-open");
  }

  trackByIdx(index: number) { return index; }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, "modal-open");
  }

  onClose(): void {
    this.close.emit();
  }
}
