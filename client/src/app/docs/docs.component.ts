import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import mermaid from 'mermaid';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.sass']
})
export class DocsComponent implements OnInit {

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    mermaid.initialize({ securityLevel: 'loose' });
    mermaid.init();
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
  ngAfterViewInit() { this.ngOnInit() }

}
