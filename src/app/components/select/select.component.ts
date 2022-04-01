import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SelectListItem } from '../../models/select-list-item.interface';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss']
})
export class SelectComponent implements OnInit, OnDestroy, OnChanges {
  @Input() label: string = '';
  @Input() placeholder: string = 'Select';
  @Input() items: SelectListItem[] = [];
  @Input() maxItems: number = 0;
  @Input() disabled: boolean = false;

  @Output() valuesChanges = new EventEmitter<void>();

  @ViewChild('itemInput') itemInput!: ElementRef<HTMLInputElement>;

  //#region [Properties]
  private _filteredSub!: Subscription;
  itemsFiltered: SelectListItem[] = [];
  inputCtrl = new FormControl();
  //#endregion

  constructor() { }

  //#region [Ng functions]
  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['items'] && !changes['items'].firstChange) {
      this.inputCtrl.setValue(this.inputCtrl.value);
    }
  }

  ngOnInit(): void {
    this._processFilterSubscription();
  }

  ngOnDestroy(): void {
    this._filteredSub.unsubscribe();
  }
  //#endregion  

  //#region [Init]
  private _processFilterSubscription() {
    if (!this._filteredSub) {
      this._filteredSub = this.inputCtrl.valueChanges
        .pipe(
          startWith(null),
          map((item: string | null) => (
            item && typeof item === 'string' ? this._filter(item) : this._itemsAvailable
          ))
        ).subscribe(data => {
          this.itemsFiltered = data;
        });
    }
  }

  private _filter(value: string): SelectListItem[] {
    const filterValue = value?.toLowerCase();
    return this._itemsAvailable.filter(item => item.value.toLowerCase().includes(filterValue));
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
      this._setInput(null);
      this.itemInput.nativeElement.value = '';
      this.valuesChanges.emit();
    }
  }

  onRemove(value: string): void {
    const ITEM = this.items.find((item: SelectListItem) => item.value === value);
    if (ITEM) {
      ITEM.selected = false;
      this._setInput(this.inputCtrl.value);
      this.valuesChanges.emit();
    }
  }
  //#endregion

  //#region [Helpers]
  private _setInput(value: any): void {
    this.inputCtrl.setValue(value);
    
    if (this.isDisabled) {
      this.inputCtrl.disable;
    } else {
      this.inputCtrl.enable;
    }
  }
  //#endregion

}
