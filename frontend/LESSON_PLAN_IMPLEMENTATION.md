# Lesson Plan System Implementation Plan

## Backend (Already Implemented)
The following fields already exist in the `Lesson` model in `backend/core/models.py`:

### Lesson Model Fields:
- `week` - Week number
- `session_date` - Date of the lesson session
- `session_start` - Start time of the lesson
- `session_end` - End time of the lesson
- `session` - Session name (Morning, Afternoon)
- `topic` - Main topic of the lesson
- `subtopic` - Sub-topic of the lesson
- `learning_outcomes` - "By the end of this lesson, students should be able to..."
- `is_active` - Lesson is active and visible to students
- `is_approved` - Approved by HOD
- `is_taught` - Marked as taught by trainer
- `audit_feedback` - Feedback from HOD quality assurance

### LessonPlanActivity Model:
- `time` - Time slot (e.g., 9:00-9:30)
- `activity` - Learning activity description
- `content` - Specific content covered
- `resources` - Resources/activities needed
- `references` - References/materials

### Serializer Updates:
- Added `LessonPlanActivitySerializer` 
- Added `plan_activities` to `LessonSerializer`

## Frontend - Trainer Dashboard Updates Needed:
1. Create Lesson Plan Form with fields:
   - Date, Week, Unit Code, Session, Lesson No.
   - Unit Name, Trainer Name, Group
   - Topic and Sub-topic
   - Learning Outcomes (auto-generated text)
   - Lesson Plan Activities Table (Time, Activity, Content, Resources, References)
   
2. Submit for HOD Approval

## Frontend - HOD Dashboard Updates Needed:
1. Quality Assurance View - View all submitted lesson plans
2. Approve/Reject functionality
3. Add feedback comments

## Frontend - Student Dashboard Updates Needed:
1. Filter lessons that are:
   - Approved by HOD (`is_approved=True`)
   - Time has reached (`session_start` time has passed)
2. Show active lessons only
3. Display lesson plan details when viewing a lesson
