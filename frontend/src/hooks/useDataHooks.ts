import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useUnits = () => {
    return useQuery({
        queryKey: ['units'],
        queryFn: async () => {
            const { data } = await api.get('units/');
            return data;
        },
    });
};

export const useCourses = () => {
    return useQuery({
        queryKey: ['courses'],
        queryFn: async () => {
            const { data } = await api.get('courses/');
            return data;
        },
    });
};

export const useIntakes = () => {
    return useQuery({
        queryKey: ['intakes'],
        queryFn: async () => {
            const { data } = await api.get('intakes/');
            return data;
        },
    });
};

export const useSemesters = () => {
    return useQuery({
        queryKey: ['semesters'],
        queryFn: async () => {
            const { data } = await api.get('semesters/');
            return data;
        },
    });
};

export const useCourseGroups = () => {
    return useQuery({
        queryKey: ['courseGroups'],
        queryFn: async () => {
            const { data } = await api.get('course-groups/');
            return data;
        },
    });
};

export const useLessons = () => {
    return useQuery({
        queryKey: ['lessons'],
        queryFn: async () => {
            const { data } = await api.get('lessons/');
            return data;
        },
    });
};

export const useAssessments = () => {
    return useQuery({
        queryKey: ['assessments'],
        queryFn: async () => {
            const { data } = await api.get('assessments/');
            return data;
        },
    });
};

export const useTrainers = () => {
    return useQuery({
        queryKey: ['trainers'],
        queryFn: async () => {
            const { data } = await api.get('users/');
            return data.filter((u: any) => u.role === 'Trainer');
        },
    });
};
