# Student Dashboard Enhancement Tasks
# Student Dashboard Enhancement Tasks

## Completed
- [x] Analyzed current codebase structure
- [x] Fix media file download and viewing for students (urls.py)

## Investigation Notes:

### Issue: Students cannot see unit notes/content and resources

**Root Cause Analysis:**
The system has an approval workflow that requires TWO conditions for students to see content:

1. **For Lessons/Content:**
   - Trainer must create lesson AND mark it as "taught" (is_taught=True)
   - HOD must approve the lesson (is_approved=True)

2. **For Resources:**
   - Trainer must upload resource
   - HOD must approve the resource (is_approved=True)

**This is the expected behavior** - content goes through:
Trainer creates → Trainer marks as taught → HOD reviews and approves → Students can see

**Possible reasons why content not visible:**
1. Trainer hasn't marked lessons as "taught" (is_taught=False)
2. HOD hasn't approved the lessons/resources (is_approved=False)
3. No resources have been uploaded yet by trainer
4. Student is not enrolled in the unit

## Pending Tasks
- [ ] Fix StudentDashboard Layout - Ensure lesson content, resources, and assessments display in separate, non-overlapping containers
- [ ] Add "Contact Trainer" tab in StudentDashboard for student-to-trainer messaging
- [ ] Enhance notification system to allow students to send messages to trainers
