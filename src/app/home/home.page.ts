import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';

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
    this.initNotifications();
    setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString();
    }, 1000);
  }

  async initNotifications() {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    console.log('Notification permission granted');

    try {
      await LocalNotifications.createChannel({
        id: 'pomodoro-channel',
        name: 'Pomodoro Notifications',
        description: 'Pomodoro Alerts',
        importance: 5,
        sound: 'beep.mp3',
        visibility: 1,
      });
    } catch (err) {
      console.warn('Channel may already exist:', err);
    }

    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
    });
  }

  notify(message: string) {
    const notification: LocalNotificationSchema = {
      title: 'Pomodoro Timer',
      body: message,
      id: Date.now(),
      schedule: {
        at: new Date(Date.now() + 1000),
      },
      sound: 'beep.mp3',
      channelId: 'pomodoro-channel',
    };

    LocalNotifications.schedule({
      notifications: [notification]
    }).then(() => {
      console.log('Notification scheduled:', message);
    }).catch(err => {
      console.error('Notification failed:', err);
    });
  }

  startPomodoro() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.timerDuration = this.pomodoroMinutes * 60 + this.pomodoroSeconds;
    this.startTimer(this.timerDuration, () => {
      this.notify('Pomodoro Done! Time for a break.');

      setTimeout(() => {
        this.startBreak();
      }, 5000);
    });
  }

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

  updateDisplay(seconds: number) {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    this.timerDisplay = `${min}:${sec}`;
  }

  updateCircle(progress: number) {
    const circle = document.querySelector('.progress-ring__circle') as SVGCircleElement;
    if (!circle) return;

    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference}`;
    const offset = circumference - progress * circumference;
    circle.style.strokeDashoffset = offset.toString();
  }

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

  resetTimer() {
    clearInterval(this.interval);
    this.timerDisplay = '';
    this.timeLeft = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.updateCircle(0);
  }
}
