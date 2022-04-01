import { Component, HostListener, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import { Title } from '@angular/platform-browser';
import { SwPush } from '@angular/service-worker';
import { SelectListItem } from './models/select-list-item.interface';
import { Source } from './models/source.interface';
import { Article } from './models/article.interface';
import { FiltersSelected } from './models/filters-selected.interface';
import { DataService } from './services/data.service';
import { NewsletterService } from './services/newsletter.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  //#region [Private properties]
  private readonly _TITLE = '[[IPP]] News';
  private readonly _VAPID_PUBLIC_KEY = environment.VAPID_PUBLIC_KEY;
  private _filtersSelected!: FiltersSelected;
  private _categories: string[] = [];
  private _sources: Source[] = [];
  private readonly _pageSize: number = 100;
  private _pageMax: number = 1;
  private _pageActive: number = 1;
  private _totalArticles: number = 0;
  private _interval: any;
  _timeLeft: number = 0;
  //#endregion

  //#region [Public properties]
  isFiltersExpanded: boolean = true;
  isLoading: boolean = false;

  categoriesList: SelectListItem[] = [];
  sourcesList: SelectListItem[] = [];
  refreshTimeInSeconds: string = '';
  startDate: string = '';
  endDate: string = '';

  articles: Article[] = [];
  totalArticlesNew: number = 0;
  //#endregion

  constructor(
    private readonly _dataService: DataService,
    private readonly _snackBar: MatSnackBar,
    private readonly _titleService: Title,
    private readonly _swPush: SwPush,
    private readonly _newsletterService: NewsletterService
  ) { }

  //#region [Ng functions]
  ngOnInit(): void {
    this._titleService.setTitle(this._TITLE);
    this._processCategories();
    this._processSources();
    this._subscribeToNotifications();
  }
  //#endregion

  //#region [Init]
  private _processCategories(): void {
    this._dataService.getCategories()
      .subscribe(res => {
        console.log('categories: ', res);
        this._categories = res;
        this.categoriesList = this._categories.map(category => (
          {
            key: category,
            value: category,
            selected: false
          } as SelectListItem
        ));
      });
  }

  private _processSources(): void {
    this._dataService.getSources()
      .subscribe(res => {
        console.log('sources: ', res.sources);
        this._sources = res.sources;
      });
  }
  //#endregion

  //#region [Getters]
  get isDisabledSource(): boolean {
    return this._categoreisSelected.length === 0;
  }

  get isInitApp(): boolean {
    return this._filtersSelected && parseInt(this._filtersSelected.refresh) > 0;
  }

  private get _categoreisSelected(): string[] {
    return this.categoriesList
      .filter(category => category.selected)
      .map(category => category.key);
  }

  private get _sourcesSelected(): string[] {
    return this.sourcesList
      .filter(source => source.selected)
      .map(source => source.key);
  }

  private get _startDateFormat(): string {
    if (this.startDate !== '') {
      return new Date(this.startDate).toISOString().split('T')[0];
    }
    return '';
  }

  private get _endDateFormat(): string {
    if (this.endDate !== '') {
      return new Date(this.endDate).toISOString().split('T')[0];
    }
    return '';
  }
  //#endregion

  //#region [Navbar actions]
  onHome(): void {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    this._sendNewsletter();
  }

  onFilters(): void {
    this.isFiltersExpanded = !this.isFiltersExpanded;

    if (!this.isFiltersExpanded) {
      this._resetFilters();
    }
  }

  private _resetFilters(): void {
    if (!this._filtersSelected) {
      return;
    }

    this.categoriesList.forEach(category => {
      category.selected = this._filtersSelected.categories.includes(category.key);
    });

    this._prepareSourcesList();

    this.sourcesList.forEach(source => {
      source.selected = this._filtersSelected.sources.includes(source.key);
    });

    this.refreshTimeInSeconds = this._filtersSelected.refresh;
  }
  //#endregion

  //#region [Filters actions]
  onCategoriesChanges(): void {
    this._prepareSourcesList();
  }

  private _prepareSourcesList(): void {
    const CATEGORIES_SELECTED = this._categoreisSelected;
    const SOURCES_SELECTED = this._sourcesSelected;

    this.sourcesList = this._sources
      .filter((source: Source) =>
        CATEGORIES_SELECTED.includes(source.category)
      )
      .map(source => (
        {
          key: source.id,
          value: source.name,
          selected: SOURCES_SELECTED.includes(source.id)
        } as SelectListItem
      ));
  }
  //#endregion

  //#region [Search]
  onSearch(): void {
    // validate
    if (this._categoreisSelected.length === 0 || this._sourcesSelected.length === 0 || !(parseInt(this.refreshTimeInSeconds) > 0)) {
      return this._openSnackBar('You must select at least one category, one source and specify the time to refresh.');
    }

    this._storeFilters();

    this._pageActive = 1;
    this.isFiltersExpanded = false;
    this.articles = [];
    this._processArticles();
  }

  private _storeFilters(): void {
    this._filtersSelected = {
      categories: this._categoreisSelected,
      sources: this._sourcesSelected,
      refresh: this.refreshTimeInSeconds
    };
    console.log("Filters: ", this._filtersSelected);
  }

  @HostListener("window:scroll", ["$event"])
  onWindowScroll() {
    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max = document.documentElement.scrollHeight;
    if (pos === max) {
      this._searchNextPage();
    }
  }

  private _searchNextPage(): void {
    if (this._pageActive === this._pageMax || this.isLoading) return;

    this._pageActive += 1;
    this._processArticles();
  }

  private _processArticles(comesFromTimer: boolean = false): void {
    this.isLoading = true;
    this._dataService.getNews(this._filtersSelected.sources, this._pageActive, this._startDateFormat, this._endDateFormat)
      .subscribe(res => {
        console.log('articles: ', res.articles);

        if (this._pageActive === 1) {
          this._pageMax = Math.ceil(res.totalResults / this._pageSize);
          this.articles = res.articles;
          if (comesFromTimer) {
            this._notifyNewArticles(res.totalResults);
          }
          this._totalArticles = res.totalResults;

        } else {
          this.articles.push(...res.articles);
        }

        // reset timer every call to API
        this._setupTimer();
        this.isLoading = false;
      });
  }

  private _setupTimer(): void {
    if (!(this._filtersSelected && parseInt(this._filtersSelected.refresh) > 0)) {
      return;
    }

    this._resetTimer();
    this._timeLeft = parseInt(this._filtersSelected.refresh);

    this._interval = setInterval(() => {
      if (this._timeLeft > 0) {
        this._timeLeft--;
      } else {
        this.articles = [];
        this._processArticles(true);
        // this._timeLeft = parseInt(this._filtersSelected.refresh);
      }
    }, 1000);
  }

  private _resetTimer(): void {
    if (this._interval) {
      clearInterval(this._interval);
    }
  }
  //#endregion

  //#region [Notify new articles]
  private _subscribeToNotifications(): void {
    if (!environment.production) {
      return;
    }

    if (this._swPush.isEnabled) {
      return;
    }

    this._swPush.requestSubscription({
      serverPublicKey: this._VAPID_PUBLIC_KEY
    })
      .then(sub => this._newsletterService.addPushSubscriber(sub).subscribe())
      .catch(err => console.error("Could not subscribe to notifications", err));
  }

  private _sendNewsletter(): void {
    if (!environment.production) {
      return;
    }

    console.log("Sending Newsletter to all Subscribers ...");
    this._newsletterService.send().subscribe();
  }

  private _notifyNewArticles(newTotalArticles: number) {
    if (this._startDateFormat === '' && this._endDateFormat === '') {
      this.totalArticlesNew = newTotalArticles - this._totalArticles;
    } else {
      this.totalArticlesNew = 0;
    }

    if (this.totalArticlesNew > 0) {
      this._titleService.setTitle(`${this._TITLE} (${this.totalArticlesNew})`);
    } else {
      this._titleService.setTitle(this._TITLE);
    }
  }
  //#endregion

  //#region [Date actions]
  onClearDates(): void {
    this.startDate = '';
    this.endDate = '';
    this._searchArticleDates();
  }

  onDatesChanges(): void {
    this._searchArticleDates();
  }

  private _searchArticleDates() {
    this._pageActive = 1;
    this.isFiltersExpanded = false;
    this.articles = [];
    this._processArticles();
  }
  //#endregion

  //#region [Helpers]
  private _openSnackBar(message: string, action: string | undefined = undefined, durationInSeconds: number = 5): void {
    this._snackBar.open(message, action, { duration: durationInSeconds * 1000 });
  }
  //#endregion

}
