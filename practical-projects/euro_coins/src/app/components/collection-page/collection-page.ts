import { Component } from '@angular/core';
import { CollectionStatsComponent } from '../collection-stats/collection-stats';
import { CollectionGridComponent } from '../collection-grid/collection-grid';

@Component({
  selector: 'app-collection-page',
  standalone: true,
  imports: [CollectionStatsComponent, CollectionGridComponent],
  templateUrl: './collection-page.html',
  styleUrl: './collection-page.css',
})
export class CollectionPageComponent {}
