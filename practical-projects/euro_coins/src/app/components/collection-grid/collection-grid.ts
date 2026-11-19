import { Component, inject } from '@angular/core';
import { CoinDataService } from '../../services/coin-data.service';
import { CountrySectionComponent } from '../country-section/country-section';

@Component({
  selector: 'app-collection-grid',
  standalone: true,
  imports: [CountrySectionComponent],
  templateUrl: './collection-grid.html',
  styleUrl: './collection-grid.css'
})
export class CollectionGridComponent {
  protected readonly coinDataService = inject(CoinDataService);
}
