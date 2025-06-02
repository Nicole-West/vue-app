<template>
    <div>
        <h2 class="text-xl font-bold mb-4">Переход на следующий учебный год</h2>

        <div v-if="loading">Загрузка...</div>
        <div v-else-if="error" class="text-red-500 mb-4">{{ error }}</div>
        <div v-else>
            <p class="mb-4">Текущий учебный год: <strong>{{ currentYear }}</strong></p>
            <p class="mb-4">Следующий учебный год: <strong>{{ nextYear }}</strong></p>
            <button class="btn_admin" @click="startTransition" :disabled="processing">
                <span v-if="processing">Обработка...</span>
                <span v-else>Продолжить</span>
            </button>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        currentYear: String,
        nextYear: String,
        currentYearId: Number
    },
    data() {
        return {
            loading: false,
            processing: false,
            error: null
        };
    },
    methods: {
        async startTransition() {
            this.processing = true;
            try {
                this.$emit('next-step');
            } catch (err) {
                this.error = 'Ошибка при подготовке перехода';
                console.error(err);
            } finally {
                this.processing = false;
            }
        }
    }
};
</script>