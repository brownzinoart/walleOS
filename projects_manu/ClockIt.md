# ClockIt

**Case Study**

A Trader Joe's time management compliance app ensuring employees acknowledge clocking in and adhere to schedules via notifications and digital logging.

## Project Details

**Role:** Product Developer, Retail Operations Specialist  
**Focus:** Time management compliance, digital logging, schedule adherence  
**Built With:** React Native, Node.js, PostgreSQL, Push Notifications API  

## The Challenge

### Why I Built ClockIt

Time management is crucial for Trader Joe's captains from a people operations perspective. I created ClockIt in collaboration with colleagues to address a specific pattern: employees from corporate backgrounds often forget to clock in, leading to missed raises and requiring form submissions. The app ensures users acknowledge clocking in and adhere to their daily schedule via notifications and digital logging, replacing paper, hand, or receipt tracking.

#### Clock-In Gatekeeper
Users must confirm clocking in to access any app features. This forcing function eliminates the 'I forgot' excuse by making clock-in acknowledgment the first action of every shift.

#### Schedule Adherence
Push notifications remind users of their daily schedule and upcoming tasks. At Trader Joe's, employees rotate tasks hourly—the app inputs times to remind users of their next moves in the store.

#### Digital Logging
Replaces paper, hand, or receipt tracking with digital time logs. Employees can review their weekly hours, verify accuracy, and catch errors before they become payroll problems.

## Step 1

### Clock-in confirmation gatekeeper

When employees open ClockIt, they're immediately prompted: "Have you clocked in today?" Until they confirm, the app remains locked. This gatekeeper approach ensures clocking in becomes the first action of every shift. If an employee taps "No, I forgot," the app displays instructions to clock in at the physical time clock, then locks again until they return and confirm. Once confirmed, a green checkmark animation plays and the app unlocks full functionality.

#### Image Placeholder
Clock-in confirmation screen

## Step 2

### Daily schedule and task rotations

Once past the gatekeeper, employees see their daily schedule broken into hourly blocks. Each block shows the task assignment, location in the store, and duration. The current task is highlighted with a countdown timer, while upcoming tasks appear below. Ten minutes before each rotation, employees receive a push notification with the next assignment, like "In 10 minutes: Move to Register 3" or "Next task: Restock Aisle 7."

#### Image Placeholder
Daily schedule notification overview

## Core Features

### Digital logging and task management

#### Image Placeholder 1
Digital Log Input Form

#### Image Placeholder 2
Hourly Task Reminder

#### Image Placeholder 3
Weekly Hours Review

Left to right: Digital time logging interface replacing paper tracking, hourly task rotation reminders with countdown timers, and weekly hours review for accuracy verification.

## Beta Testing

### Results from 10 employees who frequently miss clock-ins

ClockIt is currently in testing with 10 Trader Joe's employees who frequently miss clock-ins or clock-outs. Over 8 weeks, missed clock-ins dropped from an average of 3-4 per week to 0-1 per week, representing a 75% reduction. The gatekeeper feature proved most effective—100% of testers confirmed it was the primary reason for improved compliance. Captains spent 60% less time processing time correction forms, and employees reported feeling more confident about their hours and pay accuracy.

#### Image Placeholder
Beta testing feedback dashboard

## Impact

### Improving compliance and reducing missed raises

ClockIt demonstrates my ability to identify operational problems in retail environments and design practical solutions that meet users where they are. The app's success in beta testing—75% reduction in missed clock-ins and 60% reduction in captain administrative burden—validates the approach of using simple, effective technology for hourly retail workers. The gatekeeper feature, schedule notifications, and digital logging work together to ensure employees never miss a clock-in, protecting their compensation and reducing operational friction for captains.

#### Phase 1 Rollout
Extend the pilot to 50 employees across three stores, monitor compliance lift week over week, and refine onboarding flows so captains can launch the app during pre-shift standups without additional training.

#### Captain Dashboard
Ship an oversight dashboard in phase two that surfaces missed acknowledgements, highlights task bottlenecks, and provides printable logs to streamline payroll reconciliation and coaching conversations.

#### Crew Enablement
Pair the in-app reminders with lightweight job aids and push campaigns focused on new hires, reinforcing clock-in habits and closing the loop with post-shift summaries that confirm hours captured accurately.