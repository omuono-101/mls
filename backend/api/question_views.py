from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import Question, QuestionOption, Answer, StudentAnswer
from .serializers import QuestionSerializer, QuestionOptionSerializer, AnswerSerializer, StudentAnswerSerializer
from .permissions import IsTrainer

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    
    def get_queryset(self):
        queryset = Question.objects.all()
        assessment_id = self.request.query_params.get('assessment', None)
        if assessment_id is not None:
            queryset = queryset.filter(assessment_id=assessment_id)
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsTrainer()]

class QuestionOptionViewSet(viewsets.ModelViewSet):
    queryset = QuestionOption.objects.all()
    serializer_class = QuestionOptionSerializer
    
    def get_queryset(self):
        queryset = QuestionOption.objects.all()
        question_id = self.request.query_params.get('question', None)
        if question_id is not None:
            queryset = queryset.filter(question_id=question_id)
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsTrainer()]

class AnswerViewSet(viewsets.ModelViewSet):
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer
    
    def get_queryset(self):
        queryset = Answer.objects.all()
        question_id = self.request.query_params.get('question', None)
        if question_id is not None:
            queryset = queryset.filter(question_id=question_id)
        return queryset
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsTrainer()]

class StudentAnswerViewSet(viewsets.ModelViewSet):
    queryset = StudentAnswer.objects.all()
    serializer_class = StudentAnswerSerializer
    
    def get_queryset(self):
        queryset = StudentAnswer.objects.all()
        submission_id = self.request.query_params.get('submission', None)
        if submission_id is not None:
            queryset = queryset.filter(submission_id=submission_id)
        return queryset
    
    def get_permissions(self):
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['post'])
    def submit_answers(self, request):
        """Bulk create student answers and auto-grade MCQ/TF"""
        submission_id = request.data.get('submission_id')
        answers = request.data.get('answers', [])
        
        created_answers = []
        auto_grade_score = 0
        
        for answer_data in answers:
            question_id = answer_data.get('question_id')
            question = Question.objects.get(id=question_id)
            
            student_answer = StudentAnswer.objects.create(
                submission_id=submission_id,
                question_id=question_id,
                selected_option_id=answer_data.get('selected_option_id'),
                answer_text=answer_data.get('answer_text', '')
            )
            
            # Auto-grade MCQ and TF
            if question.question_type == 'MCQ' and student_answer.selected_option:
                student_answer.is_correct = student_answer.selected_option.is_correct
                if student_answer.is_correct:
                    student_answer.points_earned = question.points
                    auto_grade_score += question.points
                else:
                    student_answer.points_earned = 0
                student_answer.save()
            
            elif question.question_type == 'TF':
                correct_answer = Answer.objects.filter(question=question).first()
                if correct_answer:
                    is_true = student_answer.answer_text.lower() == 'true'
                    student_answer.is_correct = (is_true == correct_answer.is_correct_for_tf)
                    if student_answer.is_correct:
                        student_answer.points_earned = question.points
                        auto_grade_score += question.points
                    else:
                        student_answer.points_earned = 0
                    student_answer.save()
            
            created_answers.append(student_answer)
        
        # Update submission with auto-graded score
        from core.models import Submission
        submission = Submission.objects.get(id=submission_id)
        submission.auto_graded_score = auto_grade_score
        submission.save()
        
        serializer = self.get_serializer(created_answers, many=True)
        return Response({
            'answers': serializer.data,
            'auto_graded_score': auto_grade_score
        })
