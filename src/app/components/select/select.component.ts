import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { SelectListItem } from '../../models/select-list-item.interface';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss']
})
export class SelectComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
  @Input() label: string = '';
  @Input() placeholder: string = 'Select';
  @Input() items: SelectListItem[] = [];
  @Input() maxItems: number = 0;
  @Input() disabled: boolean = false;

  @Output() valuesChanges = new EventEmitter<void>();

  @ViewChild(NgModel) filterInput!: NgModel;

  //#region [Properties]
  private _filteredSub!: Subscription | undefined;
  itemsFiltered: SelectListItem[] = [];
  filterText = '';
  //#endregion

  constructor() { }

  //#region [Ng functions]
  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['items'] && !changes['items'].firstChange) {
      this._setInput('');
    }
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this._processFilterSubscription();
  }

  ngOnDestroy(): void {
    this._filteredSub?.unsubscribe();
  }
  //#endregion  

  //#region [Init]
  private _processFilterSubscription() {
    if (!this._filteredSub) {
      this._filteredSub = this.filterInput.valueChanges?.subscribe(value => {
        const DATA = value && typeof value === 'string' ? this._filter(value) : this._itemsAvailable;
        this.itemsFiltered = DATA;
      });
    }
  }
  //#endregion

  //#region [Getters]
  private get _itemsAvailable(): SelectListItem[] {
    return this.items.filter(item => !item.selected).slice();
  }
  get itemsSelected(): SelectListItem[] {
    return this.items.filter(item => item.selected).slice();
  }

  get isDisabled(): boolean {
    return this.itemsSelected.length === this.maxItems || this.disabled;
  }

  get placeholderText(): string {
    if (this.disabled) {
      return '';
    }

    if (this.itemsSelected.length === this.maxItems) {
      return 'Max items selected';
    }

    return this.placeholder;
  }
  //#endregion

  //#region [Actions]
  onAdd(event: MatChipInputEvent): void {
    const VALUE = (event.value || '').trim();
    if (!VALUE) return;

    const SELECTED = this._itemsAvailable.find(item => item.value === VALUE);
    if (SELECTED) {
      this.onSelected(VALUE);
    }
  }

  onSelected(value: string): void {
    const ITEM = this.items.find((item: SelectListItem) => item.value === value);
    if (ITEM) {
      ITEM.selected = true;
      this._setInput('');
      // this.itemInput.nativeElement.value = '';
      this.valuesChanges.emit();
    }
  }

  onRemove(value: string): void {
    const ITEM = this.items.find((item: SelectListItem) => item.value === value);
    if (ITEM) {
      ITEM.selected = false;
      this._setInput(this.filterInput.value);
      this.valuesChanges.emit();
    }
  }
  //#endregion

  //#region [Helpers]
  private _setInput(value: any): void {
    this.filterText = value;
    this.filterInput.control.setValue(value);
  }

  private _filter(value: string): SelectListItem[] {
    const filterValue = value?.toLowerCase();
    return this._itemsAvailable.filter(item => item.value.toLowerCase().includes(filterValue));
  }
  //#endregion

}
