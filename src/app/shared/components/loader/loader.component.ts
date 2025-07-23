import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-default-loader",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./loader.component.html",
  styleUrls: ["./loader.component.scss"],
})
export class LoaderComponent {}
