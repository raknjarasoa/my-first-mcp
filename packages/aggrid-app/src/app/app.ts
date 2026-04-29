import { Component, OnInit, HostListener, NgZone, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi, ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';
import { CustomHeaderComponent } from './custom-header.component';

// Register the Community Module
ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface DraggedColumnInfo {
  colId: string;
  displayName: string;
}

interface OverlayInfo {
  left: number;
  width: number;
  colId: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  template: `
    <div class="app-container" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
      <h1>AG Grid Drag Overlay Feature</h1>

      <div class="grid-wrapper" #gridWrapper>
        <ag-grid-angular
          class="ag-theme-alpine"
          [rowData]="rowData"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          (gridReady)="onGridReady($event)"
          (bodyScroll)="onBodyScroll($event)"
          style="width: 100%; height: 600px;">
        </ag-grid-angular>

        <!-- Dynamic Overlay -->
        <div *ngIf="isDragging && overlayInfo && isOverlayVisible"
             class="column-overlay"
             [style.left.px]="overlayInfo.left"
             [style.width.px]="overlayInfo.width"
             (dragover)="onOverlayDragOver($event)"
             (dragleave)="onOverlayDragLeave($event)"
             (drop)="onOverlayDrop($event)">

             <div class="drop-zone top-zone"
                  [class.active-zone]="hoveredZone === 'top'"
                  (dragenter)="hoveredZone = 'top'">
               Drop Here (Top)
             </div>
             <div class="drop-zone bottom-zone"
                  [class.active-zone]="hoveredZone === 'bottom'"
                  (dragenter)="hoveredZone = 'bottom'">
               Drop Here (Bottom)
             </div>

             <div *ngIf="droppedInfo" class="dropped-info">
               Dropped: {{ droppedInfo }}
             </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      padding: 20px;
      height: 100vh;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .grid-wrapper {
      flex: 1;
      position: relative;
      overflow: hidden; /* contain the overlay */
    }
    .column-overlay {
      position: absolute;
      top: 0;
      bottom: 0;
      background-color: rgba(0, 123, 255, 0.3);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      pointer-events: auto; /* Allow events on overlay */
    }
    .drop-zone {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed transparent;
      color: white;
      font-weight: bold;
      font-size: 1.2rem;
      text-shadow: 1px 1px 2px black;
      transition: background-color 0.2s, border-color 0.2s;
    }
    .active-zone {
      background-color: rgba(0, 255, 0, 0.4);
      border-color: #00ff00;
    }
    .dropped-info {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      color: black;
      padding: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      font-weight: bold;
      z-index: 1001;
    }
  `]
})
export class App implements OnInit {
  @ViewChild('gridWrapper') gridWrapper!: ElementRef;

  private gridApi!: GridApi;

  public columnDefs: ColDef[] = [];
  public defaultColDef: ColDef = {
    flex: 0,
    width: 200,
    resizable: true,
    headerComponent: CustomHeaderComponent,
    suppressMovable: true, // we handle drag and drop manually
  };
  public rowData: any[] = [];

  // Drag State
  public isDragging = false;
  public draggedCol: DraggedColumnInfo | null = null;
  public overlayInfo: OverlayInfo | null = null;
  public isOverlayVisible = false;
  public hoveredZone: 'top' | 'bottom' | null = null;
  public droppedInfo: string | null = null;

  private scrollLeft = 0;
  private scrollAnimationId: any = null;

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.columnDefs = Array.from({ length: 15 }).map((_, i) => ({
      field: `col${i + 1}`,
      headerName: `Column ${i + 1}`
    }));

    this.rowData = Array.from({ length: 100 }).map((_, rowIndex) => {
      const row: any = {};
      for (let i = 0; i < 15; i++) {
        row[`col${i + 1}`] = `R${rowIndex + 1} C${i + 1}`;
      }
      return row;
    });
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  @HostListener('document:app-column-drag-start', ['$event'])
  onDragStartEvent(event: any) {
    this.isDragging = true;
    this.draggedCol = event.detail;
    this.droppedInfo = null; // reset drop info
  }

  @HostListener('document:app-column-drag-end', ['$event'])
  onDragEndEvent(event: any) {
    if (this.droppedInfo) {
      // Keep showing for a moment to see the dropped info
      setTimeout(() => {
        this.resetDragState();
      }, 2000);
    } else {
      this.resetDragState();
    }
  }

