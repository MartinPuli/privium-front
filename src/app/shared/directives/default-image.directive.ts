import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img[appDefaultImage]',
  standalone: true,
})
export class DefaultImageDirective {
  @Input() appDefaultImage = '/assets/images/warning.svg';

  constructor(private el: ElementRef<HTMLImageElement>) {}

  @HostListener('error')
  onError() {
    const element = this.el.nativeElement;
    if (element.src !== this.appDefaultImage) {
      element.src = this.appDefaultImage;
    }
  }
}
