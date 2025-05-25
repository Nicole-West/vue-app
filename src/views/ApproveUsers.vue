<template>
    <div class="flex flex-col min-h-screen">
        <header class="header">
            <router-link to="/admin" class="logo">Admin</router-link>
            <button @click="logout" class="logout-button">Выйти</button>
        </header>

        <main class="main flex-1 p-4">
            <h1 class="text-2xl font-bold mb-4">Подтверждение пользователей</h1>

            <div v-if="users.length">
                <table class="table-auto w-full mb-4">
                    <thead>
                        <tr>
                            <th class="px-4 py-2">Фамилия</th>
                            <th class="px-4 py-2">Имя</th>
                            <th class="px-4 py-2">Отчество</th>
                            <th class="px-4 py-2">Email</th>
                            <th class="px-4 py-2">Роль</th>
                            <th class="px-4 py-2">Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(user, index) in users" :key="user.user_id">
                            <td><input v-model="user.last_name" class="input" /></td>
                            <td><input v-model="user.first_name" class="input" /></td>
                            <td><input v-model="user.middle_name" class="input" /></td>
                            <td><input v-model="user.email" class="input" /></td>
                            <td>
                                <select v-model="user.role" class="input">
                                    <option value="senior_teacher">Старший преподаватель</option>
                                    <option value="teacher">Преподаватель</option>
                                    <option value="admin">Администратор</option>
                                </select>
                            </td>
                            <td>
                                <button @click="approveUser(user, index)" class="btn btn-green">Подтвердить</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else>
                <p>Нет пользователей, ожидающих подтверждения.</p>
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
            users: []
        };
    },
    async mounted() {
        const token = localStorage.getItem('token');

        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const res = await axios.get('http://localhost:3000/api/admin/unapproved-users', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            this.users = res.data.users || [];
        } catch (err) {
            console.error('Ошибка при загрузке пользователей:', err);
        }
    },
    methods: {
        async approveUser(user, index) {
            const token = localStorage.getItem('token');
            try {
                await axios.put(`http://localhost:3000/api/admin/approve-user/${user.user_id}`, user, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                this.users.splice(index, 1); // Удаляем пользователя из списка после подтверждения
            } catch (err) {
                console.error('Ошибка при подтверждении:', err);
            }
        },
        logout() {
            localStorage.removeItem('token');
            router.push('/login');
        }
    }
};
</script>

<style scoped>
.input {
    margin-bottom: 0;
    border: 1px solid #ccc;
    /* Замените на нужный цвет */
    padding: 0.25rem 0.5rem;
    /* px-2 py-1 */
    width: 100%;
    /* w-full */
}

.btn {
    margin: 0;
    margin-top: 0;
    padding: 0.25rem 0.75rem;
    /* px-3 py-1 */
    border-radius: 0.25rem;
    /* rounded */
    color: white;
    /* text-white */
}

.btn-green {
    background-color: #4caf50;
    /* bg-green-600 */
}

.btn-green:hover {
    background-color: #388e3c;
    /* hover:bg-green-700 */
}
</style>