import { Component, ViewChild } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { Logger } from '../../providers/logger';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-tab1',
  templateUrl: 'controls.page.html',
  styleUrls: ['controls.page.scss']
})

export class ControlsPage{
  @ViewChild("lineCanvas") lineCanvas;
  public lineChart: CharacterData;
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
      this.lineChart = new Chart(this.lineCanvas.nativeElement, {
        type: "scatter",
        data: {
          datasets: [{
            label: "TKgain",
            data: [{x:0.2,y:20},{x:0.4,y:20},{x:0.7,y:25},{x:1,y:30},{x:1.7,y:30},{x:2.6,y:30},{x:4.1,y:30},{x:8.5,y:30}],
            borderColor: "blue",
            showLine: true,
            backgroundColor: "rgba(0, 0, 0, 0)",
            pointBackgroundColor: "blue"
          },
          {
            label: "TK",
            data: [{x:0.2,y:40},{x:0.4,y:40},{x:0.7,y:40},{x:1,y:40},{x:1.7,y:40},{x:2.6,y:40},{x:4.1,y:40},{x:8.5,y:40}],
            borderColor: "red",
            showLine: true,
            backgroundColor: "rgba(0, 0, 0, 0)",
            pointBackgroundColor: "red"
          },     
          {
            label: "BOLT",
            data: [{x:0.2,y:90},{x:0.4,y:90},{x:0.7,y:90},{x:1,y:90},{x:1.7,y:90},{x:2.6,y:90},{x:4.1,y:90},{x:8.5,y:90}],
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
              display: true,
              scaleLabel: {
                display: true,
                labelString: 'Frequency (kHz)'
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