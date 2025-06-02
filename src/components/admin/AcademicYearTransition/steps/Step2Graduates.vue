<template>
    <div>
        <h3 class="text-lg font-semibold mb-4">Подтверждение выпускников</h3>

        <div v-if="loadingGraduates">Загрузка списка выпускников...</div>
        <div v-else-if="graduateError" class="text-red-500 mb-4">{{ graduateError }}</div>
        <div v-else>
            <div class="mb-6" v-for="group in graduatingGroups" :key="group.group_id">
                <h4 class="font-medium mb-2">Группа {{ group.group_number }} ({{ group.course_name }})</h4>

                <div class="bg-gray-50 p-3 rounded">
                    <div v-for="student in group.students" :key="student.student_id" class="flex items-center mb-2">
                        <input type="checkbox" :id="'student_' + student.student_id" v-model="student.repeatGraduation"
                            class="mr-2">
                        <label :for="'student_' + student.student_id">
                            {{ student.full_name }}
                            <span v-if="student.repeatGraduation" class="text-red-600 ml-2">(Повторная защита)</span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="flex space-x-3">
                <button class="btn_admin bg-blue-600" @click="confirmGraduates">
                    Подтвердить выпуск
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
        currentYearId: Number,
        nextYear: String
    },
    data() {
        return {
            loadingGraduates: false,
            graduateError: null,
            graduatingGroups: [],
            processingTransition: false
        };
    },
    methods: {
        async loadGraduatingStudents() {
            this.loadingGraduates = true;
            this.graduateError = null;

            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `https://backend-8qud.onrender.com/api/academic-year/graduating-students/${this.currentYearId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    this.graduatingGroups = response.data.data.map(group => ({
                        ...group,
                        students: group.students.map(student => ({
                            ...student,
                            repeatGraduation: false
                        }))
                    }));
                } else {
                    this.graduateError = response.data.message || 'Ошибка при загрузке выпускников';
                }
            } catch (err) {
                this.graduateError = err.response?.data?.message || 'Не удалось загрузить выпускников';
                console.error('Ошибка:', err);
            } finally {
                this.loadingGraduates = false;
            }
        },
        async confirmGraduates() {
            this.processingTransition = true;

            try {
                const token = localStorage.getItem('token');
                const repeatStudents = this.graduatingGroups
                    .flatMap(group => group.students)
                    .filter(s => s.repeatGraduation)
                    .map(s => s.student_id);

                const response = await axios.post(
                    'https://backend-8qud.onrender.com/api/academic-year/process-transition',
                    {
                        currentYearId: this.currentYearId,
                        nextYear: this.nextYear,
                        repeatStudents: repeatStudents.length > 0 ? repeatStudents : null
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    this.$emit('next-step');
                }
            } catch (err) {
                console.error('Ошибка:', err);
            } finally {
                this.processingTransition = false;
            }
        }
    },
    async created() {
        await this.loadGraduatingStudents();
    }
};
</script>