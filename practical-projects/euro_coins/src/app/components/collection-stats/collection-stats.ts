import { Component, inject } from '@angular/core';
import { CollectionService } from '../../services/collection.service';

@Component({
  selector: 'app-collection-stats',
  standalone: true,
  templateUrl: './collection-stats.html',
  styleUrl: './collection-stats.css'
})
export class CollectionStatsComponent {
  protected readonly collectionService = inject(CollectionService);
}
