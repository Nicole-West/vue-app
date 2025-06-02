<template>
    <div>
        <h3 class="text-lg font-semibold mb-4">Перевод студентов на следующий курс</h3>

        <div v-if="loadingContinuingStudents">Загрузка данных...</div>

        <div v-else-if="continuingStudentsError" class="text-red-500 mb-4">{{ continuingStudentsError }}</div>
        <div v-else-if="noStudentsToContinue" class="mb-4">
            <p>Нет студентов для перевода.</p>
            <button class="btn_admin bg-blue-600 mt-4" @click="$emit('next-step')">
                Перейти к добавлению новых групп
            </button>
        </div>
        <div v-else>
            <div class="mb-6" v-for="group in continuingGroups" :key="group.group_id">
                <h4 class="font-medium mb-2">
                    Группа {{ group.group_number }}
                    (перевод с {{ group.current_course }} на {{ group.next_course }})
                </h4>

                <div class="bg-gray-50 p-3 rounded">
                    <div v-for="student in group.students" :key="student.student_id" class="flex items-center mb-2">
                        <select v-model="student.action" class="border rounded px-2 py-1 mr-3">
                            <option value="continue">Перевести</option>
                            <option value="academic_leave">Академотпуск</option>
                            <option value="expel">Отчислить</option>
                            <option value="transfer">Перевести в другую группу</option>
                        </select>

                        <span>{{ student.full_name }}</span>

                        <select v-if="student.action === 'transfer'" v-model="student.new_group_id"
                            class="border rounded px-2 py-1 ml-3">
                            <option v-for="g in availableGroups" :value="g.group_id" :key="g.group_id">
                                {{ g.group_number }} ({{ g.course_name }})
                            </option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="flex space-x-3">
                <button class="btn_admin bg-blue-600" @click="processStudentTransitions">
                    Подтвердить перевод
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
            loadingContinuingStudents: false,
            continuingStudentsError: null,
            continuingGroups: [],
            availableGroups: [],
            processingTransition: false,
            noStudentsToContinue: false // Флаг для случая, когда студентов нет
        };
    },
    methods: {
        async loadContinuingStudents() {
            this.loadingContinuingStudents = true;
            this.continuingStudentsError = null;

            try {
                const token = localStorage.getItem('token');

                // Заменяем retryableAxiosRequest на обычные запросы с обработкой ошибок
                const studentsRes = await axios.get(
                    `https://backend-8qud.onrender.com/api/academic-year/students/continuing/${this.currentYearId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        // timeout: 10000 // 10 секунд таймаут
                    }
                );
                // ).catch(error => {
                //     console.error('Ошибка при загрузке студентов:', error);
                //     throw error;
                // });

                const groupsRes = await axios.get(
                    `https://backend-8qud.onrender.com/api/academic-year/groups/available/${this.currentYearId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        // timeout: 10000 // 10 секунд таймаут
                    }
                );
                // ).catch(error => {
                //     console.error('Ошибка при загрузке групп:', error);
                //     throw error;
                // });

                if (studentsRes.data.success && groupsRes.data.success) {
                    this.continuingGroups = studentsRes.data.data;
                    this.availableGroups = groupsRes.data.data;

                    // Проверяем, есть ли студенты для перевода
                    this.noStudentsToContinue = this.continuingGroups.length === 0 ||
                        this.continuingGroups.every(g => g.students.length === 0);


                    // Инициализируем action для каждого студента
                    if (!this.noStudentsToContinue) {
                        this.continuingGroups.forEach(group => {
                            group.students.forEach(student => {
                                this.$set(student, 'action', 'continue');
                                this.$set(student, 'new_group_id', null);
                            });
                        });
                    }
                }
            } catch (err) {
                this.continuingStudentsError = err.response?.data?.message ||
                    err.message ||
                    'Не удалось загрузить данные';
                console.error('Ошибка:', err);
            } finally {
                this.loadingContinuingStudents = false;
            }
        },

        async processStudentTransitions() {
            this.processingTransition = true;
            this.continuingStudentsError = null;

            try {
                const token = localStorage.getItem('token');
                const transitions = this.continuingGroups.flatMap(group =>
                    group.students.map(student => ({
                        student_id: student.student_id,
                        current_group_id: group.group_id,
                        action: student.action,
                        new_group_id: student.new_group_id
                    }))
                );

                console.log('Отправляемые данные:', {
                    currentYearId: this.currentYearId,
                    nextYear: this.nextYear,
                    transitions
                });

                const response = await axios.post(
                    'https://backend-8qud.onrender.com/api/academic-year/student-processing',
                    {
                        currentYearId: this.currentYearId,
                        nextYear: this.nextYear,
                        transitions
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 15000 // 15 секунд таймаут
                    }
                );

                if (response.data.success) {
                    this.$emit('next-step');
                } else {
                    throw new Error(response.data.message || 'Ошибка при обработке перевода');
                }
            } catch (err) {
                this.continuingStudentsError = err.response?.data?.message ||
                    err.message ||
                    'Ошибка при завершении перехода';
                console.error('Ошибка:', err);
            } finally {
                this.processingTransition = false;
            }
        }
    },
    async created() {
        await this.loadContinuingStudents();
    }
};
</script>