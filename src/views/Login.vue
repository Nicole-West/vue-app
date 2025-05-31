<!-- <template>
  <div class="p-4 max-w-md mx-auto">
    <h2 class="text-xl mb-4">Вход</h2>
    <input v-model="email" type="email" placeholder="Email" class="input" />
    <input v-model="password" type="password" placeholder="Пароль" class="input" />
    <button @click="login" class="btn">Войти</button>
    <p class="mt-2 text-sm">Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link></p>
  </div>
</template> -->

<template>
  <div class="page-center">
    <div class="container">
      <h2 class="text-xl mb-6">Вход</h2>
      <input v-model="email" type="email" placeholder="Email" class="input" />
      <input v-model="password" type="password" placeholder="Пароль" class="input" />
      <button @click="login" class="btn">Войти</button>
      <p class="mt-4 text-sm">Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { decodeToken } from '../utils/decodeJWT';

const router = useRouter();
const email = ref('');
const password = ref('');

const login = async () => {
  console.log('[LOGIN] POST /api/auth/login', email.value);

  // const res = await fetch('https://backend-8qud.onrender.com/api/auth/login', {
  const res = await fetch('https://backend-8qud.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.value, password: password.value }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || 'Ошибка входа');
    return; // Прерываем выполнение, если ошибка
  }

  if (!data.token || typeof data.token !== 'string') {
    alert('Сервер не вернул токен');
    return;
  }

  console.log('Ответ сервера:', data);

  const token = data.token;
  const decoded = decodeToken(token);

  if (res.ok) {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', decoded.user_id);
    localStorage.setItem('name', decoded.name);
    localStorage.setItem('role', decoded.role);

    if (decoded.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/my');
    }

  } else {
    alert(data.message);
  }
};
</script>
