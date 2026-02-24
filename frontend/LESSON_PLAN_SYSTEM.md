# Lesson Plan System - Implementation Summary

## Backend (Already Complete ✅)

The following is already implemented in `backend/core/models.py`:

### Lesson Model Fields:
```
python
# Lesson Plan Information
week = models.PositiveIntegerField(null=True, blank=True)  # Week number
session_date = models.DateField(null=True, blank=True)     # Date of lesson
session_start = models.TimeField(null=True, blank=True)     # Start time
session_end = models.TimeField(null=True, blank=True)       # End time
session = models.CharField(max_length=50, blank=True)       # Session name
topic = models.CharField(max_length=255, blank=True)        # Main topic
subtopic = models.CharField(max_length=255, blank=True)     # Sub-topic
learning_outcomes = models.TextField(blank=True)            # "By the end..."

# Quality Assurance
is_approved = models.BooleanField(default=False)  # HOD approval
is_active = models.BooleanField(default=False)    # Active for students
audit_feedback = models.TextField(blank=True)     # HOD feedback
```

### LessonPlanActivity Model:
```
python
time = models.CharField(max_length=50)        # Time slot (9:00-9:30)
activity = models.TextField()                 # Learning activity
content = models.TextField(blank=True)        # Content covered
resources = models.TextField(blank=True)      # Resources needed
references = models.TextField(blank=True)      # References
```

### Serializers (Updated ✅)
- Added `LessonPlanActivitySerializer`
- Added `plan_activities` to `LessonSerializer`

## Frontend - What Needs to be Built

### 1. Trainer Dashboard - Lesson Plan Form
**New component: `LessonPlanForm.tsx`**

Fields to include:
- **Session Info**: Date, Week, Session (Morning/Afternoon)
- **Unit Info**: Unit Code (auto), Unit Name (auto), Group
- **Lesson Info**: Lesson No. (auto), Trainer Name (auto)
- **Topic**: Topic, Sub-topic
- **Learning Outcomes**: Text area (auto-generated template)
- **Lesson Plan Table**:
  | Time | Learning Activity | Content | Resources/Activities | References |
  |------|------------------|---------|---------------------|------------|
  | 9:00-9:30 | ... | ... | ... | ... |

**Actions**: Save as Draft, Submit for Approval

### 2. HOD Dashboard - Quality Assurance View
**New section: Lesson Plan Review**

- View all submitted lesson plans
- Approve/Reject with feedback
- Filter by: Pending, Approved, Rejected
- View lesson plan details

### 3. Student Dashboard - Active Lessons Only
**Update: Filter lessons where:**
```
typescript
// Only show lessons that are:
lesson.is_approved === true && 
lesson.is_active === true && 
new Date(lesson.session_date + ' ' + lesson.session_start) <= new Date()
```

---

## API Endpoints (Already Available)
- `GET /api/lessons/` - List all lessons
- `POST /api/lessons/` - Create lesson with plan
- `PATCH /api/lessons/{id}/` - Update lesson
- `GET /api/units/{id}/` - Get unit with lessons

## Implementation Priority
1. **Phase 1**: Update Student Dashboard to filter active lessons (HOD approved + time reached)
2. **Phase 2**: Add Lesson Plan form to Trainer Dashboard
3. **Phase 3**: Add Quality Assurance view to HOD Dashboard
