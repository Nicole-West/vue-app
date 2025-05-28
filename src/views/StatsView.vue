<template>
    <div class="flex flex-col min-h-screen">
        <main class="main flex-1 p-4">
            <h1 class="text-2xl font-bold mb-6">Статистика текущей аттестации</h1>

            <!-- 1. Общее количество неаттестаций -->
            <div class="stats-card mb-6">
                <h2 class="text-xl font-semibold mb-4">Неаттестации (пропуски)</h2>
                <p class="text-lg">Всего: <span class="font-bold">{{ statsData?.total_failed || 0 }}</span></p>
            </div>

            <!-- 2. Студенты с 3+ нулями -->
            <div class="stats-card mb-6">
                <h2 class="text-xl font-semibold mb-4">Студенты с 3+ нулевыми оценками</h2>
                <div v-if="statsData?.students_with_3plus_zeros?.length">
                    <div v-for="student in statsData.students_with_3plus_zeros" :key="student.student_id"
                        class="mb-2 p-2 bg-red-100 rounded">
                        {{ student.full_name }} ({{ student.group_number }}): {{ student.zero_count }} нулей
                    </div>
                </div>
                <p v-else>Нет студентов с 3+ нулевыми оценками</p>
            </div>

            <!-- 3. Неаттестации по группам и предметам -->
            <div class="stats-card">
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
        </main>
    </div>
</template>

<script>
import axios from 'axios';
import router from '../router';

export default {
    data() {
        return {
            statsData: null
        };
    },
    async mounted() {
        await this.loadStats();
    },
    methods: {
        async loadStats() {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/stats/current-zeros', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.statsData = res.data;
            } catch (err) {
                console.error('Ошибка загрузки статистики:', err);
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