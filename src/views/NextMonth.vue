<template>
    <div class="flex flex-col min-h-screen">
        <header class="header">
            <router-link to="/admin" class="logo">Admin</router-link>
            <button @click="logout" class="logout-button">Выйти</button>
        </header>

        <main class="main flex-1 p-4">
            <h2 class="text-2xl font-bold mb-4">Перевод на следующий месяц</h2>

            <div class="mb-4">
                <p><strong>Текущий учебный год:</strong> {{ currentYear }}</p>
                <p><strong>Текущий месяц:</strong> {{ currentMonth }}</p>
            </div>

            <button @click="moveToNextMonth" class="btn">Перейти на следующий месяц</button>

            <div v-if="statusMessage" class="mt-4 text-green-600">
                {{ statusMessage }}
            </div>
            <div v-if="errorMessage" class="mt-4 text-red-600">
                {{ errorMessage }}
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
            currentMonth: null,
            currentYear: null,
            statusMessage: '',
            errorMessage: ''
        };
    },
    async mounted() {
        try {
            const res = await axios.get('https://backend-8qud.onrender.com/api/month/current-month');
            // const res = await axios.get('http://localhost:3000/api/month/current-month');
            this.currentMonth = res.data.month;
            this.currentYear = res.data.year;
        } catch (err) {
            console.error(err);
            this.errorMessage = 'Не удалось загрузить текущий месяц';
        }
    },
    methods: {
        async moveToNextMonth() {
            this.statusMessage = '';
            this.errorMessage = '';
            try {
                const response = await axios.post('https://backend-8qud.onrender.com/api/month/next-month');
                // const response = await axios.post('http://localhost:3000/api/month/next-month');
                // const data = await response.json();
                console.log(response.data);

                this.statusMessage = `Перешли на следующий месяц: ${response.data.nextMonth}`;
                // Обновляем текущие значения
                this.currentMonth = response.data.nextMonth;
            } catch (err) {
                console.error(err);
                if (err.response) {
                    // Сервер ответил с кодом ошибки (4xx, 5xx)
                    this.errorMessage = err.response.data.error || 'Ошибка сервера при переходе на следующий месяц';
                } else if (err.request) {
                    // Запрос был сделан, но ответ не получен
                    this.errorMessage = 'Не получен ответ от сервера';
                } else {
                    // Ошибка при настройке запроса
                    this.errorMessage = 'Ошибка при отправке запроса';
                }
            }
        },
        logout() {
            localStorage.clear();
            router.push('/login');
        }
    }
};
</script>