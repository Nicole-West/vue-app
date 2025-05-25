<template>
    <div class="flex flex-col min-h-screen">
        <header class="header">
            <router-link to="/admin" class="logo">
                Admin
            </router-link>
            <button @click="logout" class="logout-button">
                Выйти
            </button>
        </header>

        <main class="main flex-1 p-4">
            <h2 class="text-2xl font-bold mb-4">Добро пожаловать, Администратор!</h2>

            <div class="admin_menu">
                <router-link to="/admin/approve-users" class="btn_admin">Подтверждение пользователей</router-link>

                <router-link to="/admin/next-month" class="btn_admin">Перейти на следующий месяц</router-link>
                <router-link to="/admin/next-semester" class="btn_admin">Перейти на следующий семестр</router-link>
                <router-link to="/admin/promote-students" class="btn_admin ">Перевести студентов на следующий
                    курс</router-link>

            </div>

            <!-- Здесь может быть дополнительный контент -->
        </main>

        <footer class="footer">
            © 2025 Дипломная работа
        </footer>
    </div>
</template>

<script>
import { decodeToken } from '../utils/decodeJWT';
import router from '../router';

export default {
    data() {
        return {
            userName: '',
        };
    },
    mounted() {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const decoded = decodeToken(token);

        if (decoded.exp * 1000 < Date.now()) {
            console.log('Токен истёк!');
            localStorage.removeItem('token');
            router.push('/login');
            return;
        }

        if (decoded.role !== 'admin') {
            router.push('/login'); // защита от доступа неадминов
            return;
        }

        this.userName = decoded.name;
    },
    methods: {
        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('name');
            router.push('/login');
        },
    },
};
</script>

<style scope>
.admin_menu {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
}

.btn_admin {
    display: inline-block;
    padding: 0.35rem 1.25rem;
    min-width: 360px;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: .5rem;
    text-align: center;
    font-weight: 500;
    color: #3b82f6;
    text-decoration: none;
    transition: background-color 0.2s, border-color 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
</style>