import { Component, OnInit } from '@angular/core';
import { TympanRemote } from 'src/providers/tympan-remote';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {

  constructor(public remote: TympanRemote) { }

  ngOnInit() {
  }

  cmd(s: string) {
    this.remote.send(s);
    //this.applyStyleToBtnWithCmd(s);
}
}
