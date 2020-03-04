import { Component, ViewChild } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { Logger } from '../../providers/logger';
import { Plotter } from '../../providers/plotter';
import { ButtonComponent } from './presetcomponents/button/button.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'presets.page.html',
  styleUrls: ['presets.page.scss', '../prescription/prescription.page.scss']
})
export class PresetsPage {
    @ViewChild("lineCanvas") lineCanvas;
    textInput: string;

    constructor(public remote: TympanRemote, public logger:Logger, public plotter: Plotter, public buttonComp: ButtonComponent) {
    }

    cmd(s: string) {
        this.remote.send(s);
    }

    public stopSerialPlot() {
      this.remote.send('}')
    }

    public makeSerialPlot() {
      this.remote.send(']')
      this.lineCanvas = this.plotter.lineC;
    }

    saveChart() {
      let chart = <HTMLCanvasElement> document.getElementById('myChart') 
      var chartImage = chart.toDataURL('image/jpg')
      document.getElementById('imgLocation').innerHTML = '<img src="'+ chartImage +'" width="100" height="100"/>'
    }

    exportChart(chartData = []) {
      var csv = '';
      chartData.forEach(function(row) {
        csv += row.join(',');
        csv += "\n";
      });

      this.remote.writeTRDataFile(csv);
    }
}