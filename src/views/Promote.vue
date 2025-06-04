<template>
    <div class="flex flex-col min-h-screen">
        <header class="header">
            <router-link to="/admin" class="logo">Admin</router-link>
            <button @click="logout" class="logout-button">Выйти</button>
        </header>

        <main class="main flex-1 p-4">
            <h2 class="text-xl font-bold mb-4">Переход на следующий учебный год</h2>

            <!-- Шаг 1: Начало перехода -->
            <div v-if="step === 1">
                <div v-if="loading">Загрузка...</div>
                <div v-else-if="error" class="text-red-500 mb-4">{{ error }}</div>
                <div v-else>
                    <p class="mb-4">Текущий учебный год: <strong>{{ currentYear }}</strong></p>
                    <p class="mb-4">Следующий учебный год: <strong>{{ nextYear }}</strong></p>
                    <button class="btn_admin" @click="startTransition" :disabled="processing">
                        <span v-if="processing">Обработка...</span>
                        <span v-else>Продолжить</span>
                    </button>
                </div>
            </div>

            <!-- Шаг 2: Подтверждение выпускников -->
            <div v-if="step === 2">
                <h3 class="text-lg font-semibold mb-4">Подтверждение выпускников</h3>

                <div v-if="loadingGraduates">Загрузка списка выпускников...</div>
                <div v-else-if="graduateError" class="text-red-500 mb-4">{{ graduateError }}</div>
                <div v-else>
                    <div class="mb-6" v-for="group in graduatingGroups" :key="group.group_id">
                        <h4 class="font-medium mb-2">Группа {{ group.group_number }} ({{ group.course_name }})</h4>

                        <div class="bg-gray-50 p-3 rounded">
                            <div v-for="student in group.students" :key="student.student_id"
                                class="flex items-center mb-2">
                                <input type="checkbox" :id="'student_' + student.student_id"
                                    v-model="student.repeatGraduation" class="mr-2">
                                <label :for="'student_' + student.student_id">
                                    {{ student.full_name }}
                                    <span v-if="student.repeatGraduation" class="text-red-600 ml-2">(Повторная
                                        защита)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="flex space-x-3">
                        <button class="btn_admin bg-blue-600" @click="confirmGraduates">
                            Подтвердить выпуск
                        </button>
                        <button class="btn_admin bg-gray-500" @click="step = 1">
                            Назад
                        </button>
                    </div>
                </div>
            </div>

            <!-- Шаг 3: Перевод продолжающих студентов -->
            <div v-if="step === 3">
                <h3 class="text-lg font-semibold mb-4">Перевод студентов на следующий курс</h3>

                <div v-if="loadingContinuingStudents">Загрузка данных...</div>
                <div v-else-if="continuingStudentsError" class="text-red-500 mb-4">{{ continuingStudentsError }}</div>
                <div v-else>
                    <div class="mb-6" v-for="group in continuingGroups" :key="group.group_id">
                        <h4 class="font-medium mb-2">
                            Группа {{ group.group_number }}
                            (перевод с {{ group.current_course }} на {{ group.next_course }})
                        </h4>

                        <div class="bg-gray-50 p-3 rounded">
                            <div v-for="student in group.students" :key="student.student_id"
                                class="flex items-center mb-2">
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
                        <button class="btn_admin bg-gray-500" @click="step = 2">
                            Назад
                        </button>
                    </div>
                </div>
            </div>

            <!-- Шаг 4: Добавление новых групп -->
            <div v-if="step === 4">
                <h3>Добавление групп первокурсников</h3>

                <div class="tabs mb-4">
                    <button @click="addMethod = 'manual'" :class="{ 'tab-active': addMethod === 'manual' }">
                        Ручной ввод
                    </button>
                    <button @click="addMethod = 'excel'" :class="{ 'tab-active': addMethod === 'excel' }">
                        Импорт из Excel
                    </button>
                </div>

                <!-- Ручной ввод -->
                <div v-if="addMethod === 'manual'" class="manual-input">
                    <div class="form-group">
                        <label>Название группы:</label>
                        <input v-model="newGroup.name" placeholder="Например: 101-1">
                    </div>

                    <!-- Добавляем чекбокс для магистров -->
                    <div class="form-group">
                        <label>
                            <input type="checkbox" v-model="newGroup.isMaster">
                            Группа магистров
                        </label>
                    </div>

                    <div class="form-group">
                        <label>Студенты (по одному в строке):</label>
                        <textarea v-model="newGroup.studentsText" rows="10"></textarea>
                    </div>

                    <button @click="addManualGroup" class="btn-save">Добавить группу</button>
                </div>

                <!-- Импорт из Excel -->
                <div v-else class="excel-import">
                    <input type="file" ref="fileInput" @change="handleFileUpload" accept=".xlsx,.xls">

                    <div v-if="excelData" class="preview">
                        <h4>Проверьте данные перед сохранением (всего групп: {{ excelData.length }})</h4>

                        <div v-for="(group, groupIndex) in excelData" :key="groupIndex"
                            class="group-container mb-6 p-4 border rounded">
                            <div class="form-group">
                                <label>Название группы:</label>
                                <input v-model="group.proposedGroupName"
                                    :class="{ 'error-input': !isValidGroupName(group.proposedGroupName) }">
                                <span v-if="!isValidGroupName(group.proposedGroupName)" class="error-message">
                                    Неверный формат названия группы. Формат: 1234567/12345
                                </span>
                            </div>

                            <!-- Добавляем чекбокс для магистров -->
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" v-model="group.isMaster">
                                    Группа магистров
                                </label>
                            </div>

                            <table class="w-full">
                                <thead>
                                    <tr>
                                        <th>№</th>
                                        <th>ФИО студента</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(student, index) in group.students" :key="index">
                                        <td>{{ student.number }}</td>
                                        <td>
                                            <input v-model="student.full_name">
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="mt-4 flex justify-center">
                            <button @click="confirmAllGroups" class="btn-save">
                                Добавить все группы ({{ excelData.length }})
                            </button>
                        </div>
                    </div>
                </div>

                <div class="mt-8 pt-4 border-t">
                    <button @click="moveToStep5" class="btn-continue" :disabled="processing">
                        Продолжить переход
                    </button>
                    <button @click="step = 3" class="btn-secondary ml-4">
                        Назад
                    </button>
                </div>
            </div>

            <!-- Шаг 5: Управление академическими отпусками -->
            <div v-if="step === 5">
                <h3 class="text-lg font-semibold mb-4">Студенты в академическом отпуске</h3>

                <div v-if="loadingAcademicLeaves">Загрузка данных...</div>
                <div v-else-if="academicLeaveError" class="text-red-500 mb-4">{{ academicLeaveError }}</div>
                <div v-else>
                    <div v-if="academicLeaveStudents && academicLeaveStudents.length > 0" class="mb-6 overflow-x-auto">
                        <table class="min-w-full bg-white">
                            <thead>
                                <tr>
                                    <th class="py-2 px-4 border-b">Студент</th>
                                    <th class="py-2 px-4 border-b">Группа</th>
                                    <th class="py-2 px-4 border-b">Курс</th>
                                    <th class="py-2 px-4 border-b">Действие</th>
                                    <th class="py-2 px-4 border-b" v-if="showGroupSelection">Новая группа</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="student in academicLeaveStudents" :key="student.student_id">
                                    <td class="py-2 px-4 border-b">{{ student.full_name }}</td>
                                    <td class="py-2 px-4 border-b">{{ student.group_number }}</td>
                                    <td class="py-2 px-4 border-b">{{ student.course_name }}</td>
                                    <td class="py-2 px-4 border-b">
                                        <select v-model="student.action" @change="handleAcademicLeaveAction(student)">
                                            @change="student.new_group_id = null">
                                            <option value="expel">Отчислить</option>
                                            <option value="continue">Продолжить обучение</option>
                                            <option value="extend">Продлить академ</option>
                                        </select>
                                    </td>
                                    <td class="py-2 px-4 border-b"
                                        v-if="student.action === 'continue' && showGroupSelection">
                                        <select v-model="student.new_group_id" class="border rounded px-2 py-1">
                                            <option :value="null">Выберите группу</option>
                                            <option v-for="group in availableGroups2" :key="group.group_id"
                                                :value="group.group_id">
                                                {{ group.group_number }} ({{ group.course_name }})
                                            </option>
                                        </select>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-else class="mb-6 text-gray-500">
                        Нет студентов в академическом отпуске
                    </div>

                    <div class="flex space-x-3">
                        <button class="btn_admin bg-blue-600" @click="saveAcademicLeaveDecisions">
                            {{ academicLeaveStudents && academicLeaveStudents.length > 0 ? 'Сохранить решения' :
                                'Продолжить' }}
                        </button>
                        <button class="btn_admin bg-gray-500" @click="step = 4">
                            Назад
                        </button>
                    </div>
                </div>
            </div>

            <!-- Шаг 6: Завершение перехода -->
            <div v-if="step === 6">
                <h3>Завершение перехода на {{ nextYear }} год</h3>

                <div class="processing-section" v-if="!showTeacherAssignment">
                    <p>Выполняются финальные приготовления...</p>
                    <div v-if="processingStep6" class="spinner"></div>
                </div>

                <div v-else-if="showTeacherAssignment" class="teacher-assignment">
                    <h4>Назначение преподавателей на предметы</h4>

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

                    <div class="final-actions">
                        <button @click="submitTeacherAssignments" :disabled="!allTeachersAssigned || processingStep6"
                            class="btn-complete">
                            <span v-if="processingStep6">
                                <i class="fas fa-spinner fa-spin"></i> Завершение перехода...
                            </span>
                            <span v-else>Завершить переход на {{ nextYear }} год</span>
                        </button>
                        <button @click="step = 5" class="btn-secondary ml-4">
                            Назад
                        </button>

                        <div v-if="error" class="error-message">{{ error }}</div>
                    </div>
                </div>
            </div>
        </main>

        <footer class="footer">© 2025 Дипломная работа</footer>
    </div>
