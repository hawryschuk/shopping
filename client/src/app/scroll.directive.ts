import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({ selector: 'a[href]' })
export class ScrollDirective {
  constructor(public el: ElementRef) { }
  get href(): string { return this.el.nativeElement.getAttribute('href'); }
  @HostListener('click', ['$event']) onClick($event: Event) {
    if (this.href.startsWith('#')) {
      $event.stopPropagation();
      $event.preventDefault();
      const text = this.el.nativeElement.innerHTML;
      const h2s: HTMLElement[] = Array.from(this.el.nativeElement.parentNode.querySelectorAll('h2'));
      const h2 = h2s.find(el => el.innerHTML === text);
      debugger;
      if (h2) h2.scrollIntoView();
    }
  }

}