  private resetDragState() {
    this.isDragging = false;
    this.draggedCol = null;
    this.overlayInfo = null;
    this.isOverlayVisible = false;
    this.hoveredZone = null;
    this.droppedInfo = null;
    this.stopEdgeScrolling();
  }

  onBodyScroll(event: any) {
    if (event.direction === 'horizontal') {
      this.scrollLeft = event.left;
    }
  }

  onDragOver(event: DragEvent) {
    if (!this.isDragging) return;
    event.preventDefault(); // necessary to allow dropping

    if (this.gridApi && this.gridWrapper) {
      const wrapperRect = this.gridWrapper.nativeElement.getBoundingClientRect();
      const mouseX = event.clientX;

      // Handle edge scrolling
      this.handleEdgeScrolling(mouseX, wrapperRect);

      // Determine hovered column if not too close to edge
      const relativeX = mouseX - wrapperRect.left + this.scrollLeft;

      let accumulatedWidth = 0;
      let targetCol = null;
      let targetColWidth = 0;
      let targetColLeft = 0;

      const displayedCols = this.gridApi.getAllDisplayedColumns();
      if (!displayedCols) return;

      for (const col of displayedCols) {
        const colWidth = col.getActualWidth();
        if (relativeX >= accumulatedWidth && relativeX < accumulatedWidth + colWidth) {
          targetCol = col;
          targetColWidth = colWidth;
          targetColLeft = accumulatedWidth;
          break;
        }
        accumulatedWidth += colWidth;
      }

      if (targetCol) {
        // Overlay left is relative to the wrapper, so subtract scrollLeft
        const renderLeft = targetColLeft - this.scrollLeft;

        // Hide overlay if it goes outside the bounds significantly (due to scrolling)
        if (renderLeft + targetColWidth < 0 || renderLeft > wrapperRect.width) {
             this.overlayInfo = null;
        } else {
            this.overlayInfo = {
                left: renderLeft,
                width: targetColWidth,
                colId: targetCol.getColId()
            };
        }
      } else {
        this.overlayInfo = null;
      }
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
  }

  onOverlayDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary for drop
    // Events bubble up to onDragOver to keep position updated
  }

  onOverlayDragLeave(event: DragEvent) {
    // Only clear if we actually left the overlay container, not entering a child
    if (event.relatedTarget) {
      const related = event.relatedTarget as HTMLElement;
      if (related && related.closest && related.closest('.column-overlay')) {
         return; // Still inside overlay
      }
    }
    this.hoveredZone = null;
  }

  onOverlayDrop(event: DragEvent) {
    event.preventDefault();
    if (this.draggedCol && this.overlayInfo && this.hoveredZone) {
      this.droppedInfo = `${this.draggedCol.displayName} -> ${this.hoveredZone} of ${this.overlayInfo.colId}`;
    }
  }

  private handleEdgeScrolling(mouseX: number, rect: DOMRect) {
    const scrollThreshold = 50; // pixels from edge to trigger scroll
    const scrollSpeed = 10;

    let shouldScroll = false;
    let scrollDirection = 0;

    if (mouseX - rect.left < scrollThreshold) {
      shouldScroll = true;
      scrollDirection = -scrollSpeed;
      this.isOverlayVisible = false; // Hide when near edge
    } else if (rect.right - mouseX < scrollThreshold) {
      shouldScroll = true;
      scrollDirection = scrollSpeed;
      this.isOverlayVisible = false; // Hide when near edge
    } else {
      this.stopEdgeScrolling();
      this.isOverlayVisible = true; // Show when away from edge
    }

    if (shouldScroll && !this.scrollAnimationId) {
      this.startEdgeScrolling(scrollDirection);
    } else if (shouldScroll && this.scrollAnimationId) {
       // Update speed if needed, for simplicity we keep it constant
    }
  }

  private startEdgeScrolling(amount: number) {
    this.ngZone.runOutsideAngular(() => {
      const scrollStep = () => {
        if (!this.gridApi) return;

        // Attempt to scroll the grid horizontally
        // AG Grid API doesn't have a direct 'scrollBy' method, but we can access the element
        const gridBody = document.querySelector('.ag-body-viewport') as HTMLElement;
        if (gridBody) {
             gridBody.scrollLeft += amount;
        }

        this.scrollAnimationId = requestAnimationFrame(scrollStep);
      };
      this.scrollAnimationId = requestAnimationFrame(scrollStep);
    });
  }

  private stopEdgeScrolling() {
    if (this.scrollAnimationId) {
      cancelAnimationFrame(this.scrollAnimationId);
      this.scrollAnimationId = null;
    }
  }
}
