import { Component, inject } from '@angular/core';
import { CollectionService } from '../../services/collection.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-collection-stats',
  standalone: true,
  templateUrl: './collection-stats.html',
  styleUrl: './collection-stats.css'
})
export class CollectionStatsComponent {
  protected readonly collectionService = inject(CollectionService);
  private readonly router = inject(Router);

  onCountrySelect(country: string) {
    this.router.navigate([], { fragment: country });
  }
}
