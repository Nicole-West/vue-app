<template>
    <div class="flex flex-col min-h-screen">
        <header class="header">
            <router-link to="/admin" class="logo">Admin</router-link>
            <button @click="logout" class="logout-button">Выйти</button>
        </header>

        <main class="main flex-1 p-4">
            <h1 class="text-2xl font-bold mb-6">Переход на следующий семестр</h1>

            <!-- Индикатор шагов -->
            <div class="steps mb-6">
                <div v-for="(stepName, index) in steps" :key="index"
                    :class="['step', { 'active': step === index + 1, 'completed': step > index + 1 }]">
                    {{ stepName }}
                </div>
            </div>

            <div v-if="loading">
                <p>Загрузка данных...</p>
            </div>

            <div v-else-if="!canTransition">
                <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
                    <p class="font-bold">Переход на следующий семестр пока недоступен</p>
                    <p>Текущий месяц: {{ currentMonthName }} ({{ currentMonth }})</p>
                    <p>Переход возможен только в декабре (месяц 12)</p>
                </div>
            </div>

            <div v-else>
                <!-- Шаг 1: Подтверждение начала перехода -->
                <div v-if="step === 1" class="transition-step">
                    <h2 class="text-xl font-semibold mb-4">Подготовка к переходу</h2>
                    <p class="mb-4">Текущий семестр: {{ currentSemesterNumber }} ({{ currentSemesterName }})</p>
                    <p class="mb-4">Следующий семестр: {{ nextSemesterNumber }} ({{ nextSemesterName }})</p>

                    <button @click="startTransition" class="btn-primary">
                        Начать переход
                    </button>
                </div>

                <!-- Шаг 2: Обновление статусов студентов -->
                <div v-if="step === 2" class="transition-step">
                    <h2 class="text-xl font-semibold mb-4">Обновление статусов студентов</h2>

                    <div v-if="groupsWithStudents.length === 0">
                        <p>Нет активных групп с студентами</p>
                    </div>

                    <div v-else v-for="group in groupsWithStudents" :key="group.group_id" class="mb-8">
                        <h3 class="text-lg font-medium mb-2">
                            Группа: {{ group.group_number }} ({{ group.course_name }})
                        </h3>

                        <table class="min-w-full bg-white mb-4">
                            <thead>
                                <tr>
                                    <th>Студент</th>
                                    <th>Текущий статус</th>
                                    <th>Новый статус</th>
                                    <th v-if="showGroupTransfer">Новая группа</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="student in group.students" :key="student.student_id">
                                    <td>{{ student.full_name }}</td>
                                    <td>{{ formatStatus(student.status) }}</td>
                                    <td>
                                        <select v-model="student.new_status" @change="handleStatusChange(student)">
                                            <option v-for="option in statusOptions" :value="option.value"
                                                :key="option.value">
                                                {{ option.text }}
                                            </option>
                                        </select>
                                    </td>
                                    <td v-if="student.new_status === 'transferred'">
                                        <select v-model="student.new_group_id">
                                            <option value="">Выберите группу</option>
                                            <option v-for="g in availableGroups" :value="g.group_id" :key="g.group_id">
                                                {{ g.group_number }} ({{ g.course_name }})
                                            </option>
                                        </select>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <button @click="saveStudentStatuses" class="btn-primary">
                        Сохранить изменения и продолжить
                    </button>
                </div>

                <!-- Шаг 3: Управление академическими отпусками -->
                <div v-if="step === 3" class="transition-step">
                    <h2 class="text-xl font-semibold mb-4">Студенты в академическом отпуске</h2>

                    <div v-if="academicLeaveStudents.length === 0">
                        <p>Нет студентов в академическом отпуске</p>
                    </div>
                    <div v-else>
                        <table class="min-w-full bg-white mb-4">
                            <thead>
                                <tr>
                                    <th>Студент</th>
                                    <th>Группа</th>
                                    <th>Курс</th>
                                    <th>Действие</th>
                                    <th v-if="showGroupSelection">Новая группа</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="student in academicLeaveStudents" :key="student.student_id">
                                    <td>{{ student.full_name }}</td>
                                    <td>{{ student.group_number }}</td>
                                    <td>{{ student.course_name }}</td>
                                    <td>
                                        <select v-model="student.action" @change="handleAcademicLeaveAction(student)">
                                            <option value="expel">Отчислить</option>
                                            <option value="extend">Продлить академ</option>
                                            <option value="continue">Продолжить обучение</option>
                                        </select>
                                    </td>
                                    <td v-if="student.action === 'continue' && showGroupSelection">
                                        <select v-model="student.new_group_id">
                                            <option value="">Выберите группу</option>
                                            <option v-for="group in availableGroups" :value="group.group_id"
                                                :key="group.group_id">
                                                {{ group.group_number }} ({{ group.course_name }})
                                            </option>
                                        </select>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <button @click="saveAcademicLeaveDecisions" class="btn-primary">
                            Сохранить решения и продолжить
                        </button>
                    </div>
                </div>

                <!-- Шаг 4: Назначение преподавателей -->
                <div v-if="step === 4" class="transition-step">
                    <h2 class="text-xl font-semibold mb-4">Назначение преподавателей</h2>

                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white">
                            <thead>
                                <tr>
                                    <th>Группа</th>
                                    <th>Предмет</th>
                                    <th>Преподаватель</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="groupSubject in groupSubjects" :key="groupSubject.group_subject_id">
                                    <td>{{ groupSubject.group_number }}</td>
                                    <td>{{ groupSubject.subject_name }}</td>
                                    <td>
                                        <select v-model="teacherAssignments[groupSubject.group_subject_id]">
                                            <option value="">-- Выберите --</option>
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

                    <button @click="completeTransition" :disabled="!allTeachersAssigned" class="btn-primary mt-4">
                        Завершить переход
                    </button>
                </div>
            </div>
        </main>

        <footer class="footer">
            © 2025 Дипломная работа
        </footer>
    </div>
