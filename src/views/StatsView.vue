<template>
    <div class="flex flex-col min-h-screen">
        <header class="header">
            <router-link to="/my" class="logo"> Home </router-link>
            <div>
                <button v-if="userRole === 'senior_teacher'" @click="stats" class="archive-button">
                    Статистика
                </button>

                <button @click="logout" class="logout-button">
                    Выйти
                </button>
            </div>
        </header>

        <main class="main flex-1 p-4">
            <h1 class="text-2xl font-bold mb-6">Статистика текущей аттестации</h1>

            <!-- Существующая статистика -->
            <div class="stats-card mb-6">
                <h2 class="text-xl font-semibold mb-4">Кличество отсутвующих оценок</h2>
                <p class="text-lg">Всего: <span class="font-bold">{{ statsData?.total_failed || 0 }}</span></p>
            </div>

            <div class="stats-card mb-6">
                <h2 class="text-xl font-semibold mb-4">Студенты с 3+ нулевыми оценками</h2>
                <div v-if="statsData?.students_with_3plus_zeros?.length">
                    <div v-for="student in statsData.students_with_3plus_zeros" :key="student.student_id"
                        class="mb-2 p-2 bg-red-100 rounded">
                        {{ student.full_name }} ({{ student.group_number }}), нулей: {{ student.zero_count }}
                    </div>
                </div>
                <p v-else>Нет студентов с 3+ нулевыми оценками</p>
            </div>

            <div class="stats-card mb-6">
                <h2 class="text-xl font-semibold mb-4">Неаттестации по группам и предметам</h2>
                <div v-if="statsData?.failed_by_group_subject?.length">
                    <div v-for="item in statsData.failed_by_group_subject"
                        :key="`${item.group_id}-${item.subject_name}`" class="mb-3 p-3 bg-gray-100 rounded">
                        <h3 class="font-semibold">{{ item.group_number }} - {{ item.subject_name }}</h3>
                        <p>Количество пропусков: {{ item.failed_count }}</p>
                    </div>
                </div>
                <p v-else>Нет неаттестаций</p>
            </div>

            <!-- Новый блок для экспорта -->
            <!-- <div class="stats-card">
                <h2 class="text-xl font-semibold mb-4">Экспорт оценок в Excel</h2>
                <div class="flex flex-col md:flex-row gap-4 mb-4">
                    <div class="flex-1">
                        <label class="block mb-2">Группа:</label>
                        <select v-model="exportData.group_id" class="w-full p-2 border rounded">
                            <option value="">Выберите группу</option>
                            <option v-for="group in groups" :key="group.group_id" :value="group.group_id">
                                {{ group.group_number }}
                            </option>
                        </select>
                    </div>
                    <div class="flex-1">
                        <label class="block mb-2">Предмет:</label>
                        <select v-model="exportData.subject_id" :disabled="!exportData.group_id"
                            class="w-full p-2 border rounded">
                            <option value="">Выберите предмет</option>
                            <option v-for="subject in subjects" :key="subject.subject_id" :value="subject.subject_id">
                                {{ subject.subject_name }}
                            </option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button @click="exportExcel" :disabled="!exportData.group_id || !exportData.subject_id"
                            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                            Экспорт
                        </button>
                    </div>
                </div>
            </div> -->

            <div class="stats-card">
                <h2 class="text-xl font-semibold mb-4">Экспорт оценок в Excel</h2>
                <div class="flex flex-col md:flex-row gap-4 mb-4">
                    <div class="flex-1">
                        <label class="block mb-2">Группа:</label>
                        <select v-model="exportData.group_id" @change="loadGroupSubjects"
                            class="w-full p-2 border rounded">
                            <option value="">Выберите группу</option>
                            <option v-for="group in groups" :key="group.group_id" :value="group.group_id">
                                {{ group.group_number }}
                            </option>
                        </select>
                    </div>
                    <div class="flex-1">
                        <label class="block mb-2">Предмет:</label>
                        <select v-model="exportData.subject_id" :disabled="!exportData.group_id || groupSubjectsLoading"
                            class="w-full p-2 border rounded">
                            <option value="">Выберите предмет</option>
                            <option v-for="subject in groupSubjects" :key="subject.subject_id"
                                :value="subject.subject_id">
                                {{ subject.subject_name }}
                            </option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button @click="exportExcel"
                            :disabled="!exportData.group_id || !exportData.subject_id || exportLoading"
                            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                            <span v-if="exportLoading">Генерация...</span>
                            <span v-else>Экспорт</span>
                        </button>
                    </div>
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
            statsData: null,
            groups: [],
            subjects: [],
            exportData: {
                group_id: '',
                subject_id: ''
            },
            groupSubjects: [],
            groupSubjectsLoading: false,
            exportLoading: false

        };
    },
    async mounted() {
        await this.loadStats();
        // await this.loadGroups();
        // await this.loadSubjects();
    },
    methods: {
        // async loadStats() {
        //     try {
        //         const token = localStorage.getItem('token');
        //         // const res = await axios.get('/api/stats/current-zeros', {
        //         const res = await axios.get('http://localhost:3000/api/stats/current-zeros', {
        //             headers: { Authorization: `Bearer ${token}` }
        //         });
        //         this.statsData = res.data;
        //     } catch (err) {
        //         console.error('Ошибка загрузки статистики:', err);
        //         if (err.response?.status === 401) {
        //             localStorage.removeItem('token');
        //             router.push('/login');
        //         }
        //     }
        // },
        async loadStats() {
            try {
                const token = localStorage.getItem('token');

                // Параллельные запросы
                const [statsRes, groupsRes, subjectsRes] = await Promise.all([
                    axios.get('https://backend-8qud.onrender.com/api/stats/current-zeros', {
                        // axios.get('http://localhost:3000/api/stats/current-zeros', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('https://backend-8qud.onrender.com/api/stats/groups', {
                        // axios.get('http://localhost:3000/api/stats/groups', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('https://backend-8qud.onrender.com/api/stats/subjects', {
                        // axios.get('http://localhost:3000/api/stats/subjects', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                this.statsData = statsRes.data;
                this.groups = groupsRes.data;
                this.subjects = subjectsRes.data;

            } catch (err) {
                console.error('Ошибка загрузки данных:', err);
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    router.push('/login');
                }
            }
        },
        logout() {
            localStorage.removeItem('token');
            router.push('/login');
        },
        archive() {
            router.push('/archive');
        },
        async loadGroupSubjects() {
            if (!this.exportData.group_id) {
                this.groupSubjects = [];
                this.exportData.subject_id = '';
                return;
            }

            this.groupSubjectsLoading = true;
            this.exportData.subject_id = '';

            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(
                    `https://backend-8qud.onrender.com/api/stats/group-subjects?group_id=${this.exportData.group_id}`,
                    // `http://localhost:3000/api/stats/group-subjects?group_id=${this.exportData.group_id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                this.groupSubjects = res.data;
            } catch (err) {
                console.error('Ошибка загрузки предметов группы:', err);
                this.groupSubjects = [];
            } finally {
                this.groupSubjectsLoading = false;
            }
        },

        async exportExcel() {
            try {
                if (!this.exportData.group_id || !this.exportData.subject_id) {
                    alert('Выберите группу и предмет');
                    return;
                }

                const token = localStorage.getItem('token');
                const params = new URLSearchParams({
                    group_id: this.exportData.group_id,
                    subject_id: this.exportData.subject_id
                });

                const response = await axios.get(
                    `https://backend-8qud.onrender.com/api/stats/export-grades?${params.toString()}`,
                    // `/api/stats/export-grades?${params.toString()}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        responseType: 'blob'
                    }
                );

                console.log(response)
                console.log('Все заголовки:', response.headers);

                // Получаем имя файла из заголовков
                const contentDisposition = response.headers['content-disposition']; // ← lowercase!
                // console.log(contentDisposition);

                let fileName = 'оценки.xlsx';

                if (contentDisposition) {
                    // console.log('contentDisposition')
                    const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                    console.log(fileNameMatch)
                    if (fileNameMatch && fileNameMatch[1]) {
                        fileName = decodeURIComponent(fileNameMatch[1])
                            .trim() // удаляем пробелы по краям
                            .replace(/[^\wа-яёЁ\-().]/gi, '_') // заменяем спецсимволы на _
                            .replace(/_+/g, '_') // удаляем дубли _
                            .replace(/_+$/, ''); // удаляем _ в конце

                        // 3. Фикс для браузеров: добавляем расширение, если его нет
                        if (!fileName.toLowerCase().endsWith('.xlsx')) {
                            fileName += '.xlsx';
                        }
                    }
                }

                // // Создаем ссылку для скачивания
                // const url = window.URL.createObjectURL(new Blob([response.data]));
                // const link = document.createElement('a');
                // link.href = url;
                // link.setAttribute('download', fileName);
                // document.body.appendChild(link);
                // link.click();
                // link.remove();

                // 4. Альтернативный метод скачивания (обходит баг браузера)
                const blob = new Blob([response.data]);
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;

                // 5. Важный фикс - добавляем задержку перед удалением
                link.style.display = 'none';
                document.body.appendChild(link);
                setTimeout(() => {
                    link.click();
                    setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }, 100);
                }, 50);

            } catch (err) {
                console.error('Ошибка экспорта:', err);

                if (err.response?.data?.message) {
                    alert(`Ошибка: ${err.response.data.message}`);
                } else {
                    alert('Произошла ошибка при экспорте данных');
                }
            }
        }
    }
};
</script>

<style scoped>
.stats-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}
</style>