import { Component, ElementRef, ViewChild } from '@angular/core';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';

@Component({
  selector: 'app-custom-header',
  standalone: true,
  template: `
    <div
      #headerContainer
      class="custom-header-container"
      [draggable]="true"
      (dragstart)="onDragStart($event)"
      (dragend)="onDragEnd($event)"
    >
      <div class="custom-header-label">{{ params.displayName }}</div>
    </div>
  `,
  styles: [`
    .custom-header-container {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      cursor: grab;
      user-select: none;
    }
    .custom-header-container:active {
      cursor: grabbing;
    }
    .custom-header-label {
      flex: 1;
      font-weight: bold;
    }
  `]
})
export class CustomHeaderComponent implements IHeaderAngularComp {
  public params!: IHeaderParams;

  agInit(params: IHeaderParams): void {
    this.params = params;
  }

  refresh(params: IHeaderParams): boolean {
    this.params = params;
    return true;
  }

  onDragStart(event: DragEvent) {
    if (event.dataTransfer) {
      // Required for Firefox to start drag
      event.dataTransfer.setData('text/plain', this.params.column.getColId());
      event.dataTransfer.effectAllowed = 'move';
    }

    // Dispatch a custom event to notify the main app
    const customEvent = new CustomEvent('app-column-drag-start', {
      detail: { colId: this.params.column.getColId(), displayName: this.params.displayName },
      bubbles: true,
    });
    document.dispatchEvent(customEvent);
  }

  onDragEnd(event: DragEvent) {
    const customEvent = new CustomEvent('app-column-drag-end', {
      bubbles: true,
    });
    document.dispatchEvent(customEvent);
  }
}
