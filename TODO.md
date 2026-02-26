# Student Dashboard Enhancement Tasks

## Completed
- [x] Analyzed current codebase structure

## In Progress
- [ ] Fix StudentDashboard Layout - Ensure lesson content, resources, and assessments display in separate, non-overlapping containers
- [ ] Add "Contact Trainer" tab in StudentDashboard for student-to-trainer messaging
- [ ] Enhance notification system to allow students to send messages to trainers

## Task Details

### 1. Layout Fix (StudentDashboard.tsx)
- Ensure lesson content (notes) doesn't overlap with resources or assessment cards
- Use proper grid/flex layout with clear separation between content sections

### 2. Contact Trainer Feature (StudentDashboard.tsx)
- Add new tab for student-to-trainer communication
- Show list of trainers for student's enrolled units
- Allow sending messages/notifications to trainers
- Show message history

### 3. Notification System Enhancement (SendNotification.tsx / Backend)
- Update role permissions to allow students to send to trainers
- Add "Trainer" to the available roles for student users
- Ensure notifications are properly routed to trainers

## Files to Modify
1. frontend/src/dashboards/StudentDashboard.tsx
2. frontend/src/components/SendNotification.tsx  
3. backend/api/views.py (if needed for permission changes)
