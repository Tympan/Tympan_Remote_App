import { Component, ViewChild } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { Logger } from '../../providers/logger';
import { ButtonComponent } from './presetcomponents/button/button.component';
import 'chartjs-plugin-streaming';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-tab2',
  templateUrl: 'presets.page.html',
  styleUrls: ['presets.page.scss', '../prescription/prescription.page.scss']
})
export class PresetsPage {
    @ViewChild("lineCanvas") lineCanvas;
    textInput: string;

    constructor(public remote: TympanRemote, public logger:Logger, public buttonComp: ButtonComponent) {
    }

    cmd(s: string) {
        this.remote.send(s);
    }

    public makeSerialPlot() {
      this.remote.send(']')
      let lineC = undefined
      let lenDataset = undefined;
      let fullDatasets = []
      let myChart = undefined;
      var chartColors = [
        'rgb(255, 99, 132)',    //red
        'rgb(255, 159, 64)',    //orange
        'rgb(255, 205, 86)',    //yellow
        'rgb(75, 192, 192)',    //green
        'rgb(54, 162, 235)',    //blue
        'rgb(153, 102, 255)',   //purple
        'rgb(201, 203, 207)',   //grey
        'rgb(0, 0, 0)'          //black
      ];

      if (this.remote.bluetooth && this.remote.btSerial) {
        this.logger.log('subscribingx');
        this.remote.btSerial.subscribe('\n').subscribe((data)=>{parsePlotterStringFromDevice(data, myChart);});
      }

      function parsePlotterStringFromDevice(data: string, myChart) {
        console.log('data',data);
        if (data[0] == 'P'){
        let serialData = data.split(',');
        serialData[0] = serialData[0].slice(1);
        let serialPlotData = [];
        for (var n in serialData) {
          serialPlotData[n] = parseFloat(serialData[n]);
        }
        if (myChart != undefined){
          console.log('refreshing chart');
          onRefresh(myChart, serialPlotData);
        }
        if (lenDataset == undefined) {
          lenDataset = serialPlotData.length;
          if (typeof serialPlotData[0] == 'string'){
            let labels = serialPlotData;
            addDatasets(lenDataset, labels);
          }
          else {
            addDatasets(lenDataset);
          }
        }
      }
    }
      
      function addDatasets(data, labels = undefined) {
        for (let dset=0; dset<data; dset++) {
          let dataName = undefined
          if (labels != undefined){
            dataName = labels[dset]
          }
          else {
            dataName = 'Dataset ' + (dset + 1)
          }
          let newDataset = {
            label: dataName,
            backgroundColor: "rgba(0, 0, 0, 0)",
            borderColor: chartColors[dset],
            fill: false,
            lineTension: 0,
            data: []
          };
          fullDatasets.push(newDataset);
        }

        var fullLayout = {
          type: 'line',
          data: {
            datasets: fullDatasets
          },
          options: {
            scales: {
              xAxes: [{
                type: 'realtime',
                realtime: {
                  onRefresh: onRefresh,
                  ttl: 60000
                }
              }],
              yAxes: [{
                scaleLabel: {
                  display: true,
                }
              }]
            }
          }
        };

        var canvas = <HTMLCanvasElement> document.getElementById('myChart');
        var ctx = canvas.getContext('2d');
        lineC = new Chart(canvas, fullLayout);
        return;
      };
      
      function onRefresh(chart, sData) {
        myChart = chart;
        let set = 0;
        chart.config.data.datasets.forEach(function(dataset) {
          if (sData != undefined){
          dataset.data.push({
            x: Date.now(),
            y: sData[set]
          });
          set += 1;
        }});
        myChart.update({preservation: true});
      }

      this.lineCanvas = lineC
    }
}