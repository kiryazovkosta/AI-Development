import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { Footer } from './components/footer/footer';
import { LockScreenComponent } from './components/lock-screen/lock-screen';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, Footer, LockScreenComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
