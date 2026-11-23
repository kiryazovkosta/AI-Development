import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BUILD_INFO } from '../../build-info';

@Component({
  selector: 'app-footer',
  imports: [DatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  protected readonly buildInfo = inject(BUILD_INFO);
}
