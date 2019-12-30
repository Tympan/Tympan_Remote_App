import { Component, ViewChild } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { Logger } from '../../providers/logger';
import { Chart } from 'chart.js';
import { tick } from '@angular/core/testing';

@Component({
  selector: 'app-tab1',
  templateUrl: 'prescription.page.html',
  styleUrls: ['prescription.page.scss']
})

export class PrescriptionPage{
    @ViewChild("lineCanvas") lineCanvas;
    public lineChart: Chart; //CharacterData;
    
    constructor(public remote: TympanRemote, public logger:Logger) {
    };

    cmd(s: string) {
        this.remote.send(s);
    };

    sendInputCard(card: any) {
    	this.remote.sendInputCard(card);
    }

    moveLeft(input: any) {
    	if (input.currentCol>0) {
	    	input.currentCol--;
    	}
    }

    moveRight(input: any) {
    	if (input.currentCol<input.columns.length-1) {
	    	input.currentCol++;
    	}
    }

    public makeLineChart() {
      var graphData = this.remote.formatData();
      this.lineChart = new Chart(this.lineCanvas.nativeElement, {
        type: "scatter",
        data: {
          datasets: [{
            label: "TKgain",
            data: graphData[0],
            borderColor: "blue",
            showLine: true,
            backgroundColor: "rgba(0, 0, 0, 0)",
            pointBackgroundColor: "blue"
          },
          {
            label: "TK",
            data: graphData[1],
            borderColor: "red",
            showLine: true,
            backgroundColor: "rgba(0, 0, 0, 0)",
            pointBackgroundColor: "red"
          },     
          {
            label: "BOLT",
            data: graphData[2],
            borderColor: "green",
            showLine: true,
            backgroundColor: "rgba(0, 0, 0, 0)",
            pointBackgroundColor: "green"
          },
        ],
        },
        options: {
          scales: {
            xAxes: [{
              type: 'logarithmic',
              ticks: {
                min: 0,
                max: 20000,
                callback: function (value) {
                    if(value==10 || value==50 ||value==100 || value==500 ||value==1000 || value==5000 ||value==10000){
                        // return value;
                    return Number(value.toString());
                    }
                  }
            },
              display: true,
              scaleLabel: {
                display: true,
                labelString: 'Frequency (Hz)'
              }
            }],
            yAxes: [{
              display: true,
              scaleLabel: {
                display: true,
                labelString: 'Output Level (dB SPL)'
              }
            }]
          },
        }
      });
    }

  }