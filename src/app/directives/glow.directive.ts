import { Directive, ElementRef, Renderer2, HostBinding, HostListener } from '@angular/core';

@Directive({
  selector: '[appGlow]',
  standalone: true
})
export class GlowDirective {
  @HostListener('cdkDropListEntered', ['$event'])
  onDragOver(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  this.shaking = true;  
  // Add your logic here to handle the dragover event
}
  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  this.shaking = false;
  // Add your logic here to handle the dragleave event
}
  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  this.shaking = false;
  // Add your logic here to handle the drop event
}
  @HostBinding('class.shake')
  shaking: boolean = false;

  constructor(elem: ElementRef, renderer: Renderer2) {
   }







}
