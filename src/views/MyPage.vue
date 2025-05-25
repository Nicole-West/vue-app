Code

<template>
  <div class="flex flex-col min-h-screen">
    <header class="header">
      <router-link to="/my" class="logo"> Home </router-link>
      <div>
        <button @click="archive" class="archive-button">
          Архив
        </button>
        <button @click="logout" class="logout-button">
          Выйти
        </button>
      </div>

    </header>

    <main class="main flex-1">
      <div v-if="dashboard">
        <div class="text-lg font-semibold">
          <h2 class="text-2xl font-bold mb-4">Добро пожаловать, {{ userName }}!</h2>
          <!-- <h2 class=" margin-bottom text-2xl font-bold mb-4">Добро пожаловать!</h2> -->
        </div>
        <div class="mb-4">
          <p><strong>Учебный год:</strong> {{ dashboard.year.year }}</p>
          <p><strong>Семестр:</strong> {{ dashboard.semester.semester_number }}</p>
          <p><strong>Месяц:</strong> {{ dashboard.month.month }} <span
              v-if="dashboard.month.is_attestation_month">(Аттестация)</span></p>
        </div>

        <div v-for="(groups, courseName) in dashboard.groupsByCourse" :key="courseName" class="mb-6">
          <h3 class="text-xl font-semibold mb-2">{{ courseName }}</h3>
          <div class="flex flex-wrap gap-2">
            <router-link v-for="group in groups" :key="group.group_id" :to="`/group/${group.group_id}`"
              class="group-card">
              {{ group.group_number }}
            </router-link>
          </div>
        </div>
      </div>

      <div v-else>
        <p>Загрузка...</p>
      </div>

    </main>

    <footer class="footer">
      © 2025 Дипломная работа
    </footer>
  </div>
</template>

<script>
import axios from 'axios';
import { decodeToken } from '../utils/decodeJWT';
import router from '../router';

export default {
  data() {
    return {
      dashboard: null,
      userName: ''
    };
  },
  async mounted() {
    const token = localStorage.getItem('token');
    const decoded = decodeToken(token);
    this.userName = decoded.name;

    if (!token) {
      router.push('/');  // Если токен отсутствует, перенаправляем на страницу входа
      return;
    }

    try {
      const decoded = decodeToken(token);

      // Проверка истечения токена
      if (decoded.exp * 1000 < Date.now()) {
        console.log('Токен истёк!');
        localStorage.removeItem('token'); // Удаляем просроченный токен
        router.push('/login');
        return;
      }

      this.userName = decoded.name;

      const res = await axios.get('/api/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      this.dashboard = res.data;
      console.log('[GET] /api/dashboard →', res.data);
    } catch (err) {
      console.error('Ошибка загрузки:', err);

      // Если ошибка авторизации (например, токен плохой)
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    }

    // try {
    //   const res = await axios.get('http://localhost:3000/api/dashboard', {
    //     headers: {
    //       Authorization: `Bearer ${token}`
    //     }
    //   });
    //   this.dashboard = res.data;
    //   console.log('[GET] /api/dashboard →', res.data);
    // } catch (err) {
    //   console.error('Ошибка загрузки:', err);
    // }
  },
  methods: {
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('name');
      router.push('/login');
    },
    archive() {
      router.push('/archive');
    }
  }
};
</script>
