import {Component} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-in-stock',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './in-stock.component.html',
  styleUrl: './in-stock.component.scss'
})
export class InStockComponent {

}
