import { Injectable, NgZone } from '@angular/core';
import 'chartjs-plugin-streaming';
import { Chart } from 'chart.js';

/**
 * This class contains the variables and methods for the logger.
 */
@Injectable({
  providedIn: 'root'
})
export class Plotter {
    public lineC = undefined
    public lenDataset = undefined;
    public fullDatasets = []
    public chartData = [];
    public myChart = undefined;
    public chartColors = [
      'rgb(255, 99, 132)',    //red
      'rgb(255, 159, 64)',    //orange
      'rgb(255, 205, 86)',    //yellow
      'rgb(75, 192, 192)',    //green
      'rgb(54, 162, 235)',    //blue
      'rgb(153, 102, 255)',   //purple
      'rgb(201, 203, 207)',   //grey
      'rgb(0, 0, 0)'          //black
    ];

  constructor(private zone: NgZone) {
  }


/*
      if (this.remote.bluetooth && this.remote.btSerial) {
        this.logger.log('subscribingx');
        this.remote.btSerial.subscribe('\n').subscribe((data)=>{
          if (this.remote.showSerialPlotter == false) {
            this.exportChart(chartData);
          }
          parsePlotterStringFromDevice(data, myChart);
        });
      }
*/

  public parsePlotterStringFromDevice(data: string) {
    if (data[0] == 'P'){
      let serialData = data.split(',');
      serialData[0] = serialData[0].slice(1);
      let serialPlotData = [];
      for (var n in serialData) {
        serialPlotData[n] = parseFloat(serialData[n]);
      }
      this.chartData.push(serialPlotData);
      console.log('SD:');
      console.log(this);
      if (this.myChart != undefined){
        console.log('refreshing chart');
        this.onRefresh(undefined,serialPlotData);
      }
      if (this.lenDataset == undefined) {
        this.lenDataset = serialPlotData.length;
        if (typeof serialPlotData[0] == 'string'){
          let labels = serialPlotData;
          this.addDatasets(this.lenDataset, labels);
        } else {
          this.addDatasets(this.lenDataset);
        }
      }
    }
  }
      
  private addDatasets(data, labels = undefined) {
    for (let dset=0; dset<data; dset++) {
      let dataName = undefined;
      if (labels != undefined){
        dataName = labels[dset]
      } else {
        dataName = 'Dataset ' + (dset + 1)
      }
      let newDataset = {
        label: dataName,
        backgroundColor: "rgba(0, 0, 0, 0)",
        borderColor: this.chartColors[dset],
        fill: false,
        lineTension: 0,
        data: []
      };
      this.fullDatasets.push(newDataset);
    }

    let p = this;
    console.log('Adding data sets:');
    console.log(p);

    var fullLayout = {
      type: 'line',
      data: {
        datasets: p.fullDatasets
      },
      options: {
        scales: {
          xAxes: [{
            type: 'realtime',
            realtime: {
              onRefresh: (c)=>{p.onRefresh(c,undefined);},
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
    this.lineC = new Chart(canvas, fullLayout);
  };
      
  private onRefresh(chart, sData) {
    if (chart != undefined) {
      this.myChart = chart;
    }
    if (this.myChart != undefined) {
    let set = 0;
    this.myChart.config.data.datasets.forEach(function(dataset) {
      if (sData != undefined){
      dataset.data.push({
        x: Date.now(),
        y: sData[set]
      });
      set += 1;
    }});
    this.myChart.update({preservation: true});
  }
  }

}


