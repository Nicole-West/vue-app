<template>
  <div class="page-center">
    <div class="container">
      <h2 class="text-xl mb-4">Регистрация</h2>
      <input v-model="first_name" placeholder="Имя" class="input" />
      <input v-model="middle_name" placeholder="Отчество" class="input" />
      <input v-model="last_name" placeholder="Фамилия" class="input" />
      <input v-model="email" type="email" placeholder="Email" class="input" />
      <input v-model="password" type="password" placeholder="Пароль" class="input" />
      <button @click="register" class="btn">Зарегистрироваться</button>
    </div>
  </div>

</template>

<script setup>
import { ref } from 'vue';

const first_name = ref('');
const middle_name = ref('');
const last_name = ref('');
const email = ref('');
const password = ref('');

const register = async () => {
  console.log('[REGISTER] POST /api/auth/register', email.value);

  const res = await fetch('https://backend-8qud.onrender.com/api/auth/register', {
    // const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: first_name.value,
      middle_name: middle_name.value,
      last_name: last_name.value,
      email: email.value,
      password: password.value,
    }),
  });

  const data = await res.json();
  alert(data.message);
};
</script>
