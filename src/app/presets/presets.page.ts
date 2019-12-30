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

    public async makeChart(layout) {
      
    }


    public makeSerialPlot() {
      let lenDataset = undefined;
      let fullDatasets = []
      let myChart = undefined;
      let xValue = 0;
      let layout3 = {};
      let layout2 = {
        type: 'line',
        data: {
          datasets: []
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

      var chartColors = [
        'rgb(255, 99, 132)',    //red
        'rgb(255, 159, 64)',    //orange
        'rgb(255, 205, 86)',    //yellow
        'rgb(75, 192, 192)',    //green
        'rgb(54, 162, 235)',    //blue
        'rgb(153, 102, 255)',   //purple
        'rgb(201, 203, 207)'    //grey
      ];

      if (this.remote.bluetooth && this.remote.btSerial) {
        this.logger.log('subscribingx');
        this.remote.btSerial.subscribe('\n').subscribe((data)=>{parsePlotterStringFromDevice(data, myChart);});
      }

      function parsePlotterStringFromDevice(data: string, myChart) {
        console.log('data',data);
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
          addDatasets(lenDataset);
        }
      }
      
      function addDatasets(data) {
        let newDataset = {}
        for (let dset=0; dset<data; dset++) {
          newDataset = {
            label: 'Dataset ' + (dset + 1),
            backgroundColor: "rgba(0, 0, 0, 0)",
            borderColor: chartColors[dset],
            fill: false,
            lineTension: 0,
            data: []
          };
          fullDatasets.push(newDataset);
        }
        layout2.data.datasets = fullDatasets;
        layout3 = layout2;
        return;
      };
      
      function onRefresh(chart, sData) {
        myChart = chart;
        let set = 0;
        chart.config.data.datasets.forEach(function(dataset) {
          if (sData != undefined){
          console.log('serial', sData)
          dataset.data.push({
            x: Date.now(),
            y: sData[set]
          });
          set += 1;
        }});
        xValue += 1;
        myChart.update({preservation: true});
      }

      var fullLayout = {
        type: 'line',
        data: {
          datasets: [{
            label: 'Dataset 1',
            backgroundColor: "rgba(0, 0, 0, 0)",
            borderColor: chartColors[0],
            fill: false,
            lineTension: 0,
            data: []
          },{
            label: 'Dataset 2',
            backgroundColor: "rgba(0, 0, 0, 0)",
            borderColor: chartColors[1],
            fill: false,
            lineTension: 0,
            data: []
          },{
            label: 'Dataset 3',
            backgroundColor: "rgba(0, 0, 0, 0)",
            borderColor: chartColors[2],
            fill: false,
            lineTension: 0,
            data: []
          }]
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

      function updateLabels(name, value) {
        fullLayout.data.datasets[name].label = value;
      }

      var canvas = <HTMLCanvasElement> document.getElementById('myChart');
      var ctx = canvas.getContext('2d');
      // console.log('right before', layout3)
      // if ('data' in layout3){
      // console.log('in here')
      this.lineCanvas = new Chart(canvas, fullLayout);
      // }
    }
}