</template>

<script>
import axios from 'axios';
import router from '../router';

export default {
    data() {
        return {
            loading: true,
            canTransition: false,
            currentMonth: null,
            currentSemesterNumber: null,
            nextSemesterNumber: null,
            step: 1,
            steps: [
                'Подготовка',
                'Обновление статусов',
                'Академотпуска',
                'Назначение преподавателей'
            ],

            // Данные для шага 2
            groupsWithStudents: [],
            availableGroups: [],
            showGroupTransfer: false,
            statusOptions: [
                { value: 'studying', text: 'Продолжает обучение' },
                { value: 'academic_leave', text: 'Академотпуск' },
                { value: 'expelled', text: 'Отчислен' },
                { value: 'transferred', text: 'Переведен в другую группу' }
            ],

            // Данные для шага 3
            academicLeaveStudents: [],
            showGroupSelection: false,

            // Данные для шага 4
            groupSubjects: [],
            teachers: [],
            teacherAssignments: {},

            // Общие данные
            currentYearId: null,
            nextSemesterId: null
        };
    },

    computed: {
        currentMonthName() {
            const months = {
                '9': 'Сентябрь',
                '10': 'Октябрь',
                '11': 'Ноябрь',
                '12': 'Декабрь',
                '2': 'Февраль',
                '3': 'Март',
                '4': 'Апрель',
                '5': 'Май'
            };
            return months[this.currentMonth] || this.currentMonth;
        },

        currentSemesterName() {
            return this.currentSemesterNumber === '1' ? 'Осенний' : 'Весенний';
        },

        nextSemesterName() {
            return this.nextSemesterNumber === '1' ? 'Осенний' : 'Весенний';
        },

        allTeachersAssigned() {
            return Object.values(this.teacherAssignments).every(id => id) &&
                Object.keys(this.teacherAssignments).length === this.groupSubjects.length;
        }
    },

    async created() {
        await this.loadInitialData();
    },

    methods: {
        formatStatus(status) {
            const statusMap = {
                'studying': 'Обучается',
                'academic_leave': 'Академотпуск',
                'expelled': 'Отчислен',
                'transferred': 'Переведен',
                'graduated': 'Закончил',
                'repeat_graduate': 'Повторное обучение'
            };
            return statusMap[status] || status;
        },

        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('name');
            router.push('/login');
        },

        async loadInitialData() {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3000/api/semester-transition/init', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = response.data.data;
                this.currentMonth = data.currentMonth;
                this.currentSemesterNumber = data.currentSemesterNumber;
                this.nextSemesterNumber = data.nextSemesterNumber;
                this.currentYearId = data.currentYearId;
                this.nextSemesterId = data.nextSemesterId;
                this.canTransition = data.canTransition;

                this.loading = false;
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
                this.loading = false;
            }
        },

        async startTransition() {
            try {
                const token = localStorage.getItem('token');

                // 1. Деактивируем текущий месяц (декабрь)
                await axios.post(
                    'http://localhost:3000/api/semester-transition/deactivate-month',
                    { month: '12' },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // 2. Добавляем новый месяц (февраль)
                await axios.post(
                    'http://localhost:3000/api/semester-transition/add-month',
                    { month: '2', yearId: this.currentYearId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // 3. Загружаем текущих студентов для шага 2
                await this.loadCurrentStudents();
                this.step = 2;
            } catch (error) {
                console.error('Ошибка при начале перехода:', error);
            }
        },

        async loadCurrentStudents() {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    'http://localhost:3000/api/semester-transition/current-students',
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                this.groupsWithStudents = response.data.data;
                this.showGroupTransfer = false;

                // Загружаем доступные группы для перевода
                await this.loadAvailableGroups();
            } catch (error) {
                console.error('Ошибка загрузки студентов:', error);
            }
        },

        async loadAvailableGroups() {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    'http://localhost:3000/api/semester-transition/available-groups',
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                this.availableGroups = response.data.data;
            } catch (error) {
                console.error('Ошибка загрузки групп:', error);
            }
        },

        handleStatusChange(student) {
            this.showGroupTransfer = this.groupsWithStudents.some(
                group => group.students.some(
                    s => s.new_status === 'transferred'
                )
            );
        },

        async saveStudentStatuses() {
            try {
                const token = localStorage.getItem('token');

                // Подготовка данных для отправки
                const updates = this.groupsWithStudents.flatMap(group =>
                    group.students.map(student => ({
                        student_id: student.student_id,
                        history_id: student.history_id,
                        new_status: student.new_status,
                        new_group_id: student.new_group_id || null
                    }))
                );

                await axios.post(
                    'http://localhost:3000/api/semester-transition/update-student-statuses',
                    { updates },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Переходим к обработке академотпусков
                await this.loadAcademicLeaveStudents();
                this.step = 3;
            } catch (error) {
                console.error('Ошибка при сохранении статусов:', error);
            }
        },

        async loadAcademicLeaveStudents() {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `http://localhost:3000/api/semester-transition/academic-leaves`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                this.academicLeaveStudents = response.data.data.students.map(s => ({
                    ...s,
                    action: 'extend', // По умолчанию - продлить академ
                    new_group_id: null
                }));

                this.availableGroups = response.data.data.availableGroups;
                this.showGroupSelection = false;
            } catch (error) {
                console.error('Ошибка загрузки студентов в академе:', error);
            }
        },

        handleAcademicLeaveAction(student) {
            this.showGroupSelection = this.academicLeaveStudents.some(
                s => s.action === 'continue'
            );
        },

        async saveAcademicLeaveDecisions() {
            try {
                const token = localStorage.getItem('token');
                const decisions = this.academicLeaveStudents.map(student => ({
                    student_id: student.student_id,
                    action: student.action,
                    new_group_id: student.new_group_id
                }));

                await axios.post(
                    'http://localhost:3000/api/semester-transition/process-academic-leaves',
                    { decisions },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Переходим к назначению преподавателей
                await this.processGroupSubjects();
                await this.loadGroupSubjectsAndTeachers();
                this.step = 4;
            } catch (error) {
                console.error('Ошибка при сохранении решений:', error);
            }
        },

        async processGroupSubjects() {
            try {
                const token = localStorage.getItem('token');
                await axios.post(
                    'http://localhost:3000/api/semester-transition/process-group-subjects',
                    { yearId: this.currentYearId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (error) {
                console.error('Ошибка обработки предметов:', error);
                throw error;
            }
        },

        async loadGroupSubjectsAndTeachers() {
            try {
                const token = localStorage.getItem('token');
                const [groupSubjectsRes, teachersRes] = await Promise.all([
                    axios.get(
                        `http://localhost:3000/api/semester-transition/group-subjects`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    ),
                    axios.get(
                        `http://localhost:3000/api/semester-transition/teachers`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                ]);

                this.groupSubjects = groupSubjectsRes.data.data;
                this.teachers = teachersRes.data.data;

                // Инициализируем пустые назначения
                this.teacherAssignments = {};
                this.groupSubjects.forEach(gs => {
                    this.$set(this.teacherAssignments, gs.group_subject_id, gs.teacher_id || '');
                });
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            }
        },

        async completeTransition() {
            try {
                const token = localStorage.getItem('token');

                // 1. Назначаем преподавателей
                const assignments = Object.entries(this.teacherAssignments)
                    .filter(([_, teacher_id]) => teacher_id)
                    .map(([group_subject_id, teacher_id]) => ({
                        group_subject_id: parseInt(group_subject_id),
                        teacher_id: parseInt(teacher_id)
                    }));

                if (assignments.length > 0) {
                    await axios.post(
                        'http://localhost:3000/api/semester-transition/assign-teachers',
                        { assignments },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                }

                // 2. Инициализируем оценки
                await axios.post(
                    'http://localhost:3000/api/semester-transition/initialize-grades',
                    { yearId: this.currentYearId, semesterId: this.nextSemesterId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // 3. Завершаем переход
                alert('Переход на следующий семестр успешно завершен');
                router.push('/admin');
            } catch (error) {
                console.error('Ошибка при завершении перехода:', error);
            }
        }
    }
};
</script>

.steps {
display: flex;
justify-content: space-between;
margin-bottom: 1rem;
}

.step {
padding: 0.5rem 1rem;
border-radius: 0.25rem;
background: #e5e7eb;
color: #6b7280;
flex: 1;
text-align: center;
margin: 0 0.25rem;
}

.step.active {
background: #3b82f6;
color: white;
}

.step.completed {
background: #10b981;
color: white;
}
