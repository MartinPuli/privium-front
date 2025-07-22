import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-publish-info",
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: "./publish-info.component.html",
  styleUrls: ["./publish-info.component.scss"],
})
export class PublishInfoComponent {
  @Input({ required: true }) title!: string;
  @Input() description = "";
  @Input() continueDisabled = false;
  @Input() showFooter = false;
  @Input() disabled = false; 

  @Output() onCancel = new EventEmitter<void>();
  @Output() onContinue = new EventEmitter<void>();
}
