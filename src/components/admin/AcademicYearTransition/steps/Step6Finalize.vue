<template>
    <div>
        <h3 class="text-lg font-semibold mb-4">Завершение перехода на {{ nextYear }} год</h3>

        <div class="processing-section" v-if="!showTeacherAssignment">
            <p>Выполняются финальные приготовления...</p>
            <div v-if="processingStep6" class="spinner"></div>
        </div>

        <div v-else-if="showTeacherAssignment" class="teacher-assignment">
            <h4 class="text-lg font-semibold mb-4">Назначение преподавателей на предметы</h4>

            <div class="overflow-x-auto bg-white rounded-lg shadow">
                <table class="min-w-full">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-4 py-2 text-left">Группа</th>
                            <th class="px-4 py-2 text-left">Предмет</th>
                            <th class="px-4 py-2 text-left">Преподаватель</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="groupSubject in groupSubjects" :key="groupSubject.group_subject_id"
                            class="border-t hover:bg-gray-50">
                            <td class="px-4 py-2">
                                {{ groupSubject.group_number }}
                            </td>
                            <td class="px-4 py-2">
                                {{ groupSubject.subject_name }}
                            </td>
                            <td class="px-4 py-2">
                                <select v-model="teacherAssignments[groupSubject.group_subject_id]"
                                    class="border rounded px-3 py-1 w-full">
                                    <option value="">-- Не назначен --</option>
                                    <option v-for="teacher in teachers" :value="teacher.teacher_id"
                                        :key="teacher.teacher_id">
                                        {{ teacher.full_name }}
                                    </option>
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="final-actions mt-6">
                <button @click="submitTeacherAssignments" :disabled="!allTeachersAssigned || processingStep6"
                    class="btn-complete">
                    <span v-if="processingStep6">
                        Завершение перехода...
                    </span>
                    <span v-else>Завершить переход на {{ nextYear }} год</span>
                </button>
                <button @click="$emit('prev-step')" class="btn-secondary ml-4">
                    Назад
                </button>

                <div v-if="error" class="error-message mt-4">{{ error }}</div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        currentYearId: Number,
        nextYear: String
    },
    data() {
        return {
            showTeacherAssignment: false,
            teachers: [],
            groupSubjects: [],
            teacherAssignments: {},
            processingStep6: true,
            error: null
        };
    },
    computed: {
        allTeachersAssigned() {
            return Object.values(this.teacherAssignments).every(id => id);
        }
    },
    methods: {
        async finalizeTransition() {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.post(
                    'https://backend-8qud.onrender.com/api/academic-year/complete-transition',
                    {
                        currentYearId: this.currentYearId,
                        nextYear: this.nextYear
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    this.teachers = response.data.data.teachers;
                    this.groupSubjects = response.data.data.groupSubjects;

                    // Инициализируем teacherAssignments
                    this.groupSubjects.forEach(gs => {
                        this.teacherAssignments[gs.group_subject_id] = '';
                    });

                    this.showTeacherAssignment = true;
                }
            } catch (err) {
                this.error = err.response?.data?.message || 'Ошибка при завершении перехода';
                console.error('Ошибка:', err);
            } finally {
                this.processingStep6 = false;
            }
        },
        async loadGroupSubjects() {
            try {
                const response = await axios.get(
                    'https://backend-8qud.onrender.com/api/academic-year/group-subjects/active',
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                );
                this.groupSubjects = response.data.data;
            } catch (err) {
                console.error('Ошибка при загрузке предметов:', err);
            }
        },
        async submitTeacherAssignments() {
            this.processingStep6 = true;

            try {
                const token = localStorage.getItem('token');
                const assignments = Object.entries(this.teacherAssignments)
                    .map(([group_subject_id, teacher_id]) => ({
                        group_subject_id: parseInt(group_subject_id),
                        teacher_id
                    }));

                // 1. Назначаем преподавателей
                await axios.post(
                    'https://backend-8qud.onrender.com/api/academic-year/assign',
                    { assignments },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // 2. Инициализируем оценки
                await axios.post(
                    'https://backend-8qud.onrender.com/api/academic-year/grades/initialize',
                    { yearId: this.currentYearId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // 3. Завершаем переход
                this.$emit('complete');
            } catch (err) {
                this.error = err.response?.data?.message || 'Ошибка при сохранении назначений';
                console.error('Ошибка:', err);
            } finally {
                this.processingStep6 = false;
            }
        }
    },
    async created() {
        await this.finalizeTransition();
    }
};
</script>

<style scoped>
.processing-section {
    text-align: center;
    padding: 2rem;
}

.spinner {
    display: inline-block;
    width: 2rem;
    height: 2rem;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: #3b82f6;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.teacher-assignment {
    max-width: 1200px;
    margin: 0 auto;
}

.btn-complete {
    background-color: #10b981;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    font-weight: 500;
}

.btn-complete:hover {
    background-color: #059669;
}

.btn-complete:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
}

.btn-secondary {
    background-color: #6b7280;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    font-weight: 500;
}

.btn-secondary:hover {
    background-color: #4b5563;
}

.error-message {
    color: #ef4444;
    padding: 0.75rem;
    background-color: #fee2e2;
    border-radius: 0.375rem;
}

select {
    background-color: white;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
}

select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
}
</style>