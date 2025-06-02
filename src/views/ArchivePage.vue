<template>
    <div class="flex flex-col min-h-screen">
        <header class="header">
            <router-link to="/my" class="logo">Home</router-link>
            <div>
                <button @click="logout" class="logout-button">Выйти</button>
            </div>
        </header>

        <main class="main flex-1 p-4">
            <h1 class="text-2xl font-bold mb-6">Архив успеваемости</h1>

            <!-- Форма фильтрации -->
            <div class="bg-white p-4 rounded-lg shadow-md mb-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Год -->
                    <div class="form-group">
                        <label>Учебный год:</label>
                        <select v-model="filters.year_id" class="form-control">
                            <option value="">Все годы</option>
                            <option v-for="year in filterOptions.years" :value="year.year_id" :key="year.year_id">
                                {{ year.year }}
                            </option>
                        </select>
                    </div>

                    <!-- Семестр -->
                    <div class="form-group">
                        <label>Семестр:</label>
                        <select v-model="filters.semester_id" class="form-control">
                            <option value="">Все семестры</option>
                            <option v-for="semester in filterOptions.semesters" :value="semester.semester_id"
                                :key="semester.semester_id">
                                {{ semester.semester_number }} семестр
                            </option>
                        </select>
                    </div>

                    <!-- Месяц -->
                    <div class="form-group">
                        <label>Месяц:</label>
                        <select v-model="filters.month" class="form-control">
                            <option value="">Все месяцы</option>
                            <option v-for="month in filterOptions.months" :value="month.month" :key="month.month">
                                {{ getMonthName(month.month) }}
                            </option>
                        </select>
                    </div>

                    <!-- Предмет -->
                    <div class="form-group">
                        <label>Предмет:</label>
                        <select v-model="filters.subject_id" class="form-control">
                            <option value="">Все предметы</option>
                            <option v-for="subject in filterOptions.subjects" :value="subject.subject_id"
                                :key="subject.subject_id">
                                {{ subject.subject_name }}
                            </option>
                        </select>
                    </div>

                    <!-- Группа -->
                    <div class="form-group">
                        <label>Группа:</label>
                        <select v-model="filters.group_id" class="form-control">
                            <option value="">Все группы</option>
                            <option v-for="group in filterOptions.groups" :value="group.group_id" :key="group.group_id">
                                {{ group.group_number }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group flex items-end">
                        <button @click="fetchData" class="btn btn-primary">
                            Поиск
                        </button>
                        <button @click="resetFilters" class="btn btn-secondary ml-2">
                            Сбросить
                        </button>
                    </div>
                </div>
            </div>

            <!-- Результаты -->
            <div v-if="loading" class="text-center py-8">
                <span class="loading">Загрузка данных...</span>
            </div>

            <div v-else>
                <div v-if="archiveData.length > 0" class="overflow-x-auto">
                    <table class="min-w-full bg-white">
                        <thead>
                            <tr>
                                <th>Студент</th>
                                <th>Группа</th>
                                <th>Предмет</th>
                                <th>Год</th>
                                <th>Семестр</th>
                                <th>Месяц</th>
                                <th>Оценка</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in archiveData" :key="item.grade_id">
                                <td>{{ item.student_name }}</td>
                                <td>{{ item.group_number }}</td>
                                <td>{{ item.subject_name }}</td>
                                <td>{{ item.year }}</td>
                                <td>{{ item.semester_number }}</td>
                                <td>{{ getMonthName(item.month) }}</td>
                                <td>{{ item.grade || '-' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="text-center py-8 text-gray-500">
                    Нет данных по выбранным фильтрам
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
            loading: false,
            filters: {
                year_id: '',
                semester_id: '',
                month: '',
                subject_id: '',
                group_id: ''
            },
            filterOptions: {
                years: [],
                semesters: [],
                months: [],
                subjects: [],
                groups: []
            },
            archiveData: []
        };
    },

    async created() {
        await this.fetchFilterOptions();
    },

    methods: {
        logout() {
            localStorage.removeItem('token');
            router.push('/login');
        },

        async fetchFilterOptions() {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('https://backend-8qud.onrender.com/api/archive/filters', {
                    // const response = await axios.get('/api/archive/filters', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log(response);


                this.filterOptions = response.data.data;
            } catch (error) {
                console.error('Ошибка загрузки фильтров:', error);
            }
        },

        async fetchData() {
            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                const params = {
                    ...this.filters,
                    // Удаляем пустые параметры
                    ...Object.fromEntries(Object.entries(this.filters).filter(([_, v]) => v !== ''))
                };

                const response = await axios.get('https://backend-8qud.onrender.com/api/archive/data', {
                    // const response = await axios.get('/api/archive/data', {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                });

                this.archiveData = response.data.data;
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
                this.archiveData = [];
            } finally {
                this.loading = false;
            }
        },

        resetFilters() {
            this.filters = {
                year_id: '',
                semester_id: '',
                month: '',
                subject_id: '',
                group_id: ''
            };
            this.archiveData = [];
        },

        getMonthName(month) {
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
            return months[month] || month;
        }
    }
};
</script>

<style scoped>
table.min-w-full.bg-white {
    border: 1px solid black;
    border-collapse: collapse
}

tr,
td,
th {
    border: 1px solid #000000;
}

thead {
    border: 1px solid black;
}
</style>