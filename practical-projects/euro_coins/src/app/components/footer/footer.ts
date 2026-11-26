import { DatePipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { BUILD_INFO } from '../../build-info';

@Component({
  selector: 'app-footer',
  imports: [DatePipe],
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './footer.css',
})
export class Footer {
  protected readonly buildInfo = inject(BUILD_INFO);
}
