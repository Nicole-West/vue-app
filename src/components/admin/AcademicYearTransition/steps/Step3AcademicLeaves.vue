<template>
    <div>
        <h3 class="text-lg font-semibold mb-4">Студенты в академическом отпуске</h3>

        <div v-if="loadingAcademicLeaves">Загрузка данных...</div>
        <div v-else-if="academicLeaveError" class="text-red-500 mb-4">{{ academicLeaveError }}</div>
        <div v-else>
            <div class="mb-6 overflow-x-auto">
                <table class="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th class="py-2 px-4 border-b">Студент</th>
                            <th class="py-2 px-4 border-b">Группа</th>
                            <th class="py-2 px-4 border-b">Курс</th>
                            <th class="py-2 px-4 border-b">Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="student in academicLeaveStudents" :key="student.student_id">
                            <td class="py-2 px-4 border-b">{{ student.full_name }}</td>
                            <td class="py-2 px-4 border-b">{{ student.group_number }}</td>
                            <td class="py-2 px-4 border-b">{{ student.course_name }}</td>
                            <td class="py-2 px-4 border-b">
                                <select v-model="student.action" class="border rounded px-2 py-1">
                                    <option value="continue">Продолжить обучение</option>
                                    <option value="extend">Продлить академ</option>
                                    <option value="expel">Отчислить</option>
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="flex space-x-3">
                <button class="btn_admin bg-blue-600" @click="saveAcademicLeaveDecisions">
                    Сохранить решения
                </button>
                <button class="btn_admin bg-gray-500" @click="$emit('prev-step')">
                    Назад
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        currentYearId: Number
    },
    data() {
        return {
            loadingAcademicLeaves: false,
            academicLeaveError: null,
            academicLeaveStudents: [],
            processing: false
        };
    },
    methods: {
        async loadAcademicLeaveStudents() {
            this.loadingAcademicLeaves = true;
            this.academicLeaveError = null;

            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `https://backend-8qud.onrender.com/api/academic-year/students/academic-leaves/${this.currentYearId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    this.academicLeaveStudents = response.data.data.map(student => ({
                        ...student,
                        action: 'continue'
                    }));
                } else {
                    this.academicLeaveError = response.data.message || 'Ошибка при загрузке данных';
                }
            } catch (err) {
                this.academicLeaveError = err.response?.data?.message || 'Не удалось загрузить данные';
                console.error('Ошибка:', err);
            } finally {
                this.loadingAcademicLeaves = false;
            }
        },
        async saveAcademicLeaveDecisions() {
            this.processing = true;

            try {
                const token = localStorage.getItem('token');
                const response = await axios.post(
                    'https://backend-8qud.onrender.com/api/academic-year/students/process-academic-leaves',
                    {
                        yearId: this.currentYearId,
                        decisions: this.academicLeaveStudents.map(s => ({
                            student_id: s.student_id,
                            action: s.action
                        }))
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    this.$emit('next-step');
                } else {
                    this.academicLeaveError = response.data.message || 'Ошибка при обработке';
                }
            } catch (err) {
                this.academicLeaveError = err.response?.data?.message || 'Ошибка при обработке';
                console.error('Ошибка:', err);
            } finally {
                this.processing = false;
            }
        }
    },
    async created() {
        await this.loadAcademicLeaveStudents();
    }
};
</script>