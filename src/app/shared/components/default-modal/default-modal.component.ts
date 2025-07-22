import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

export interface ModalButton {
  label: string;
  type?: "primary" | "secondary";
  action: () => void;
  disabled?: boolean;
}

@Component({
  selector: "app-default-modal",
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: "./default-modal.component.html",
  styleUrls: ["./default-modal.component.scss"],
})
export class DefaultModalComponent {
  @Input() title = "";
  @Input() buttons: ModalButton[] = [];
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
