import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  currentTime = '';
  timerDisplay = '';
  interval: any;
  isRunning = false;
  timerDuration = 0;
  timeLeft = 0;
  isPaused = false;

  pomodoroMinutes = 25;
  breakMinutes = 5;
  pomodoroSeconds = 0;
  breakSeconds = 0;

  durationOptions = Array.from({ length: 60 }, (_, i) => i);
  breakOptions = Array.from({ length: 30 }, (_, i) => i);
  secondsOptions = Array.from({ length: 60 }, (_, i) => i);

  endCallback: Function | null = null;

  ngOnInit() {
    this.requestNotificationPermission();
    setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString();
    }, 1000);
  }

  // Request permission to show notifications
  async requestNotificationPermission() {
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
      }
    }
  }

  // Show a browser notification
  notify(message: string) {
    if (Notification.permission === 'granted') {
      const notification = new Notification('Pomodoro Timer', {
        body: message,
        icon: 'assets/icon/favicon.png', // Optional: Set a custom icon
      });

      // Play the sound manually
      const audio = new Audio('assets/sounds/beep.mp3');
      audio.play().catch(err => {
        console.error('Error playing sound:', err);
      });
    } else {
      console.warn('Notification permission not granted');
    }
  }

  // Start the Pomodoro timer
  startPomodoro() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.timerDuration = this.pomodoroMinutes * 60 + this.pomodoroSeconds;
    this.startTimer(this.timerDuration, () => {
      this.notify('Pomodoro Done! Time for a break.');

      // Delay break start by 5 seconds
      setTimeout(() => {
        this.startBreak();
      }, 5000);  // 5-second delay before starting the break
    });
  }

  // Start the break timer
  startBreak() {
    this.timerDuration = this.breakMinutes * 60 + this.breakSeconds;
    this.isPaused = false;
    this.startTimer(this.timerDuration, () => {
      this.notify('Break finished! Ready for another Pomodoro.');
      this.isRunning = false;
      this.timerDisplay = '';
      this.updateCircle(0);
    });
  }

  // Start the timer and handle progress
  startTimer(duration: number, callback: Function) {
    this.timeLeft = duration;
    this.endCallback = callback;
    this.updateDisplay(this.timeLeft);
    this.updateCircle(0);

    clearInterval(this.interval);
    this.interval = setInterval(() => {
      if (this.isPaused) return;

      this.timeLeft--;
      this.updateDisplay(this.timeLeft);
      const progress = (duration - this.timeLeft) / duration;
      this.updateCircle(progress);

      if (this.timeLeft <= 0) {
        clearInterval(this.interval);
        callback();
      }
    }, 1000);
  }

  // Update the displayed time
  updateDisplay(seconds: number) {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    this.timerDisplay = `${min}:${sec}`;
  }

  // Update the progress circle (UI)
  updateCircle(progress: number) {
    const circle = document.querySelector('.progress-ring__circle') as SVGCircleElement;
    if (!circle) return;

    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference}`;
    const offset = circumference - progress * circumference;
    circle.style.strokeDashoffset = offset.toString();
  }

  // Toggle pause/resume on the timer
  togglePause() {
    if (!this.isRunning) return;

    if (this.isPaused) {
      this.isPaused = false;
      this.startTimer(this.timeLeft, this.endCallback!);
    } else {
      this.isPaused = true;
      clearInterval(this.interval);
    }
  }

  // Reset the timer
  resetTimer() {
    clearInterval(this.interval);
    this.timerDisplay = '';
    this.timeLeft = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.updateCircle(0);
  }
}