</template>

<script>
import axios from 'axios';
import router from '../router';

export default {
    data() {
        return {
            step: 1,
            loading: true,
            processing: false,
            error: null,
            currentYear: '',
            nextYear: '',
            currentYearId: null,

            // Для шага 2
            loadingGraduates: false,
            graduateError: null,
            graduatingGroups: [],

            // Для шага 3 (перевод студентов)
            loadingContinuingStudents: false,
            continuingStudentsError: null,
            continuingGroups: [],
            availableGroups: [],

            // Для шага 4 (добавление групп)
            addMethod: 'manual',
            newGroup: {
                name: '',
                studentsText: '',
                isMaster: false
            },
            excelData: null,
            file: null,

            // Для шага 5 (академотпуска)
            loadingAcademicLeaves: false,
            academicLeaveError: null,
            academicLeaveStudents: [],
            availableGroups2: [],
            showGroupSelection: true,

            // Для шага 6
            showTeacherAssignment: false,
            teachers: [],
            subjects: [],
            groupSubjects: [],
            teacherAssignments: {},
            processingStep6: true
        };
    },
    async created() {
        await this.fetchYearInfo();
    },
    computed: {
        allTeachersAssigned() {
            return Object.values(this.teacherAssignments).every(id => id);
        }
    },

    methods: {
        handleAcademicLeaveAction(student) {
            if (student.action === 'continue') {
                this.showGroupSelection = true;
            } else {
                this.showGroupSelection = false;
            }
        },

        async fetchYearInfo() {
            this.loading = true;
            this.error = null;

            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('https://backend-8qud.onrender.com/api/academic-year/transition-info', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    this.currentYear = response.data.data.currentYear;
                    this.nextYear = response.data.data.nextYear;
                    this.currentYearId = response.data.data.currentYearId;
                } else {
                    this.error = response.data.message || 'Ошибка при загрузке данных';
                }
            } catch (err) {
                this.error = err.response?.data?.message || 'Не удалось загрузить данные';
                console.error('Ошибка:', err);
            } finally {
                this.loading = false;
            }
        },

        async startTransition() {
            this.processing = true;
            try {
                await this.loadGraduatingStudents();
                this.step = 2;
            } catch (err) {
                this.error = 'Ошибка при подготовке перехода';
                console.error(err);
            } finally {
                this.processing = false;
            }
        },

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
            this.processing = true;
            this.error = null;

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
                    await this.loadContinuingStudents();
                    this.step = 3;
                } else {
                    this.error = response.data.message || 'Ошибка при обработке выпускников';
                }
            } catch (err) {
                this.error = err.response?.data?.message || 'Ошибка при обработке перехода';
                console.error('Ошибка:', err);
            } finally {
                this.processing = false;
            }
        },

        async loadContinuingStudents() {
            this.loadingContinuingStudents = true;
            this.continuingStudentsError = null;

            try {
                const token = localStorage.getItem('token');
                const studentsRes = await axios.get(
                    `https://backend-8qud.onrender.com/api/academic-year/students/continuing/${this.currentYearId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const groupsRes = await axios.get(
                    `https://backend-8qud.onrender.com/api/academic-year/groups/available/${this.currentYearId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (studentsRes.data.success && groupsRes.data.success) {
                    this.continuingGroups = studentsRes.data.data || [];
                    this.availableGroups = groupsRes.data.data || [];

                    if (this.continuingGroups.length === 0 ||
                        this.continuingGroups.every(g => !g.students || g.students.length === 0)) {
                        this.continuingStudentsError = 'Нет студентов для перевода';
                    } else {
                        this.continuingGroups.forEach(group => {
                            if (group.students) {
                                group.students.forEach(student => {
                                    student.action = 'continue';
                                    student.new_group_id = null;
                                });
                            }
                        });
                    }
                } else {
                    this.continuingStudentsError = 'Ошибка при загрузке данных';
                }
            } catch (err) {
                this.continuingStudentsError = err.response?.data?.message || 'Не удалось загрузить данные';
                console.error('Ошибка:', err);
            } finally {
                this.loadingContinuingStudents = false;
            }
        },

        async processStudentTransitions() {
            this.processing = true;

            try {
                const token = localStorage.getItem('token');

                if (this.continuingGroups.length === 0 ||
                    this.continuingGroups.every(g => !g.students || g.students.length === 0)) {
                    this.step = 4;
                    return;
                }

                const transitions = this.continuingGroups.flatMap(group =>
                    group.students.map(student => ({
                        student_id: student.student_id,
                        current_group_id: group.group_id,
                        action: student.action,
                        new_group_id: student.new_group_id
                    }))
                );

                const response = await axios.post(
                    'https://backend-8qud.onrender.com/api/academic-year/student-processing',
                    {
                        currentYearId: this.currentYearId,
                        nextYear: this.nextYear,
                        transitions
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    this.step = 4;
                } else {
                    this.error = response.data.message || 'Ошибка при завершении перехода';
                }
            } catch (err) {
                this.error = err.response?.data?.message || 'Ошибка при завершении перехода';
                console.error('Ошибка:', err);
            } finally {
                this.processing = false;
            }
        },

        isValidGroupName(name) {
            return /^\d{7}\/\d{5}$/.test(name);
        },

        async handleFileUpload(event) {
            this.file = event.target.files[0];
            const formData = new FormData();
            formData.append('file', this.file);

            try {
                const response = await axios.post('https://backend-8qud.onrender.com/api/academic-year/groups/parse-excel', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                this.excelData = response.data.data;
            } catch (err) {
                alert(err.response?.data?.message || 'Ошибка при обработке файла');
            }
        },

        async confirmAllGroups() {
            const invalidGroups = this.excelData.filter(
                group => !/^\d{7}\/\d{5}$/.test(group.proposedGroupName))
                .map(group => group.proposedGroupName);

            if (invalidGroups.length > 0) {
                alert(
                    `Ошибка валидации:\n\nНекорректные названия групп:\n${invalidGroups.join('\n')}\n\nФормат: 1234567/12345`
                );
                return;
            }

            this.processing = true;
            const groupsCount = this.excelData.length;

            try {
                for (const group of this.excelData) {
                    await axios.post('https://backend-8qud.onrender.com/api/academic-year/groups/manual', {
                        groupName: group.proposedGroupName,
                        students: group.students.map(s => s.full_name),
                        yearId: this.currentYearId,
                        isMaster: group.isMaster || false
                    }, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                }

                this.excelData = null;
                if (this.$refs.fileInput) {
                    this.$refs.fileInput.value = '';
                }

                alert(`Группы добавлены:\n\nУспешно импортировано ${groupsCount} групп`);
            } catch (err) {
                alert(`Ошибка:\n\n${err.response?.data?.message || 'Ошибка при создании групп'}`);
            } finally {
                this.processing = false;
            }
        },

        async addManualGroup() {
            const students = this.newGroup.studentsText
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            try {
                await axios.post('https://backend-8qud.onrender.com/api/academic-year/groups/manual', {
                    groupName: this.newGroup.name,
                    students,
                    yearId: this.currentYearId,
                    isMaster: this.newGroup.isMaster
                }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                alert('Группа успешно добавлена!');
                this.newGroup = { name: '', studentsText: '', isMaster: false };
            } catch (err) {
                alert(err.response?.data?.message || 'Ошибка при создании группы');
            }
        },

        async moveToStep5() {
            await this.loadAcademicLeaveStudents();
            this.step = 5;
        },

        async loadAcademicLeaveStudents() {
            this.loadingAcademicLeaves = true;
            this.academicLeaveError = null;

            try {
                const token = localStorage.getItem('token');
                const [studentsRes, groupsRes] = await Promise.all([
                    axios.get(
                        `https://backend-8qud.onrender.com/api/academic-year/students/academic-leaves/${this.currentYearId}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    ),
                    axios.get(
                        `https://backend-8qud.onrender.com/api/academic-year/available-groups/${this.currentYearId}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                ]);

                if (studentsRes.data.success && groupsRes.data.success) {
                    this.academicLeaveStudents = studentsRes.data.data.map(student => ({
                        ...student,
                        action: 'extend',
                        new_group_id: null
                    }));
                    this.availableGroups2 = groupsRes.data.data;
                } else {
                    this.academicLeaveError = studentsRes.data.message || 'Ошибка при загрузке данных';
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

                if (!this.academicLeaveStudents || this.academicLeaveStudents.length === 0) {
                    await this.finalizeTransition();
                    this.step = 6;
                    return;
                }

                const response = await axios.post(
                    'https://backend-8qud.onrender.com/api/academic-year/students/process-academic-leaves',
                    {
                        yearId: this.currentYearId,
                        decisions: this.academicLeaveStudents.map(s => ({
                            student_id: s.student_id,
                            action: s.action,
                            new_group_id: s.action === 'continue' ? s.new_group_id : null
                        }))
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    await this.finalizeTransition();
                    this.step = 6;
                } else {
                    this.academicLeaveError = response.data.message || 'Ошибка при обработке';
                }
            } catch (err) {
                this.academicLeaveError = err.response?.data?.message || 'Ошибка при обработке';
                console.error('Ошибка:', err);
            } finally {
                this.processing = false;
            }
        },

        async finalizeTransition() {
            this.processingStep6 = true;
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
                    this.subjects = response.data.data.subjects;
                    await this.loadGroupSubjects();
                    this.showTeacherAssignment = true;
                }
            } catch (err) {
                console.error(err);
            } finally {
                this.processingStep6 = false;
            }
        },

        async loadGroupSubjects() {
            const response = await axios.get('https://backend-8qud.onrender.com/api/academic-year/group-subjects/active', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.groupSubjects = response.data.data;

            // Инициализируем teacherAssignments
            this.groupSubjects.forEach(gs => {
                this.teacherAssignments[gs.group_subject_id] = gs.teacher_id || '';
            });
        },

        async submitTeacherAssignments() {
            try {
                const assignments = Object.entries(this.teacherAssignments)
                    .map(([group_subject_id, teacher_id]) => ({
                        group_subject_id,
                        teacher_id
                    }));

                await axios.post(
                    'https://backend-8qud.onrender.com/api/academic-year/assign',
                    { assignments },
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                );

                await axios.post(
                    'https://backend-8qud.onrender.com/api/academic-year/grades/initialize',
                    { yearId: this.currentYearId },
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                );

                alert('Переход на новый учебный год успешно завершен!');
                this.$router.push('/admin');
            } catch (err) {
                console.error(err);
            }
        },

        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('name');
            router.push('/login');
        }
    }
};
</script>

<style scope>
.final-step {
    max-width: 1200px;
    margin: 0 auto;
}

.final-actions {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    text-align: center;
}

.btn-complete {
    background-color: #4CAF50;
    color: white;
    padding: 12px 24px;
    font-size: 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.btn-complete:hover {
    background-color: #45a049;
}

.btn-complete:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.error-message {
    color: #d32f2f;
    margin-top: 15px;
}
</style>