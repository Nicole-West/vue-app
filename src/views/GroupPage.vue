<template>
  <div class="flex flex-col min-h-screen">
    <header class="header">
      <router-link to="/my" class="logo">
        Home
      </router-link>
      <button @click="logout" class="logout-button">
        Выйти
      </button>
    </header>

    <main class="p-4 flex-1">
      <!-- <h1 class="text-xl font-bold mb-4">Группа № {{ groupId }}</h1> -->

      <h2 class=" margin text-lg font-semibold mb-2">Выберите предмет</h2>

      <!-- <select v-model="selectedSubject" @change="fetchGrades" class="mb-4">
      <option disabled value="">Выберите предмет</option>
      <option v-for="subject in subjects" :key="subject.subject_id" :value="subject.subject_id">
        {{ subject.subject_name }}
      </option>
    </select> -->

      <select class="select" v-model="selectedSubject" @change="fetchGrades">
        <option disabled value="">Выберите предмет</option>
        <option v-for="subject in subjects" :key="subject.subject_id" :value="subject.subject_id">
          {{ subject.subject_name }}
        </option>
      </select>

      <h2 class="text-lg font-semibold mb-2">Список студентов</h2>
      <!-- <ul class="list-disc pl-6">
        <li v-for="student in students" :key="student.student_id">
          {{ student.full_name }} - 
          <span v-if="selectedSubject">
            <input 
              v-model="student.grade" 
              :disabled="!selectedSubject" 
              type="text" 
              placeholder="Оценка"
            />
          </span>
        </li>
      </ul> -->

      <table class="table">
        <thead>
          <tr>
            <th>Студент</th>
            <th>Оценка</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.id">
            <td>{{ student.full_name }}</td>
            <td>
              <input v-model="student.grade" type="text" class="input input-small" />
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4 flex justify-between">
        <router-link to="/my" class="back-button">← Назад</router-link>
        <button v-if="selectedSubject" @click="saveGrades"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Сохранить
        </button>
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
import router from '../router'; // Добавляем роутер

export default {
  data() {
    return {
      groupId: this.$route.params.id,
      students: [],
      subjects: [],          // Список предметов
      selectedSubject: '',   // Выбранный предмет
      originalGrades: {}, // Для хранения исходных оценок для сравнения
      initialGrades: {}, // Храним первоначальные оценки для сравнения
      // grades: {},
      userId: ''
    };
  },
  async mounted() {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = decodeToken(token);
      this.userId = decoded.user_id;

      const { data: subjectsData } = await axios.get(`https://backend-8qud.onrender.com/api/group/${this.groupId}/subjects/${this.userId}`, {
        // const { data: subjectsData } = await axios.get(`http://localhost:3000/api/group/${this.groupId}/subjects/${this.userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('[GET] /api/group/subjects →', subjectsData);
      this.subjects = subjectsData.subjects;
    } catch (error) {
      console.error('Ошибка загрузки предметов:', error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  },
  methods: {
    // Получаем оценки для выбранного предмета
    async fetchGrades() {
      if (!this.selectedSubject) return;

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const { data } = await axios.get(`https://backend-8qud.onrender.com/api/group/${this.groupId}/subject/${this.selectedSubject}/grades`, {
          // const { data } = await axios.get(`http://localhost:3000/api/group/${this.groupId}/subject/${this.selectedSubject}/grades`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        this.students = data.students;
        // Сохраняем начальные оценки
        this.initialGrades = {};
        this.students.forEach(student => {
          this.initialGrades[student.student_id] = student.grade;
        });

      } catch (error) {
        console.error('Ошибка загрузки оценок:', error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      }
    },
    async saveGrades() {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Фильтруем только изменившиеся оценки
        const changedGrades = this.students
          .filter(student => {
            const initialGrade = this.initialGrades[student.student_id];
            // Сравниваем текущую оценку с первоначальной
            return student.grade !== initialGrade;
          })
          .map(student => ({
            student_id: student.student_id,
            grade: student.grade,
            initial_grade: this.initialGrades[student.student_id] // Для дебага
          }));

        if (changedGrades.length === 0) {
          alert('Нет изменений для сохранения!');
          return;
        }
        await axios.post(`https://backend-8qud.onrender.com/api/group/${this.groupId}/subject/${this.selectedSubject}/grades`,
          // await axios.post(`http://localhost:3000/api/group/${this.groupId}/subject/${this.selectedSubject}/grades`,
          {
            grades: changedGrades,
            editor_id: this.userId // Добавляем ID пользователя
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );

        // Обновляем оригинальные оценки после сохранения
        changedGrades.forEach(item => {
          this.initialGrades[item.student_id] = item.grade;
        });

        alert('Оценки успешно сохранены!');
      } catch (error) {
        console.error('Ошибка сохранения оценок:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        } else {
          alert('Ошибка сохранения!');
        }
      }
    }
  }
};
</script>