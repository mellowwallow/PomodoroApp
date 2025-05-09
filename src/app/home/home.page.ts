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

  // Initialize local notifications and create the notification channel
  async initNotifications() {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') {
      console.warn('Notification permission not granted');
    } else {
      console.log('Notification permission granted');
    }

    // Create notification channel with unique channelId
    await LocalNotifications.createChannel({
      id: 'pomodoro-channel',
      name: 'Pomodoro Notifications',
      description: 'Channel for Pomodoro alerts with sound',
      sound: 'beep.mp3', // Custom sound for notifications
      importance: 5, // High importance
      vibration: true,
      visibility: 1,
    });

    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
    });
  }

  // Send a notification
  notify(message: string) {
    const notif: LocalNotificationSchema = {
      title: 'Pomodoro Timer',
      body: message,
      id: Date.now(),
      sound: 'beep.mp3', // Sound file for notification
      channelId: 'pomodoro-channel', // Reference to the created notification channel
    };

    // Schedule notification
    LocalNotifications.schedule({ notifications: [notif] }).then(() => {
      console.log('Notification scheduled:', message);
    }).catch((err) => {
      console.error('Notification failed:', err);
    });
  }

  // Start the Pomodoro timer
  startPomodoro() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.timerDuration = this.pomodoroMinutes * 60 + this.pomodoroSeconds;
    console.log('Pomodoro started with duration:', this.timerDuration);
    this.startTimer(this.timerDuration, () => {
      this.notify('Pomodoro Done! Time for a break.');
      this.startBreak();
    });
  }

  // Start the break timer
  startBreak() {
    console.log('Starting break with duration:', this.breakMinutes * 60 + this.breakSeconds);
    this.timerDuration = this.breakMinutes * 60 + this.breakSeconds;
    this.isPaused = false;
    this.startTimer(this.timerDuration, () => {
      this.notify('Break finished! Ready for another Pomodoro.');
      this.isRunning = false;
      this.timerDisplay = '';
      this.updateCircle(0);
    });
  }

  // Start the countdown timer and update the UI
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

  // Update the displayed timer text (MM:SS format)
  updateDisplay(seconds: number) {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    this.timerDisplay = `${min}:${sec}`;
  }

  // Update the circular progress UI element based on the timer progress
  updateCircle(progress: number) {
    const circle = document.querySelector('.progress-ring__circle') as SVGCircleElement;
    if (!circle) return;

    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference}`;
    const offset = circumference - progress * circumference;
    circle.style.strokeDashoffset = offset.toString();
  }

  // Toggle the pause/resume state of the timer
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

  // Reset the timer to initial state
  resetTimer() {
    clearInterval(this.interval);
    this.timerDisplay = '';
    this.timeLeft = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.updateCircle(0);
  }
}
