import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit {
  constructor() {}
  ngOnInit(): void {}

  @Input() name: any;
  @Input() playerActive: boolean = false;
}
