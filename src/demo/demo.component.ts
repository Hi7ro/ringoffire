import { Component, OnDestroy } from '@angular/core';
import { LocalDemoGame } from './local-game';

@Component({ selector: 'app-root', templateUrl: './demo.component.html', styleUrls: ['./demo.component.scss'] })
export class DemoComponent extends LocalDemoGame implements OnDestroy {
  private drawTimer?: ReturnType<typeof setTimeout>;
  constructor() { super(); }
  override takeCard(): boolean {
    if (!super.takeCard()) return false;
    this.game.pickCardAnimation = true;
    this.drawTimer = setTimeout(() => { this.game.pickCardAnimation = false; this.drawTimer = undefined; }, 900);
    return true;
  }
  override restartRound(): void { this.cancelAnimation(); super.restartRound(); }
  override reset(): void { this.cancelAnimation(); super.reset(); }
  private cancelAnimation(): void { if (this.drawTimer !== undefined) clearTimeout(this.drawTimer); this.drawTimer = undefined; this.game.pickCardAnimation = false; }
  ngOnDestroy(): void { this.cancelAnimation(); }
}
