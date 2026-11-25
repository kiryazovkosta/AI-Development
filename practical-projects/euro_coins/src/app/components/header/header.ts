import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MenuComponent } from '../menu/menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MenuComponent],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './header.css',
})
export class HeaderComponent {}
